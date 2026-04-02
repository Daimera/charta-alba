import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!resend) {
    console.log(
      `[EMAIL - no RESEND_API_KEY set]\nTo: ${to}\nSubject: ${subject}\n\n${html}\n`
    );
    return;
  }

  await resend.emails.send({
    from: "Charta Alba <noreply@chartaalba.com>",
    to,
    subject,
    html,
  });
}
