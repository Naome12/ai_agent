import dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { SqlToolkit, createSqlAgent } from "langchain/agents/toolkits/sql";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HumanMessage } from "@langchain/core/messages";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendNotification } from "../types/notifier";

const prisma = new PrismaClient();

type AgentResult = {
  rawText?: string;
  toolResponses?: any;
  rows?: any[];
  error?: string;
};

export class SqlAgentService {
  private ds!: DataSource;
  private sqlDb!: SqlDatabase;
  private toolkit!: SqlToolkit;
  private llm!: ChatOpenAI;
  private agentExecutor: any;
  private isInitialized = false;
  private schemaInfo: string = "";
  private columnMappings: Map<string, string[]> = new Map();

  async init() {
    if (this.isInitialized) return;

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

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) throw new Error("OPENAI_API_KEY is required in .env");

    this.llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
      openAIApiKey: openaiKey,
    });

    this.toolkit = new SqlToolkit(this.sqlDb, this.llm);

    this.agentExecutor = createSqlAgent(this.llm, this.toolkit, {
      topK: 10,
      prefix: `You are an agent designed to interact with a SQL database.
Given an input question, create a syntactically correct MySQL query to run, then look at the results of the query and return the answer.
Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most 10 results.
You can order the results by a relevant column to return the most interesting examples in the database.
Never query for all the columns from a specific table, only ask for the relevant columns given the question.
You have access to tools for interacting with the database.
Only use the given tools. Only use the information returned by the tools to construct your final answer.
You MUST double check your query before executing it. If you get an error while executing a query, rewrite the query and try again.
DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
If the question does not seem related to the database, just return "I don't know" as the answer.`
    });

    // Pre-load schema information
    await this.loadSchemaInfo();

    // Cron job: Payment reminders
    cron.schedule("0 7 * * *", async () => {
      try {
        await this.runPaymentReminders();
      } catch (e) {
        console.error("Payment reminders failed", e);
      }
    });

    this.isInitialized = true;
    console.log("SqlAgentService initialized successfully");
  }

  // Load schema information and column mappings
  private async loadSchemaInfo(): Promise<void> {
    try {
      const tables = await this.getTableNames();
      
      this.schemaInfo = "Available Tables:\n" + tables.join(', ') + "\n\n";
      
      // Get detailed column information for each table
      for (const tableName of tables) {
        const columns = await this.ds.query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [tableName]);
        
        this.columnMappings.set(tableName, columns.map((col: any) => col.COLUMN_NAME));
        
        this.schemaInfo += `Table "${tableName}" columns:\n`;
        columns.forEach((col: any) => {
          this.schemaInfo += `  - ${col.COLUMN_NAME} (${col.DATA_TYPE})${col.IS_NULLABLE === 'YES' ? ' NULL' : ''}\n`;
        });
        this.schemaInfo += "\n";
      }
      
      console.log("Schema info loaded successfully");
    } catch (error) {
      console.error("Error loading schema info:", error);
      this.schemaInfo = "Unable to retrieve schema information";
    }
  }

  // Enhanced NL to SQL with column name correction
 // Enhanced NL to SQL with column name correction
// Enhanced NL to SQL with clean formatting
// Enhanced NL to SQL with proper data handling
async runNLtoSQLQuery(userInput: string): Promise<{ success: boolean; rows?: any[]; error?: string }> {
  if (!this.isInitialized) await this.init();

  try {
    console.log("Processing query:", userInput);
    
    // Direct query for common patterns to avoid LLM issues
    if (userInput.toLowerCase().includes('job seeker') || 
        userInput.toLowerCase().includes('jobseeker')) {
      return await this.handleJobSeekerQuery(userInput);
    }
    
    if (userInput.toLowerCase().includes('employer')) {
      return await this.handleEmployerQuery(userInput);
    }

    // Use LLM for other queries
    const enhancedPrompt = `
Database Schema:
${this.schemaInfo}

Important: Use EXACT column names from above schema.
For user names: use 'fname' and 'lname' columns.

User Question: "${userInput}"

Generate a clean MySQL query that returns only the SQL without explanations:
`;

    const response = await this.llm.invoke([
      new HumanMessage(enhancedPrompt)
    ]);
    
    let sql = response.content.toString().trim();
    sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("Generated SQL:", sql);
    
    // Execute the SQL and parse results properly
    const result = await this.sqlDb.run(sql);
    const rowsArray = this.parseDatabaseResult(result);
    
    return { 
      success: true, 
      rows: rowsArray 
    };
    
  } catch (e: any) {
    console.error("runNLtoSQLQuery error:", e.message);
    return { 
      success: false, 
      error: `Couldn't process your query. Try something more specific.` 
    };
  }
}

