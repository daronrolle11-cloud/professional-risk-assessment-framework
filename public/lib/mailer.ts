import nodemailer from "nodemailer";

export async function sendReportEmail(opts: {
  to: string;
  bcc?: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM) {
    return { mode: "simulated" as const, messageId: null };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to: opts.to,
    bcc: opts.bcc,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });

  return { mode: "smtp" as const, messageId: info.messageId ?? null };
}
