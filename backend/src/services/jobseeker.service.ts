import { PrismaClient, ExperienceLevel, JobType } from "@prisma/client";
const prisma = new PrismaClient();

// Create JobSeeker (admin)
export async function createJobSeeker(data: {
  userId: number;
  phone?: string;
  skills?: string;
  experience: ExperienceLevel;
  location?: string;
  desiredJob?: JobType;
  expectedSalary?: number;
}) {
  return prisma.jobSeeker.create({ data });
}

// Get all job seekers
export async function getAllJobSeekers() {
  return prisma.jobSeeker.findMany({ include: { user: true } });
}

// Get job seeker by ID
export async function getJobSeekerById(id: number) {
  return prisma.jobSeeker.findUnique({ where: { id }, include: { user: true } });
}

// Update own profile (job seeker)
export async function updateJobSeekerProfile(userId: number, data: Partial<{
  phone: string;
  skills: string;
  experience: ExperienceLevel;
  location: string;
  desiredJob: JobType;
  expectedSalary: number;
}>) {
  return prisma.jobSeeker.update({ where: { userId }, data });
}

// Delete job seeker (admin)
export async function deleteJobSeeker(id: number) {
  return prisma.jobSeeker.delete({ where: { id } });
}
