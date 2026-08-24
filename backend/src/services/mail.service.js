import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_USER,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        clientId: process.env.GOOGLE_CLIENT_ID,
    },
    connectionTimeout: 5000, // 5 sec timeout to prevent hanging cloud requests
    socketTimeout: 5000,
});

transporter.verify()
    .then(() => { console.log("Email transporter is ready to send emails"); })
    .catch((err) => { console.warn("Email transporter verification warning (SMTP timed out or restricted):", err.message); });

export async function sendEmail({ to, subject, html, text }) {
    try {
        const mailOptions = {
            from: process.env.GOOGLE_USER || "noreply@zora.ai",
            to,
            subject,
            html,
            text,
        };

        const details = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", details?.messageId);
        return details;
    } catch (err) {
        console.warn("[sendEmail] Cloud SMTP transport timed out/failed:", err.message);
        throw err;
    }
}