// Helper to parse database results properly
private parseDatabaseResult(result: any): any[] {
  if (Array.isArray(result)) {
    return result;
  }
  
  if (typeof result === 'object' && result !== null) {
    return [result];
  }
  
  if (typeof result === 'string') {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If it's a string but not JSON, return as value
      return [{ value: result }];
    }
  }
  
  return result !== undefined ? [{ value: result }] : [];
}

// Handle job seeker queries directly
private async handleJobSeekerQuery(userInput: string): Promise<{ success: boolean; rows?: any[]; error?: string }> {
  let limit = 10;
  let fields = 'user.fname, user.lname, user.email';
  
  if (userInput.toLowerCase().includes('5')) limit = 5;
  if (userInput.toLowerCase().includes('3')) limit = 3;
  
  if (userInput.toLowerCase().includes('skill')) fields += ', jobseeker.skills';
  if (userInput.toLowerCase().includes('experience')) fields += ', jobseeker.experience';
  if (userInput.toLowerCase().includes('location')) fields += ', jobseeker.location';
  
  const sql = `SELECT ${fields} 
               FROM jobseeker 
               JOIN user ON jobseeker.userId = user.id 
               LIMIT ${limit}`;
  
  console.log("Direct Job Seeker SQL:", sql);
  
  try {
    const result = await this.sqlDb.run(sql);
    const rowsArray = this.parseDatabaseResult(result);
    return { success: true, rows: rowsArray };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Handle employer queries directly
private async handleEmployerQuery(userInput: string): Promise<{ success: boolean; rows?: any[]; error?: string }> {
  let limit = 10;
  let fields = 'user.fname, user.lname, user.email, employer.companyName, employer.companySize';
  
  if (userInput.toLowerCase().includes('5')) limit = 5;
  if (userInput.toLowerCase().includes('3')) limit = 3;
  if (userInput.toLowerCase().includes('name') && !userInput.toLowerCase().includes('company')) {
    fields = 'user.fname, user.lname';
  }
  
  const sql = `SELECT ${fields} 
               FROM employer 
               JOIN user ON employer.userId = user.id 
               LIMIT ${limit}`;
  
  console.log("Direct Employer SQL:", sql);
  
  try {
    const result = await this.sqlDb.run(sql);
    const rowsArray = this.parseDatabaseResult(result);
    return { success: true, rows: rowsArray };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

  // Auto-correct queries with wrong column names
 // Auto-correct queries with wrong column names
// Auto-correct queries with better formatting
private async autoCorrectQuery(userInput: string): Promise<any[]> {
  console.log("Auto-correcting query:", userInput);
  
  // Build optimized query based on user input
  let selectFields = 'user.fname, user.lname, user.email';
  let whereClause = '';
  let limitClause = 'LIMIT 10';
  
  // Customize based on user request
  if (userInput.toLowerCase().includes('5')) {
    limitClause = 'LIMIT 5';
  }
  if (userInput.toLowerCase().includes('skill')) {
    selectFields += ', jobseeker.skills';
  }
  if (userInput.toLowerCase().includes('experience')) {
    selectFields += ', jobseeker.experience';
  }
  if (userInput.toLowerCase().includes('location')) {
    selectFields += ', jobseeker.location';
  }
  if (userInput.toLowerCase().includes('salary')) {
    selectFields += ', jobseeker.expectedSalary';
  }
  
  const sql = `SELECT ${selectFields} 
               FROM jobseeker 
               JOIN user ON jobseeker.userId = user.id 
               ${whereClause} 
               ${limitClause}`;
  
  console.log("Optimized SQL:", sql);
  const result = await this.sqlDb.run(sql);
  
  // Clean and format results
  if (Array.isArray(result)) {
    return result.map(row => ({
      ...row,
      skills: row.skills ? row.skills.substring(0, 50) + (row.skills.length > 50 ? '...' : '') : row.skills
    }));
  }
  
  return Array.isArray(result) ? result : [result].filter(Boolean);
}

  // Get all table names
  private async getTableNames(): Promise<string[]> {
    try {
      const tables = await this.ds.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `);
      
      return tables.map((table: any) => table.TABLE_NAME);
    } catch (error) {
      console.error("Error getting table names:", error);
      return [];
    }
  }

  // Alternative: Direct SQL generation without execution
  async generateSQLOnly(userInput: string): Promise<{ success: boolean; sql?: string; error?: string }> {
    if (!this.isInitialized) await this.init();

    try {
      const prompt = `
Database Schema:
${this.schemaInfo}

Important: Use EXACT column names from the schema above.
For user names: use 'fname' and 'lname' columns.

Convert this natural language query to MySQL SQL only: "${userInput}". 
Return ONLY the SQL query without any explanations.`;

      const response = await this.llm.invoke(prompt);
      let sql = response.content.toString().trim();
      sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
      
      return { success: true, sql };
    } catch (e: any) {
      console.error("generateSQLOnly error:", e);
      return { success: false, error: e.message };
    }
  }

  // Original LLM-powered query (using agent directly)
  async runNaturalQuery(userInput: string): Promise<AgentResult> {
    if (!this.isInitialized) await this.init();
    
    try {
      const result = await this.agentExecutor.call({ input: userInput });
      return { rawText: result.output };
    } catch (error: any) {
      console.error("Error in runNaturalQuery:", error);
      return {
        rawText: "Sorry, I encountered an error processing your query. Please try again or rephrase your question.",
      };
    }
  }

  // Simple query with auto-correction
  async runSimpleQuery(userInput: string): Promise<AgentResult> {
    if (!this.isInitialized) await this.init();

    try {
      // For job seeker queries, use our known working query
      if (userInput.toLowerCase().includes('job seeker') || 
          userInput.toLowerCase().includes('jobseeker') ||
          userInput.toLowerCase().includes('show me')) {
        
        const rows = await this.autoCorrectQuery(userInput);
        return { 
          rawText: `Here are the job seeker results:`, 
          rows: rows 
        };
      }

      // Use agent for other queries
      const result = await this.agentExecutor.call({ input: userInput });
      return { rawText: result.output };

    } catch (error: any) {
      console.error("Error in runSimpleQuery:", error);
      return {
        rawText: "Sorry, I couldn't process your query. Please try rephrasing or be more specific about what you're looking for.",
        error: error.message
      };
    }
  }

  // Payment reminders (keep existing)
  async runPaymentReminders(): Promise<{ reminded: number }> {
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
      const body = `Payment #${p.id} of $${p.amount} is due on ${p.dueDate.toISOString()}`;
      await sendNotification(email, subject, body);
    }

    return { reminded: payments.length };
  }

  // Debug method to check database connection
  async debugDatabaseInfo(): Promise<any> {
    if (!this.isInitialized) await this.init();
    
    try {
      const tables = await this.ds.query(`
        SELECT TABLE_NAME, TABLE_ROWS 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
      `);
      
      let sampleData = {};
      if (tables.length > 0) {
        const firstTable = tables[0].TABLE_NAME;
        sampleData = await this.ds.query(`SELECT * FROM ${firstTable} LIMIT 3`);
      }
      
      return { 
        success: true, 
        tables, 
        sampleData,
        schemaInfo: this.schemaInfo,
        message: "Database connection successful" 
      };
    } catch (error: any) {
      console.error("Database debug error:", error);
      return { 
        success: false, 
        error: error.message,
        message: "Database connection failed" 
      };
    }
  }
}