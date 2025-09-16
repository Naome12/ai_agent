import { z } from "zod";

export const SignupDto = z.object({
  body: z.object({
    fname: z.string().min(1).optional(),
    lname: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(['job_seeker', 'employer', 'admin']).optional(),
  }),
});


export const LoginDto = z.object({
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
  }),
});

export const ForgotPasswordDto = z.object({
  body: z.object({
    email: z.string().email().optional(),
  }),
});

export const ResetPasswordDto = z.object({
  body: z.object({
    token: z.string().min(10).optional(),
    password: z.string().min(8).optional(),
  }),
});

