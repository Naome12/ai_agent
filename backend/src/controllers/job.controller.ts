import { Request, Response } from "express";
import {
  createJob as createJobService,
  getAllJobs as getAllJobsService,
  getJobById as getJobByIdService,
  updateJob as updateJobService,
  deleteJob as deleteJobService,
} from "../services/job.service";

// Create a job
export async function createJob(req: Request, res: Response) {
  try {
    const data = req.body;
    const job = await createJobService(data);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: "Failed to create job", error: err });
  }
}

// Get all jobs
export async function getAllJobs(req: Request, res: Response) {
  try {
    const jobs = await getAllJobsService();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Failed to get jobs", error: err });
  }
}

// Get job by ID
export async function getJobById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const job = await getJobByIdService(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Failed to get job", error: err });
  }
}

// Update job
export async function updateJob(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updated = await updateJobService(id, data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update job", error: err });
  }
}

// Delete job
export async function deleteJob(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await deleteJobService(id);
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete job", error: err });
  }
}
