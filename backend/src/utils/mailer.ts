import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import dotenv from "dotenv";
dotenv.config();

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

export const sendEmail = async (
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
) => {
  try {
    const sentFrom = new Sender(
      process.env.MAILERSEND_SENDER_ID,
      process.env.MAILER_SENDER_NAME
    );
    const recipients = [new Recipient(toEmail)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(htmlContent)
      .setText(textContent);

    const response = await mailerSend.email.send(emailParams);
    console.log(`Email sent to ${toEmail}`);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
