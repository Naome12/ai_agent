import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

router.post("/", async (req, res) => {
  try {
    const { message, userType } = req.body;

    const prompt = `
You are a strict classifier for Kozi AI. 
The user role is: ${userType}.
Your job is to classify the following user message into exactly one of three categories:

### Categories:

1. "chat" → 
- ONLY for Kozi-related small talk, guidance, or platform help.  
- Greeting or onboarding messages specific to Kozi ("hello", "hi", "how can I use Kozi?", "what can you do here?").
- Advice about job applications, CVs, interview tips, or using the Kozi platform.
- Suggestions or recommendations within the Kozi system (e.g., "recommend me jobs", "help me improve my profile").
- ❌ NOT for general knowledge questions or unrelated topics (those must still be classified as "chat", but the assistant will politely say it's out of scope).

Examples:  
- "Can you give me interview tips?"  
- "How do I apply for a job on Kozi?"  
- "What can Kozi do for job seekers?"  
- "Thanks for helping me with my CV".

2. "sql" → 
- Any request that involves retrieving or analyzing Kozi database information.  
- Jobs, employers, job seekers, users, platform statistics, analytics, or structured data queries.  
- Includes "show", "list", "count", "top skills", "latest jobs", "user statistics", "database records", etc.  

Examples:  
- "Show me the latest jobs".  
- "How many employers joined this month?".  
- "List all job seekers with advanced skills".  
- "What are the top skills in demand?".

3. "gmail" → 
- Email-related actions (read, send, search, inbox management).  
- Includes inbox, unread, drafts, sent, spam, starred, important, attachments, and sending emails.  
- ⚠️ Only valid if user role = admin.  
- If user is NOT admin but asks about Gmail, classify as "chat".

Examples:  
- "Send an email to HR".  
- "Show me unread emails".  
- "Search my inbox for project updates".  

---

Message: "${message}"

Return ONLY one word: chat, sql, or gmail.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 5,
    });

    const classification =
      response.choices[0].message?.content?.trim().toLowerCase() || "chat";

    res.json({ type: classification });
  } catch (error) {
    console.error("Classifier error:", error);
    res.status(500).json({ error: "Failed to classify query" });
  }
});

export default router;
