// src/routes/chatClassifier.ts
import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

router.post("/", async (req, res) => {
  try {
    const { message, userType } = req.body; // e.g., "jobSeeker", "employer", "admin"

    const prompt = `
You are the official Kozi AI assistant.
Your job is to classify the user's message into exactly one of three categories: "chat", "sql", or "gmail",
and provide a concise, structured, actionable response based on their role and message.

User role: ${userType}
User message: "${message}"

Classification & Response Rules:

1. "chat" → Any request related to Kozi platform use, including:
   - Job Seeker intent: finding or applying for jobs.
     Examples of intent (not exact text):
       • Asking to find a job
       • Looking for opportunities
       • Requesting guidance on applications
     Response:
       "To match you with the best opportunities, please tell me:
        • Your skills or profession
        • Your experience level
        • Preferred work location"
   
   - Employer intent: hiring, posting jobs, reviewing candidates.
     Examples of intent:
       • Wanting to hire a candidate
       • Asking how to post a job
       • Searching for qualified workers
     Response:
       "Great! To help you find the right candidate, please provide:
        • Type of worker (basic or advanced professional)
        • The role (e.g., cleaner, chef, marketing expert)
        • Urgency or start date"

2. "sql" → Requests to query jobs, employers, users, or platform statistics. Usually admin only.

3. "gmail" → Email actions (read/send/search). Only admin can execute.
   - Non-admins asking about emails → classify as "chat" and respond:
     "You need admin access to check emails. You can ask me for job or platform info instead."

Tone & Style:
- Always professional, warm, and supportive.
- Clear, concise, avoid unnecessary details.
- Use bullet points for actionable instructions.
- Do NOT write long paragraphs unless necessary.
- Return ONLY a JSON object with exactly these keys:
{
  "type": "chat" | "sql" | "gmail",
  "response": "Concise, structured response here"
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 300,
    });

    const resultText = completion.choices[0].message?.content?.trim() || "";

    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch (err) {
      // fallback if JSON parsing fails
      parsed = {
        type: "chat",
        response: "I'm here to help with Kozi platform requests. Please tell me more about your question.",
      };
    }

    res.json(parsed);
  } catch (error) {
    console.error("Classifier error:", error);
    res.status(500).json({ error: "Failed to classify query" });
  }
});

export default router;
