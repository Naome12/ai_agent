import { Router } from "express";
import * as jobSeekerCtrl from "../controllers/jobseeker.controller";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import { JobSeekerUpdateDto } from "../types/other.dto";

const router = Router();

/**
 * @openapi
 * /job-seekers:
 *   get:
 *     summary: Get all job seekers (admin only)
 *     tags: [JobSeeker]
 *     responses:
 *       200:
 *         description: List of job seekers
 */
router.get("/", requireAuth, requireRole("admin"), jobSeekerCtrl.getAllJobSeekers);

/**
 * @openapi
 * /job-seekers/{id}:
 *   get:
 *     summary: Get a job seeker by ID (admin only)
 *     tags: [JobSeeker]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Job seeker data
 */
router.get("/:id", requireAuth, requireRole("admin"), jobSeekerCtrl.getJobSeekerById);

/**
 * @openapi
 * /job-seekers/profile:
 *   patch:
 *     summary: Update own profile (job seeker)
 *     tags: [JobSeeker]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobSeekerUpdateDto'
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch("/profile", requireAuth, requireRole("job_seeker"), validate(JobSeekerUpdateDto), jobSeekerCtrl.updateJobSeekerProfile);

/**
 * @openapi
 * /job-seekers/{id}:
 *   delete:
 *     summary: Delete job seeker (admin only)
 *     tags: [JobSeeker]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Job seeker deleted
 */
router.delete("/:id", requireAuth, requireRole("admin"), jobSeekerCtrl.deleteJobSeeker);

export default router;
