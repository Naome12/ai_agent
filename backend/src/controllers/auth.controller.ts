// server/controllers/auth.controller.ts
import { Request, Response } from "express";
import {
  signup,
  login,
  startPasswordReset,
  completePasswordReset,
} from "../services/auth.service";

function handleError(res: Response, err: any) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
}

/** Signup controller */
export const signupCtrl = async (req: Request, res: Response) => {
  try {
    const { fname, lname, email, password, role } = req.body;
    const accessToken = await signup({ fname, lname, email, password, role });
    res.json({ success: true, accessToken });
  } catch (err) {
    handleError(res, err);
  }
};

/** Login controller */
export const loginCtrl = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const accessToken = await login(email, password);
    res.json({ success: true, accessToken });
  } catch (err) {
    handleError(res, err);
  }
};

/** Forgot password controller */
export const forgotPasswordCtrl = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const token = await startPasswordReset(email); // returns raw token
    res.json({
      success: true,
      message: "If the email exists, a reset token has been generated.",
      token, // you can send via email in production
    });
  } catch (err) {
    handleError(res, err);
  }
};

/** Reset password controller */
export const resetPasswordCtrl = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    await completePasswordReset(token, password);
    res.json({ success: true, message: "Password has been reset." });
  } catch (err) {
    handleError(res, err);
  }
};
