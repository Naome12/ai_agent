import { Request, Response } from "express";
import {
  createApplication as createApplicationService,
  getAllApplications as getAllApplicationsService,
  updateApplicationStatus as updateApplicationStatusService,
  deleteApplication as deleteApplicationService,
} from "../services/application.service";

// Create application (job seeker)
export async function createApplication(req: Request, res: Response) {
  try {
    const jobSeekerId = (req as any).user.id;
    const { jobId } = req.body;
    const app = await createApplicationService(jobSeekerId, jobId);
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: "Failed to create application", error: err });
  }
}

// Get all applications (admin)
export async function getAllApplications(req: Request, res: Response) {
  try {
    const apps = await getAllApplicationsService();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: "Failed to get applications", error: err });
  }
}

// Update application status (admin)
export async function updateApplicationStatus(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const updated = await updateApplicationStatusService(id, status);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err });
  }
}

// Delete application (admin)
export async function deleteApplication(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await deleteApplicationService(id);
    res.json({ message: "Application deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete application", error: err });
  }
}
