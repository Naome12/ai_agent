// src/gmailAgent.service.ts
import dotenv from "dotenv";
dotenv.config();

import util from "util";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import {
  GmailCreateDraft,
  GmailGetMessage,
  GmailSearch,
  GmailSendMessage,
} from "@langchain/community/tools/gmail";
import { DataSource } from "typeorm";

type DebugLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export class GmailAgentService {
  private executor: any | null = null;
  private dataSource: DataSource | null = null;

  private log(level: DebugLevel, msg: string, obj?: any) {
    const time = new Date().toISOString();
    if (obj === undefined) {
      console.log(`[GMAIL-DBG] [${time}] [${level}] ${msg}`);
    } else {
      console.log(
        `[GMAIL-DBG] [${time}] [${level}] ${msg}\n${util.inspect(obj, {
          depth: 3,
          colors: false,
          maxArrayLength: 50,
        })}`
      );
    }
  }

  private sanitizeCredentials(creds: any) {
    if (!creds) return null;
    return {
      has_access_token: !!creds.access_token,
      has_refresh_token: !!creds.refresh_token,
      scope: creds.scope,
      token_type: creds.token_type,
      expiry_date: creds.expiry_date
        ? new Date(creds.expiry_date).toISOString()
        : null,
    };
  }

  private safeErr(err: any) {
    if (!err) return null;
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return {
      message: err.message ?? err.toString?.() ?? "unknown",
      statusCode: err.code ?? err.status ?? null,
      errors: err.errors ?? undefined,
    };
  }

  // ---------------- Database Initialization ----------------
  private async initDatabase(): Promise<DataSource> {
    if (this.dataSource) return this.dataSource;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");

    this.dataSource = new DataSource({
      type: "mysql",
      url: databaseUrl,
      synchronize: false,
      logging: false,
    });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  // ---------------- Fetch Employer Emails ----------------
  private async fetchEmployerEmails(): Promise<string[]> {
    try {
      const ds = await this.initDatabase();

      const results = await ds.query(`
        SELECT user.email 
        FROM employer 
        JOIN user ON employer.userId = user.id 
        WHERE user.email IS NOT NULL AND user.email != ''
      `);

      return results.map((row: any) => row.email).filter(Boolean);
    } catch (error) {
      this.log("ERROR", "Failed to fetch employer emails", {
        err: this.safeErr(error),
      });
      throw new Error("Failed to fetch employer emails from database");
    }
  }

  // ---------------- Send Bulk Email ----------------
  private async sendBulkEmail(
    toEmails: string[],
    subject: string,
    body: string
  ): Promise<void> {
    const oAuth2Client = await this.getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    for (const email of toEmails) {
      try {
        const message = [
          `To: ${email}`,
          "Content-Type: text/html; charset=utf-8",
          "MIME-Version: 1.0",
          `Subject: ${subject}`,
          "",
          body,
        ].join("\n");

        const encodedMessage = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });

        this.log("INFO", `Email sent to: ${email}`);
      } catch (error) {
        this.log("ERROR", `Failed to send email to ${email}`, {
          err: this.safeErr(error),
        });
      }
    }
  }

  // ---------------- Extract Email Content ----------------
  private extractEmailContent(input: string): { subject: string; body: string } {
    const lowerInput = input.toLowerCase();
    let subject = "Important Message from Management";
    let body =
      "Dear Employer,\n\nThis is an important message from management.\n\nThank you,\nManagement Team";

    if (lowerInput.includes("subject") || lowerInput.includes("about")) {
      const subjectMatch =
        input.match(/subject[:\s]*([^\n\.]+)/i) ||
        input.match(/about[:\s]*([^\n\.]+)/i);
      if (subjectMatch) subject = subjectMatch[1].trim();
    }

    if (
      lowerInput.includes("say") ||
      lowerInput.includes("telling them") ||
      lowerInput.includes("message") ||
      lowerInput.includes("tell them")
    ) {
      const messageMatch =
        input.match(/say[:\s]*([^\n\.]+)/i) ||
        input.match(/telling them[:\s]*([^\n\.]+)/i) ||
        input.match(/message[:\s]*([^\n\.]+)/i) ||
        input.match(/tell them[:\s]*([^\n\.]+)/i);
      if (messageMatch) {
        body = `Dear Employer,\n\n${messageMatch[1].trim()}\n\nThank you,\nManagement Team`;
      }
    }

    if (lowerInput.includes("monthly report")) {
      subject = "Monthly Report Submission Reminder";
      body = `Dear Employer,\n\nPlease remember to submit your monthly report by the end of this week. ${
        lowerInput.includes("urgent") ? "This is an urgent reminder." : ""
      }\n\nThank you,\nManagement Team`;
    }

    return { subject, body };
  }

  // ---------------- Gmail OAuth2 client ----------------
  private async getOAuth2Client(): Promise<OAuth2Client> {
    this.log("INFO", "getOAuth2Client: Start");

    const client_id = process.env.GMAIL_CLIENT_ID;
    const client_secret = process.env.GMAIL_CLIENT_SECRET;
    const redirect_uri = process.env.GMAIL_REDIRECT_URI;
    const access_token = process.env.GMAIL_ACCESS_TOKEN;
    const refresh_token = process.env.GMAIL_REFRESH_TOKEN;

    if (!client_id || !client_secret || !redirect_uri) {
      throw new Error(
        "GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or GMAIL_REDIRECT_URI missing in environment"
      );
    }

    if (!access_token || !refresh_token) {
      throw new Error(
        "GMAIL_ACCESS_TOKEN or GMAIL_REFRESH_TOKEN missing in environment"
      );
    }

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri
    );

    oAuth2Client.setCredentials({
      access_token,
      refresh_token,
      scope: process.env.GMAIL_SCOPE || "https://mail.google.com/",
    });

    // Sanity check Gmail API
    try {
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
      const profile = await gmail.users.getProfile({ userId: "me" });
      this.log("INFO", "gmail.users.getProfile OK", {
        emailAddress: profile.data.emailAddress,
      });
    } catch (err) {
      this.log("ERROR", "Gmail API test failed", { err: this.safeErr(err) });
      throw new Error(`Gmail API test failed: ${this.safeErr(err)}`);
    }

    return oAuth2Client;
  }

  // ---------------- Agent init ----------------
  async init() {
    this.log("INFO", "init: starting LangChain agent initialization");
    if (this.executor) return this.executor;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error("OPENAI_API_KEY is required in .env");

    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || "gpt-4o",
      temperature: 0,
      openAIApiKey: openaiKey,
      streaming: false,
      maxTokens: 1024,
    });

    const oAuth2Client = await this.getOAuth2Client();

    const getAccessToken = async () => {
      const token = await oAuth2Client.getAccessToken();
      if (typeof token === "string") return token;
      else if (token && token.token) return token.token;
      throw new Error("Unable to retrieve access token");
    };

    const gmailConfig = {
      credentials: { accessToken: getAccessToken },
      scopes: ["https://mail.google.com/"],
    };

    const tools = [
      new GmailSendMessage(gmailConfig),
      new GmailSearch(gmailConfig),
      new GmailGetMessage(gmailConfig),
    ];

    this.log("INFO", "Instantiated Gmail tools for agent", {
      toolCount: tools.length,
      toolNames: tools.map((t: any) => t.constructor?.name),
    });

    try {
      this.executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: "structured-chat-zero-shot-react-description",
        verbose: true,
        maxIterations: 10,
        earlyStoppingMethod: "generate",
      });
      this.log("INFO", "initializeAgentExecutorWithOptions OK");
    } catch (err) {
      this.log("ERROR", "Failed to initialize agent executor", {
        err: this.safeErr(err),
      });
      throw err;
    }

    return this.executor;
  }

  // ---------------- Agent invocation ----------------
  async invoke(input: string) {
    this.log("INFO", "invoke: start", { input });

    try {
      const lowerInput = input.toLowerCase();
      const isBulkEmployerEmail =
        lowerInput.includes("all employers") ||
        lowerInput.includes("every employer") ||
        lowerInput.includes("each employer") ||
        (lowerInput.includes("employers") &&
          (lowerInput.includes("send") || lowerInput.includes("email")));

      if (isBulkEmployerEmail) {
        const { subject, body } = this.extractEmailContent(input);
        const employerEmails = await this.fetchEmployerEmails();

        if (employerEmails.length === 0) {
          return {
            success: false,
            output: "No employer emails found in the database.",
          };
        }

        await this.sendBulkEmail(employerEmails, subject, body);

        return {
          success: true,
          output: `Successfully sent email to ${employerEmails.length} employers. Subject: "${subject}"\n\nMessage: ${body}`,
        };
      }

      const exec = await this.init();
      if (exec.memory) exec.memory.clear?.();
      const res = await exec.invoke({ input });

      this.log("INFO", "invoke: agent returned", {
        outputSnippet:
          typeof res.output === "string"
            ? res.output.slice(0, 300)
            : "Non-string output",
        outputType: typeof res.output,
      });

      return { success: true, output: res.output ?? res };
    } catch (err: any) {
      this.log("ERROR", "GmailAgentService.invoke error", {
        err: this.safeErr(err),
        stack: err?.stack?.slice?.(0, 1000),
      });
      return {
        success: false,
        error: err?.message ?? String(err),
        output: null,
      };
    }
  }
}

// Optional standalone test
if (require.main === module) {
  (async () => {
    const svc = new GmailAgentService();
    try {
      console.log("Starting Gmail agent test...");
      const out = await svc.invoke(
        "Send email to all employers about monthly report submission"
      );
      console.log("\n=== TEST OUTPUT ===\n", out);
    } catch (err: any) {
      console.error("\nDIAGNOSTICS FAILED:", err?.message ?? err);
      process.exit(1);
    }
    process.exit(0);
  })();
}
