import nodemailer from "nodemailer";

type EmailOptions = {
    to: string;
    subject: string;
    body: string;
    attachments?: { filename: string; path: string }[];
};

/**
 * Sends an email using Gmail SMTP.
 *
 * @param {EmailOptions} options - Email options including recipient, subject, and body.
 * @throws {Error} Throws if email credentials are missing or sending fails.
 */
export const sendEmail = async ({ to, subject, body, attachments }: EmailOptions) => {
    try {

        const emailUser = process.env.EMAIL_USER;
        const emailPassword = process.env.EMAIL_PASSWORD;

        if (!emailUser || !emailPassword) {
            throw new Error("Email credentials not set in environment variables.");
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPassword,
            },
        });

        await transporter.sendMail({
            from: `"NiveshPath" <${emailUser}>`,
            to,
            subject,
            html: body,
            attachments
        });

    } catch (error: any) {
        console.error(`Failed to send email to ${to}:`, error.message || error);
        throw new Error(`Email sending failed: ${error.message || "Unknown error"}`);
    }
};
