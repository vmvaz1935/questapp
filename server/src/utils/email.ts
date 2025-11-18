import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('Email não configurado. Emails não serão enviados.');
    // Criar transporter fake para desenvolvimento
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    
    console.log(`Email enviado para: ${options.to}`);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    // Em desenvolvimento, não falhar se email não estiver configurado
    if (env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

