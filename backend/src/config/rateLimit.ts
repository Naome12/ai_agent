import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 100 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
