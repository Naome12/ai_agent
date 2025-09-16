import { Router } from "express";
import * as jobCtrl from "../controllers/job.controller";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import { JobCreateDto, JobUpdateDto } from "../types/other.dto";

const router = Router();

/**
 * @openapi
 * /jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Job]
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get("/", jobCtrl.getAllJobs);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Job]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Job details
 */
router.get("/:id", jobCtrl.getJobById);

/**
 * @openapi
 * /jobs:
 *   post:
 *     summary: Create job (admin or employer)
 *     tags: [Job]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobCreateDto'
 *     responses:
 *       201:
 *         description: Job created
 */
router.post("/", requireAuth, requireRole("admin", "employer"), validate(JobCreateDto), jobCtrl.createJob);

/**
 * @openapi
 * /jobs/{id}:
 *   patch:
 *     summary: Update job (admin or employer)
 *     tags: [Job]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobUpdateDto'
 *     responses:
 *       200:
 *         description: Job updated
 */
router.patch("/:id", requireAuth, requireRole("admin", "employer"), validate(JobUpdateDto), jobCtrl.updateJob);

/**
 * @openapi
 * /jobs/{id}:
 *   delete:
 *     summary: Delete job (admin only)
 *     tags: [Job]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Job deleted
 */
router.delete("/:id", requireAuth, requireRole("admin"), jobCtrl.deleteJob);

export default router;
