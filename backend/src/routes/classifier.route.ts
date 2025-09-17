import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

router.post("/", async (req, res) => {
  try {
    const { message, userType } = req.body;

    const prompt = `
You are the official Kozi AI assistant.
Your job is to classify the user's message into exactly one of three categories: "chat", "sql", or "gmail".
Then, if possible, provide a helpful response based on the user's role and message.

User role: ${userType}
Message: "${message}"

Classification rules:
- "chat": any Kozi platform guidance, greetings, job seeker or employer requests, platform help.
  - Examples: "I need a job", "I want to hire", "How do I apply for a job?"
- "sql": database or analytics queries (jobs, employers, users, stats). Usually admin only.
- "gmail": email-related actions (read, send, search). Only admin can execute. 
  - If non-admin asks about Gmail, classify as "chat" and respond helpfully explaining admin-only access.

Response rules:
- If message is a valid Kozi action (like "I want to hire", "I need a job"), give a helpful step-by-step response.
- For non-admin Gmail requests, suggest what they would do if they were admin.
- Always be professional, supportive, and clear.
- Return a JSON object ONLY like this:
{
  "type": "chat" | "sql" | "gmail",
  "response": "Your friendly, actionable reply here."
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 300,
    });

    const resultText = response.choices[0].message?.content?.trim() || '';
    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      // fallback: default to chat
      parsed = { type: "chat", response: "I'm here to help with Kozi platform requests!" };
    }

    res.json(parsed);
  } catch (error) {
    console.error("Classifier error:", error);
    res.status(500).json({ error: "Failed to classify query" });
  }
});

export default router;
