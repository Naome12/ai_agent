import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error({ msg: err.message, stack: err.stack });
  const code = err.statusCode || 500;
  res.status(code).json({ message: err.message || "Internal Server Error" });
}
