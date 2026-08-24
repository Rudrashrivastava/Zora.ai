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
    connectionTimeout: 8000,
    socketTimeout: 8000,
});

export async function sendEmail({ to, subject, html, text }) {
    // 1. Prioritize HTTP REST API (Resend) if API key is provided (unblockable on Render port 443)
    if (process.env.RESEND_API_KEY) {
        try {
            console.log("[Email] Sending via Resend HTTPS REST API to:", to);
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "Zora.ai <onboarding@resend.dev>",
                    to: [to],
                    subject,
                    html,
                    text,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(`Resend API HTTP ${res.status}: ${JSON.stringify(errData)}`);
            }

            const data = await res.json();
            console.log("[Email] Resend email delivered successfully:", data?.id);
            return data;
        } catch (resendErr) {
            console.error("[Email] Resend API error, trying SMTP fallback:", resendErr.message);
        }
    }

    // 2. Fallback to Nodemailer OAuth2 / SMTP
    const mailOptions = {
        from: process.env.GOOGLE_USER || "noreply@zora.ai",
        to,
        subject,
        html,
        text,
    };

    const details = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully via SMTP:", details?.messageId);
    return details;
}