import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Create employer (admin)
export async function createEmployer(data: {
  userId: number;
  companyName?: string;
  companySize?: number;
  industry?: string;
}) {
  return prisma.employer.create({ data });
}

// Get all employers
export async function getAllEmployers() {
  return prisma.employer.findMany({ include: { user: true, jobs: true } });
}

// Get employer by ID
export async function getEmployerById(id: number) {
  return prisma.employer.findUnique({ where: { id }, include: { user: true, jobs: true } });
}

// Update own profile (employer)
export async function updateEmployerProfile(userId: number, data: Partial<{
  companyName: string;
  companySize: number;
  industry: string;
}>) {
  return prisma.employer.update({ where: { userId }, data });
}

// Delete employer (admin)
export async function deleteEmployer(id: number) {
  return prisma.employer.delete({ where: { id } });
}
