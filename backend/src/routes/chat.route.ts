import { Router } from "express";
import { POST as chatHandler, streamChat } from "../services/chat.service";

const router = Router();

/**
 * @openapi
 * /chat:
 *   post:
 *     summary: Send a message to Kozi AI assistant
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: Streaming response from AI assistant
 */
router.post("/", chatHandler);

/**
 * @openapi
 * /chat/stream:
 *   get:
 *     summary: Stream AI responses using SSE
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: messages
 *         required: true
 *         schema:
 *           type: string
 *           description: JSON stringified array of messages
 *     responses:
 *       200:
 *         description: SSE stream of AI response
 */
router.get("/stream", streamChat);

export default router;
