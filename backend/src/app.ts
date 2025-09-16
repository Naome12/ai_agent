// src/app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimiter } from "./config/rateLimit";
import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.route";
import jobSeekerRoutes from "./routes/jobseeker.route";
import employerRoutes from "./routes/employer.route";
import applicationRoutes from "./routes/application.route";
import paymentRoutes from "./routes/payment.route";
import chatRoutes from "./routes/chat.route";
import sqlagentRoutes from "./routes/sqlagent.route";
import { errorHandler } from "./middlewares/error";
import logger from "./utils/logger";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();

// Swagger setup
const specs = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Kozi API", version: "1.0.0" },
    servers: [{ url: process.env.API_BASE_URL || "http://localhost:5050" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        SignupDto: {
          type: "object",
          properties: {
            fname: { type: "string", example: "Alice" },
            lname: { type: "string", example: "Umutoni" },
            email: { type: "string", format: "email", example: "alice@example.com" },
            password: { type: "string", minLength: 8, example: "StrongPass123!" },
            role: {
              type: "string",
              enum: ["job_seeker", "employer", "admin"],
              example: "job_seeker",
            },
          },
          required: ["fname", "lname", "email", "password", "role"],
        },
        LoginDto: {
          type: "object",
          properties: {
            email: { type: "string", format: "email", example: "alice@example.com" },
            password: { type: "string", minLength: 8, example: "StrongPass123!" },
          },
          required: ["email", "password"],
        },
        ForgotPasswordDto: {
          type: "object",
          properties: {
            email: { type: "string", format: "email", example: "alice@example.com" },
          },
          required: ["email"],
        },
        ResetPasswordDto: {
          type: "object",
          properties: {
            token: { type: "string", example: "reset-token-123" },
            password: { type: "string", minLength: 8, example: "NewStrongPass456!" },
          },
          required: ["token", "password"],
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/job-seekers", jobSeekerRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/sql-agent", sqlagentRoutes)

// Error handler
app.use(errorHandler);

// Global error logging
process.on("unhandledRejection", (e) => logger.error({ msg: "unhandledRejection", e }));
process.on("uncaughtException", (e) => logger.error({ msg: "uncaughtException", e }));

export default app;
