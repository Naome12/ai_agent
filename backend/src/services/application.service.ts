import { PrismaClient, ApplicationStatus } from "@prisma/client";
const prisma = new PrismaClient();

// Create application (job seeker)
export async function createApplication(jobSeekerId: number, jobId: number) {
  return prisma.application.create({ data: { jobSeekerId, jobId } });
}

// Get all applications
export async function getAllApplications() {
  return prisma.application.findMany({ include: { job: true, jobSeeker: true } });
}

// Update application status (admin)
export async function updateApplicationStatus(id: number, status: ApplicationStatus) {
  return prisma.application.update({ where: { id }, data: { status } });
}

// Delete application (admin)
export async function deleteApplication(id: number) {
  return prisma.application.delete({ where: { id } });
}
