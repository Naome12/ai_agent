import { Request, Response } from "express";
import {
  getAllJobSeekers as getAllJobSeekersService,
  getJobSeekerById as getJobSeekerByIdService,
  updateJobSeekerProfile as updateJobSeekerProfileService,
  deleteJobSeeker as deleteJobSeekerService,
} from "../services/jobseeker.service";

// Get all job seekers (admin only)
export async function getAllJobSeekers(req: Request, res: Response) {
  try {
    const seekers = await getAllJobSeekersService();
    res.json(seekers);
  } catch (err) {
    res.status(500).json({ message: "Failed to get job seekers", error: err });
  }
}

// Get job seeker by ID (admin only)
export async function getJobSeekerById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const seeker = await getJobSeekerByIdService(id);
    if (!seeker) return res.status(404).json({ message: "Job seeker not found" });
    res.json(seeker);
  } catch (err) {
    res.status(500).json({ message: "Failed to get job seeker", error: err });
  }
}

// Update own profile (job seeker)
export async function updateJobSeekerProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const data = req.body;
    const updated = await updateJobSeekerProfileService(userId, data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err });
  }
}

// Delete job seeker (admin)
export async function deleteJobSeeker(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await deleteJobSeekerService(id);
    res.json({ message: "Job seeker deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete job seeker", error: err });
  }
}
