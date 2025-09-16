import { Router } from "express";
import { runGmailAgentCtrl } from "../controllers/gmail.controller";
import { requireRole } from "../middlewares/requireRole";
import { requireAuth } from "../middlewares/auth";

const router = Router();

/**
 * @openapi
 * /api/gmail/agent:
 *   post:
 *     summary: Run Gmail AI agent with natural language commands (Admin only)
 *     tags: [Gmail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *                 example: "Show me unread emails about invoices"
 *     responses:
 *       200:
 *         description: Agent execution result
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Forbidden (only admins allowed)
 */
router.post("/agent", requireAuth, requireRole("admin"), runGmailAgentCtrl);

export default router;
