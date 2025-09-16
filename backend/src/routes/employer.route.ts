import { Router } from "express";
import * as employerCtrl from "../controllers/employer.controller";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import { EmployerUpdateDto } from "../types/other.dto";

const router = Router();

/**
 * @openapi
 * /employers:
 *   get:
 *     summary: Get all employers (admin only)
 *     tags: [Employer]
 *     responses:
 *       200:
 *         description: List of employers
 */
router.get("/", requireAuth, requireRole("admin"), employerCtrl.getAllEmployers);

/**
 * @openapi
 * /employers/{id}:
 *   get:
 *     summary: Get employer by ID (admin only)
 *     tags: [Employer]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Employer data
 */
router.get("/:id", requireAuth, requireRole("admin"), employerCtrl.getEmployerById);

/**
 * @openapi
 * /employers/profile:
 *   patch:
 *     summary: Update own profile (employer)
 *     tags: [Employer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployerUpdateDto'
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch("/profile", requireAuth, requireRole("employer"), validate(EmployerUpdateDto), employerCtrl.updateEmployerProfile);

/**
 * @openapi
 * /employers/{id}:
 *   delete:
 *     summary: Delete employer (admin only)
 *     tags: [Employer]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Employer deleted
 */
router.delete("/:id", requireAuth, requireRole("admin"), employerCtrl.deleteEmployer);

export default router;
