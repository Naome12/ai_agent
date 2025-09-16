import { Request, Response } from "express";
import {
  getAllEmployers as getAllEmployersService,
  getEmployerById as getEmployerByIdService,
  updateEmployerProfile as updateEmployerProfileService,
  deleteEmployer as deleteEmployerService,
} from "../services/employer.service";

export async function getAllEmployers(req: Request, res: Response) {
  try {
    const employers = await getAllEmployersService();
    res.json(employers);
  } catch (err) {
    res.status(500).json({ message: "Failed to get employers", error: err });
  }
}

export async function getEmployerById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const employer = await getEmployerByIdService(id);
    if (!employer) return res.status(404).json({ message: "Employer not found" });
    res.json(employer);
  } catch (err) {
    res.status(500).json({ message: "Failed to get employer", error: err });
  }
}

export async function updateEmployerProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const data = req.body;
    const updated = await updateEmployerProfileService(userId, data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err });
  }
}

export async function deleteEmployer(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await deleteEmployerService(id);
    res.json({ message: "Employer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete employer", error: err });
  }
}
