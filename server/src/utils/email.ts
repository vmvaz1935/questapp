import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM_EMAIL,
      to,
      subject,
      html,
    });

    logger.debug({ messageId: info.messageId }, "Email enviado");
  } catch (error) {
    logger.error({ err: error }, "Falha ao enviar email");
    throw new Error("Não foi possível enviar o email");
  }
}
