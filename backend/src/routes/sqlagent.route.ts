import { Router, Request, Response } from "express";
import { SqlAgentService } from "../services/sqlagent.service";

const router = Router();
const sqlAgent = new SqlAgentService();

// ---------------- Test connection ----------------
router.get("/test", async (req: Request, res: Response) => {
  try {
    await sqlAgent.init();
    res.json({ success: true, message: "SQL Agent is working!", timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to initialize SQL Agent" });
  }
});

// ---------------- Debug endpoint ----------------
router.get("/debug", async (req: Request, res: Response) => {
  try {
    await sqlAgent.init();
    const debugInfo = await sqlAgent.debugDatabaseInfo();
    res.json(debugInfo);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Debug failed" });
  }
});

// ---------------- Streaming endpoint for SQL queries ----------------
router.get("/stream", async (req: Request, res: Response) => {
  try {
    const { input } = req.query;
    if (!input) {
      res.write(`data: ${JSON.stringify({ content: "❌ Please provide a query\\n" })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    await sqlAgent.init();
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial message
    res.write(`data: ${JSON.stringify({ content: "🔍 Processing your query...\\n" })}\n\n`);
    
    // Process the query
    const result = await sqlAgent.runNLtoSQLQuery(input as string);
    
    if (!result.success) {
      res.write(`data: ${JSON.stringify({ content: `❌ ${result.error}\\n` })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    
    // Send success message
    res.write(`data: ${JSON.stringify({ content: "✅ Query executed successfully!\\n" })}\n\n`);
    
    // Send results
    if (result.rows && result.rows.length > 0) {
      const rows = result.rows;
      
      res.write(`data: ${JSON.stringify({ content: `📊 Found ${rows.length} result${rows.length !== 1 ? 's' : ''}\\n\\n` })}\n\n`);
      
      // Format as clean table
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        
        // Create table header
        let tableContent = "";
        tableContent += "| " + columns.join(" | ") + " |\\n";
        tableContent += "|" + columns.map(() => "---").join("|") + "|\\n";
        
        // Add rows
        rows.forEach((row: any) => {
          const rowValues = columns.map(col => {
            const value = row[col];
            if (value === null || value === undefined) return '';
            const strValue = String(value);
            return strValue.length > 30 ? strValue.substring(0, 27) + '...' : strValue;
          });
          tableContent += "| " + rowValues.join(" | ") + " |\\n";
        });
        
        res.write(`data: ${JSON.stringify({ content: tableContent })}\n\n`);
      }
    } else {
      res.write(`data: ${JSON.stringify({ content: "📭 No results found\\n" })}\n\n`);
    }
    
    // End the stream
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ content: `❌ Error: ${err.message}\\n` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// ---------------- Natural language → SQL ----------------
router.post("/simple", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: "Missing input query" });

    await sqlAgent.init();
    const result = await sqlAgent.runNLtoSQLQuery(input);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error, 
        timestamp: new Date().toISOString() 
      });
    }

    res.json({ 
      success: true, 
      result: result.rows, 
      timestamp: new Date().toISOString() 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

// ---------------- Generate SQL only (no execution) ----------------
router.post("/generate-sql", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: "Missing input query" });

    await sqlAgent.init();
    const result = await sqlAgent.generateSQLOnly(input);
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ 
      success: true, 
      sql: result.sql, 
      timestamp: new Date().toISOString() 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

// ---------------- LLM chat endpoint ----------------
router.post("/", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: "Missing input query" });

    await sqlAgent.init();
    const result = await sqlAgent.runNaturalQuery(input);
    
    res.json({ 
      success: true, 
      result: result.rawText, 
      timestamp: new Date().toISOString() 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

// ---------------- Simple query endpoint ----------------
router.post("/simple-query", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: "Missing input query" });

    await sqlAgent.init();
    const result = await sqlAgent.runSimpleQuery(input);
    
    res.json({ 
      success: true, 
      result: result.rawText,
      rows: result.rows,
      timestamp: new Date().toISOString() 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;