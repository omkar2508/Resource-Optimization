import axios from "axios";

const transporter = {
  async sendMail(mailOptions) {
    const { from, to, subject, html, text } = mailOptions;

    return axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: from || process.env.SENDER_EMAIL,
        },
        to: Array.isArray(to)
          ? to.map(email => ({ email }))
          : [{ email: to }],
        subject,
        htmlContent: html || `<p>${text || ""}</p>`,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  },
};

export default transporter;