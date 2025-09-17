// src/gmailAgent.service.ts
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
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

type DebugLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export class GmailAgentService {
  private executor: any | null = null;
  private credentialsPath = process.env.GMAIL_CREDENTIALS_PATH || "./credentials.json";
  private tokenPath = process.env.GMAIL_TOKEN_PATH || "./token.json";

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
      expiry_date: creds.expiry_date ? new Date(creds.expiry_date).toISOString() : null,
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

  // ---------------- Gmail OAuth2 client ----------------
  private async getOAuth2Client(): Promise<OAuth2Client> {
    this.log("INFO", "getOAuth2Client: Start");

    if (!fs.existsSync(this.credentialsPath)) {
      throw new Error(`Google credentials not found at ${this.credentialsPath}`);
    }

    const rawCreds = fs.readFileSync(this.credentialsPath, "utf-8");
    const credentials = JSON.parse(rawCreds);
    const appCreds = credentials.installed ?? credentials.web;
    if (!appCreds) {
      throw new Error("credentials.json missing 'installed' or 'web' blocks");
    }

    const { client_id, client_secret, redirect_uris } = appCreds;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (!fs.existsSync(this.tokenPath)) {
      throw new Error(`Token file not found at ${this.tokenPath}`);
    }

    const tokenJson = JSON.parse(fs.readFileSync(this.tokenPath, "utf-8"));
    this.log("DEBUG", "Loaded token.json keys", this.sanitizeCredentials(tokenJson));
    oAuth2Client.setCredentials(tokenJson);

    // Refresh/ensure access token
    try {
      const atResult = await oAuth2Client.getAccessToken();
      this.log("INFO", "getAccessToken succeeded", { 
        token: typeof atResult === "string" ? "[string]" : { 
          token: atResult.token ? "[REDACTED]" : "null",
          res: atResult.res ? "[response object]" : "null"
        } 
      });
    } catch (err) {
      this.log("WARN", "getAccessToken failed (will still try Gmail API)", { err: this.safeErr(err) });
    }

    // Sanity check Gmail API
    try {
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
      const profile = await gmail.users.getProfile({ userId: "me" });
      this.log("INFO", "gmail.users.getProfile OK", { emailAddress: profile.data.emailAddress });
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
    const credentials = oAuth2Client.credentials;
    
    this.log("DEBUG", "Credentials for Gmail tools", this.sanitizeCredentials(credentials));

    // Create a function that returns the access token
    const getAccessToken = async () => {
      try {
        const token = await oAuth2Client.getAccessToken();
        if (typeof token === 'string') {
          return token;
        } else if (token && token.token) {
          return token.token;
        }
        throw new Error('Unable to retrieve access token');
      } catch (error) {
        this.log("ERROR", "Failed to get access token", { err: this.safeErr(error) });
        throw error;
      }
    };

    // Gmail tools configuration - the key difference is the credentials structure
    const gmailConfig = {
      credentials: {
        accessToken: getAccessToken, // Function that returns access token
        // Alternative: if you want to use a string token directly
        // accessToken: credentials.access_token,
      },
      scopes: ["https://mail.google.com/"], // Add required scopes
    };

    // Create tools with proper configuration
    const tools = [
      new GmailSendMessage(gmailConfig),
      // new GmailCreateDraft(gmailConfig), 
      new GmailSearch(gmailConfig),
      new GmailGetMessage(gmailConfig),
    ];

    // Log tool schemas for debugging
    this.log("DEBUG", "Tool schemas", {
      sendMessageSchema: tools[0].schema,
      // createDraftSchema: tools[1].schema,
      searchSchema: tools[1].schema,
      getMessageSchema: tools[2].schema,
    })

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
      this.log("ERROR", "Failed to initialize agent executor", { err: this.safeErr(err) });
      throw err;
    }

    return this.executor;
  }

  // ---------------- Agent invocation ----------------
  async invoke(input: string) {
    this.log("INFO", "invoke: start", { input });
    try {
      const exec = await this.init();
      if (exec.memory) exec.memory.clear?.();
      const res = await exec.invoke({ input });
      this.log("INFO", "invoke: agent returned", { 
        outputSnippet: typeof res.output === "string" ? res.output.slice(0, 300) : "Non-string output",
        outputType: typeof res.output
      });
      return { success: true, output: res.output ?? res };
    } catch (err: any) {
      this.log("ERROR", "GmailAgentService.invoke error", { 
        err: this.safeErr(err), 
        stack: err?.stack?.slice?.(0, 1000) 
      });
      return { 
        success: false, 
        error: err?.message ?? String(err), 
        output: null 
      };
    }
  }
}

// Run diagnostics if called directly
if (require.main === module) {
  (async () => {
    const svc = new GmailAgentService();
    try {
      console.log("Starting Gmail agent test...");
      const out = await svc.invoke("Show me unread emails about invoices");
      console.log("\n=== TEST OUTPUT ===\n", out);
    } catch (err: any) {
      console.error("\nDIAGNOSTICS FAILED:", err?.message ?? err);
      process.exit(1);
    }
    process.exit(0);
  })();
}