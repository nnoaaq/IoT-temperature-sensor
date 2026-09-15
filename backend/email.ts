import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const emailAddress = process.env.EMAIL_ADDRESS;
export const sendEmail = async (subject: string, message: string) => {
  if (!emailAddress) return;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: emailAddress,
    subject: subject,
    html: message,
  });
};
