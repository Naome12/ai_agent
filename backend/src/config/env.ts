import 'dotenv/config';

function must(name: string, dflt?: string) {
  const v = process.env[name] ?? dflt;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: must('JWT_SECRET'),
  jwtExpiresIn: must('JWT_EXPIRES_IN', '1h'),
  smtp: {
    host: must('SMTP_HOST'),
    port: parseInt(must('SMTP_PORT'), 10),
    user: must('SMTP_USER'),
    pass: must('SMTP_PASS'),
    from: must('EMAIL_FROM'),
  },
  appBaseUrl: must('APP_BASE_URL'),
  apiBaseUrl: must('API_BASE_URL'),
  tokenTtlHours: parseInt(must('TOKEN_TTL_HOURS', '24'), 10),
};
