import { Request, Response } from "express";
import {
  getAllPayments as getAllPaymentsService,
  createPayment as createPaymentService,
  updatePayment as updatePaymentService,
  deletePayment as deletePaymentService,
} from "../services/payment.service";

// Get all payments
export async function getAllPayments(req: Request, res: Response) {
  try {
    const payments = await getAllPaymentsService();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Failed to get payments", error: err });
  }
}

// Create payment
export async function createPayment(req: Request, res: Response) {
  try {
    const data = req.body;
    const payment = await createPaymentService(data);
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: "Failed to create payment", error: err });
  }
}

// Update payment
export async function updatePayment(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updated = await updatePaymentService(id, data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update payment", error: err });
  }
}

// Delete payment
export async function deletePayment(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await deletePaymentService(id);
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete payment", error: err });
  }
}
