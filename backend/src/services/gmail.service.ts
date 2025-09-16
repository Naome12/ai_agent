import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { DynamicTool } from "langchain/tools";

// ===== Gmail Client Setup =====
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];
const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

async function getGmailClient() {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const credentials = JSON.parse(content);

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8")));
  } else {
    throw new Error("⚠️ Run the OAuth flow to generate token.json");
  }

  return google.gmail({ version: "v1", auth: oAuth2Client });
}

// ===== Unified Gmail Agent Service =====
export class GmailAgentService {
  private executor: any;

  async init() {
    if (this.executor) return this.executor;

    const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });

    // Define Gmail Tools
    const tools = [
      new DynamicTool({
        name: "list_unread_emails",
        description: "List unread emails, optionally filtered by subject",
        func: async (input) => {
          const gmail = await getGmailClient();
          const res = await gmail.users.messages.list({
            userId: "me",
            q: `is:unread ${input ? "subject:" + input : ""}`,
          });
          return JSON.stringify(res.data.messages || []);
        },
      }),
      new DynamicTool({
        name: "read_email",
        description: "Read a specific email by messageId",
        func: async (messageId) => {
          const gmail = await getGmailClient();
          const res = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full",
          });
          return JSON.stringify(res.data);
        },
      }),
      new DynamicTool({
        name: "send_email",
        description:
          "Send an email. Input JSON: { to: string[], subject: string, body: string }",
        func: async (input) => {
          const { to, subject, body } = JSON.parse(input);
          const gmail = await getGmailClient();

          const message = [
            `To: ${to.join(", ")}`,
            `Subject: ${subject}`,
            "Content-Type: text/html; charset=UTF-8",
            "",
            body,
          ].join("\n");

          const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

          await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw: encodedMessage },
          });

          return "✅ Email sent successfully!";
        },
      }),
    ];

    this.executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "openai-functions",
      verbose: true,
    });

    return this.executor;
  }

  async invoke(input: string) {
    const exec = await this.init();
    return exec.invoke({ input });
  }
}
