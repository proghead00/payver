import axios from "axios";

export const sendEmail = async (
  toEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
) => {
  try {
    const response = await axios.post(
      "https://api.mailersend.com/v1/email",
      {
        from: { email: "MS_A9yuuv@trial-z3m5jgr3oqdgdpyo.mlsender.net" },
        to: [{ email: toEmail }],
        subject,
        text: textContent,
        html: htmlContent,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
        },
      }
    );

    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
