import { Router, Request, Response } from "express";
import { SqlAgentService } from "../services/sqlagent.service";

const router = Router();
const sqlAgent = new SqlAgentService();

/**
 * @openapi
 * /sql-agent:
 *   post:
 *     summary: Send a natural language query to the SQL Agent
 *     tags: [SQL Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *                 description: Natural language query
 *             required:
 *               - input
 *     responses:
 *       200:
 *         description: Response from SQL Agent
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: "Missing input query" });
    }

    const result = await sqlAgent.runNaturalQuery(input);
    return res.json({ success: true, result });
  } catch (error: any) {
    console.error("SQL Agent error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @openapi
 * /sql-agent/stream:
 *   get:
 *     summary: Stream SQL Agent response using SSE
 *     tags: [SQL Agent]
 *     parameters:
 *       - in: query
 *         name: input
 *         required: true
 *         schema:
 *           type: string
 *           description: Natural language query
 *     responses:
 *       200:
 *         description: SSE stream of SQL Agent response
 */
router.get("/stream", async (req: Request, res: Response) => {
  try {
    const input = req.query.input as string;
    if (!input) {
      return res.status(400).json({ error: "Missing input query" });
    }

    await sqlAgent.init();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial event
    res.write(`event: start\n`);
    res.write(`data: ${JSON.stringify({ message: "SQL Agent streaming started" })}\n\n`);

    // Run graph stream
    const stream = await sqlAgent["graph"].stream({
      messages: [{ role: "user", content: input }],
    });

    for await (const event of stream) {
      const messages = event?.messages ?? [];
      const last = messages[messages.length - 1];
      if (last?.content) {
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify({ content: last.content })}\n\n`);
      }
    }

    res.write(`event: end\n`);
    res.write(`data: ${JSON.stringify({ message: "SQL Agent streaming finished" })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("SQL Agent stream error:", error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
