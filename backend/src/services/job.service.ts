import { PrismaClient, JobCategory, JobType } from "@prisma/client";
const prisma = new PrismaClient();

// Create a job (only admin or employer)
export async function createJob(data: {
  employerId: number;
  title: string;
  description?: string;
  jobType: JobType;
  category: JobCategory;
  location?: string;
  salary?: number;
}) {
  return prisma.job.create({ data });
}

// Get all jobs
export async function getAllJobs() {
  return prisma.job.findMany({ include: { employer: true } });
}

// Get job by ID
export async function getJobById(id: number) {
  return prisma.job.findUnique({ where: { id } });
}

// Update job (admin or owner employer)
export async function updateJob(id: number, data: Partial<{
  title: string;
  description: string;
  jobType: JobType;
  category: JobCategory;
  location: string;
  salary: number;
}>) {
  return prisma.job.update({ where: { id }, data });
}

// Delete job (admin only)
export async function deleteJob(id: number) {
  return prisma.job.delete({ where: { id } });
}
