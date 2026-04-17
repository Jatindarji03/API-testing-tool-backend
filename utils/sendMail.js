import nodemailer from "nodemailer";

const sendMail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"${process.env.PROJECT_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, message: info.response };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default sendMail;
