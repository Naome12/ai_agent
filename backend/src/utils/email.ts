import nodemailer from "nodemailer";
import { env } from "../config/env";
import logger from "./logger";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
});

export async function sendMail(to: string, subject: string, html: string) {
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });
  logger.info({ msg: "Email sent", id: info.messageId, to, subject });
}
