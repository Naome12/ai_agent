import { Response } from 'express';
import logger from './logger';

export function ok(res: Response, message: string, data?: any, meta?: any, status = 200) {
  return res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

export function fail(res: Response, err: any) {
  const status = err.statusCode || err.status || 500;
  const errorCode = err.errorCode || err.code;
  const message = err.message || 'Internal server error';
  logger.error({ msg: message, status, errorCode, stack: err.stack });
  return res.status(status).json({ success: false, message, ...(errorCode ? { errorCode } : {}) });
}

export function assert(condition: any, message = 'Not found', statusCode = 404, errorCode?: string) {
  if (!condition) {
    const e: any = new Error(message);
    e.statusCode = statusCode;
    if (errorCode) e.errorCode = errorCode;
    throw e;
  }
}

export function asNumber(val: any, fallback?: number) {
  const n = Number(val);
  if (Number.isFinite(n)) return n;
  return fallback;
}
