import { PrismaClient, PaymentStatus } from "@prisma/client";
const prisma = new PrismaClient();

// Create payment (admin)
export async function createPayment(data: {
  employerId: number;
  jobSeekerId: number;
  amount: number;
  dueDate: Date;
  status?: PaymentStatus;
}) {
  return prisma.payment.create({ data });
}

// Get all payments
export async function getAllPayments() {
  return prisma.payment.findMany({ include: { employer: true, jobSeeker: true } });
}

// Update payment (admin)
export async function updatePayment(id: number, data: Partial<{ amount: number; status: PaymentStatus; dueDate: Date }>) {
  return prisma.payment.update({ where: { id }, data });
}

// Delete payment (admin)
export async function deletePayment(id: number) {
  return prisma.payment.delete({ where: { id } });
}
