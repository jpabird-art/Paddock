import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM ?? "paddock@hcmr.local";

/** True when SMTP is configured — email sending is optional. */
export const emailEnabled = Boolean(smtpHost && smtpUser && smtpPass);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}
