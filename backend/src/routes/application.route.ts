import { Router } from "express";
import * as applicationCtrl from "../controllers/application.controller";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

/**
 * @openapi
 * /applications:
 *   get:
 *     summary: Get all applications (admin only)
 *     tags: [Application]
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get("/", requireAuth, requireRole("admin"), applicationCtrl.getAllApplications);

/**
 * @openapi
 * /applications:
 *   post:
 *     summary: Apply for a job (job seeker)
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: number
 *     responses:
 *       201:
 *         description: Application created
 */
router.post("/", requireAuth, requireRole("job_seeker"), applicationCtrl.createApplication);


/**
 * @openapi
 * /applications/{id}:
 *   delete:
 *     summary: Delete application (admin)
 *     tags: [Application]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Application deleted
 */
router.delete("/:id", requireAuth, requireRole("admin"), applicationCtrl.deleteApplication);

export default router;
