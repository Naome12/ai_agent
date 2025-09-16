import { Router } from "express";
import * as paymentCtrl from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

/**
 * @openapi
 * /payments:
 *   get:
 *     summary: Get all payments (admin only)
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get("/", requireAuth, requireRole("admin"), paymentCtrl.getAllPayments);

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Create a payment (admin only)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employerId:
 *                 type: number
 *               jobSeekerId:
 *                 type: number
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post("/", requireAuth, requireRole("admin"), paymentCtrl.createPayment);

/**
 * @openapi
 * /payments/{id}:
 *   patch:
 *     summary: Update payment (admin)
 *     tags: [Payment]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, paid]
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Payment updated
 */
router.patch("/:id", requireAuth, requireRole("admin"), paymentCtrl.updatePayment);

/**
 * @openapi
 * /payments/{id}:
 *   delete:
 *     summary: Delete payment (admin)
 *     tags: [Payment]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Payment deleted
 */
router.delete("/:id", requireAuth, requireRole("admin"), paymentCtrl.deletePayment);

export default router;
