// src/services/sqlAgent.service.ts
import "dotenv/config";
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { SqlToolkit, createSqlAgent } from "langchain/agents/toolkits/sql";
import { ChatOpenAI } from "@langchain/openai";
import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
  START,
  END,
} from "@langchain/langgraph";
import { sendNotification } from "../types/notifier";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type AgentResult = {
  rawText?: string;
  toolResponses?: any;
};

/**
 * SqlAgentService: LangChain SQL Agent + LangGraph orchestrator
 */
export class SqlAgentService {
  private ds!: DataSource;
  private sqlDb!: SqlDatabase;
  private toolkit!: SqlToolkit;
  private llm!: ChatOpenAI;
  private agentExecutor: any;
  private graph: any;

  constructor() {}

  async init() {
    if (this.agentExecutor) return; // already initialized

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");

    this.ds = new DataSource({
      type: "mysql",
      url: databaseUrl,
      synchronize: false,
      logging: false,
    });
    await this.ds.initialize();

    this.sqlDb = await SqlDatabase.fromDataSourceParams({
      appDataSource: this.ds,
    });
    this.toolkit = new SqlToolkit(this.sqlDb);

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error("OPENAI_API_KEY is required in .env");

    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: openaiKey,
    });

    // create SQL agent executor
    this.agentExecutor = await createSqlAgent(this.llm, this.toolkit);

    // LangGraph pipeline
    const sg = new StateGraph(MessagesAnnotation)
      .addNode("db_agent", async (state: any) => {
        // Use MessagesAnnotation directly as key
        const messages = state[MessagesAnnotation as any] || [];
        const last = messages[messages.length - 1];
        const userInput = last?.content ?? "";

        const runResult = await this.agentExecutor.call({ input: userInput });

        return {
          [MessagesAnnotation as any]: [
            ...messages,
            {
              role: "assistant",
              content: runResult.output ?? JSON.stringify(runResult),
            },
          ],
        };
      })
      .addEdge("db_agent", END);

    this.graph = sg.compile({ checkpointer: new MemorySaver() });

    // schedule payment reminders daily at 07:00
    cron.schedule("0 7 * * *", async () => {
      try {
        await this.runPaymentReminders();
      } catch (e) {
        console.error("Payment reminders failed", e);
      }
    });

    console.log("SqlAgentService initialized");
  }

  async runNaturalQuery(userInput: string): Promise<AgentResult> {
    await this.init();
    const run = await this.graph.invoke({
      messages: [{ role: "user", content: userInput }],
    });
    const messages = (run as any)[MessagesAnnotation as any] || [];
    const last = messages[messages.length - 1];
    return { rawText: last?.content };
  }

  async findApplicantsForJob(jobId: number) {
    const prompt = `Retrieve all applicants for job id = ${jobId} including applicant id, name, skills, application status and appliedAt. Return results as a concise table.`;
    return this.runNaturalQuery(prompt);
  }

  async searchJobSeekers(query: string) {
    const prompt = `Search job seekers where skills or location or name match "${query}". Return id, name, skills, experience and location.`;
    return this.runNaturalQuery(prompt);
  }

  async matchJobSeekers(criteria: {
    skills?: string[];
    experience?: string;
    location?: string;
    salaryRange?: { min?: number; max?: number };
  }) {
    const parts: string[] = [];
    if (criteria.skills?.length)
      parts.push(`skills: ${criteria.skills.join(", ")}`);
    if (criteria.experience) parts.push(`experience: ${criteria.experience}`);
    if (criteria.location) parts.push(`location: ${criteria.location}`);
    if (criteria.salaryRange)
      parts.push(
        `salary between ${criteria.salaryRange.min ?? "0"} and ${
          criteria.salaryRange.max ?? "∞"
        }`
      );

    const prompt = `Match job seekers with criteria: ${parts.join(
      "; "
    )}. Return top 20 candidates with id, name, skills, experience, expectedSalary, location.`;
    return this.runNaturalQuery(prompt);
  }

  async adminFilterWorkers(filters: Record<string, any>) {
    const q = Object.entries(filters)
      .map(([k, v]) => `${k} = ${v}`)
      .join(", ");
    const prompt = `Filter job seekers where ${q}. Return id, name, skills, experience, location.`;
    return this.runNaturalQuery(prompt);
  }

  async proposeSqlAndApply(userInput: string, applyWrites = false) {
    await this.init();
    const probePrompt = `-- PROPOSE SQL ONLY\n-- For the user request: ${userInput}\n-- Output a JSON object with keys: { "type": "read"|"write", "sql": "<SQL_STATEMENT>" }\n-- Only output JSON.`;
    const run = await this.graph.invoke({
      messages: [{ role: "user", content: probePrompt }],
    });
    const messages = (run as any)[MessagesAnnotation as any] || [];
    const last = messages[messages.length - 1].content;
    let parsed: any;
    try {
      parsed = JSON.parse(last);
    } catch (e) {
      return { ok: false, error: "Agent did not return valid JSON", raw: last };
    }

    if (parsed.type === "read") {
      const results = await this.sqlDb.run(parsed.sql);
      return { ok: true, results };
    }

    if (parsed.type === "write") {
      if (!applyWrites) {
        return {
          ok: true,
          type: "write",
          sql: parsed.sql,
          info: "applyWrites=false so not executed",
        };
      }
      return {
        ok: false,
        error: "Write operations require manual review or proper authorization",
      };
    }

    return { ok: false, error: "Unknown type returned by agent" };
  }

  async runPaymentReminders() {
    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + 2);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: { dueDate: { gte: start, lte: end }, status: "pending" },
      include: {
        employer: { include: { user: true } },
        jobSeeker: { include: { user: true } },
      },
    });

    for (const p of payments) {
      const email = p.employer?.user?.email ?? "admin@example.com";
      const subject = `Payment due in 2 days - payment #${p.id}`;
      const body = `Payment #${p.id} of ${p.amount} is due on ${p.dueDate.toISOString()}`;
      await sendNotification(email, subject, body);
    }

    return { reminded: payments.length };
  }
}
