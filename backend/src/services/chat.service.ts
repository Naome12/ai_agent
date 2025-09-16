// src/controllers/chat.controller.ts
import { Request, Response } from "express";
import OpenAI from "openai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";
dotenv.config();

// Environment variables
const ASTRA_DB_ENDPOINT = process.env.ASTRA_DB_ENDPOINT!;
const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION!;
const ASTRA_DB_NAMESPACE = process.env.ASTRA_DB_NAMESPACE!;
const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

if (
  !ASTRA_DB_ENDPOINT ||
  !ASTRA_DB_COLLECTION ||
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_APPLICATION_TOKEN ||
  !OPENAI_API_KEY
) {
  throw new Error("Missing required environment variables");
}

// OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Astra DB client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request, res: Response) {
  try {
    const { message } = req.body; // frontend Message[]

    if (!Array.isArray(message))
      return res.status(400).json({ error: "Invalid message format" });

    const openaiMessages = message.map((msg: any) => ({
      role:
        msg.type === "user"
          ? "user"
          : msg.type === "assistant"
          ? "assistant"
          : "system",
      content: msg.content,
    }));

    const latestMessage =
      openaiMessages[openaiMessages.length - 1]?.content || "";

    // Fetch context from Astra DB (if available)
    let docContext = "";
    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(
        {},
        { sort: { $vector: latestMessage }, limit: 10 }
      );
      const documents = await cursor.toArray();
      docContext = JSON.stringify(documents.map((doc) => doc.text));
    } catch (err) {
      console.error("Error fetching documents from Astra DB:", err);
    }

    const systemPrompt = {
      role: "system",
      content: `You are Kozi AI assistant. Use this context: ${docContext} Answer user: ${latestMessage}`,
    };

    // Prepare response for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [...openaiMessages, systemPrompt] as any[], // cast as any[] to bypass TS error
    });

    // Stream tokens as they arrive
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    // End stream
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("POST /chat error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


// src/controllers/chat.controller.ts
export async function streamChat(req: Request, res: Response) {
  try {
    const { messages } = req.query; // or pass some identifier
    const parsedMessages = messages ? JSON.parse(messages as string) : [];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const openaiMessages = parsedMessages.map((msg: any) => ({
      role: msg.type === "user" ? "user" : msg.type === "assistant" ? "assistant" : "system",
      content: msg.content,
    }));

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: openaiMessages,
    });

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("GET /chat/stream error:", err);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
