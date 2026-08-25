import nodemailer from "nodemailer";
import dns from "dns";

// Prefer IPv4 DNS resolution to prevent IPv6 ENETUNREACH errors on hosts without IPv6 routing
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

const smtpAuth = (process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD)
    ? {
        user: process.env.GOOGLE_USER || process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
    }
    : {
        type: "OAuth2",
        user: process.env.GOOGLE_USER,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        clientId: process.env.GOOGLE_CLIENT_ID,
    };

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4, // Force IPv4 connection to prevent ENETUNREACH on IPv6
    auth: smtpAuth,
    connectionTimeout: 8000,
    socketTimeout: 8000,
});

export async function sendEmail({ to, subject, html, text }) {
    // 1. Prioritize HTTP REST API (Resend) if API key is provided (unblockable on Render port 443)
    if (process.env.RESEND_API_KEY) {
        try {
            const fromAddress = process.env.RESEND_FROM_EMAIL || "Zora.ai <onboarding@resend.dev>";
            console.log("[Email] Sending via Resend HTTPS REST API to:", to);
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: fromAddress,
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
            console.error("[Email] Resend API error, trying fallback:", resendErr.message);
        }
    }

    // 2. Brevo (Sendinblue) HTTPS REST API (Port 443 - Unblockable on Render, no custom domain needed)
    if (process.env.BREVO_API_KEY) {
        try {
            const senderName = process.env.EMAIL_SENDER_NAME || "Zora.ai";
            console.log("[Email] Sending via Brevo HTTPS REST API to:", to);
            const res = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sender: { name: senderName, email: process.env.GOOGLE_USER || "rudrashrivastava45@gmail.com" },
                    to: [{ email: to }],
                    subject,
                    htmlContent: html,
                    textContent: text,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(`Brevo API HTTP ${res.status}: ${JSON.stringify(errData)}`);
            }

            const data = await res.json();
            console.log("[Email] Brevo email delivered successfully:", data?.messageId);
            return data;
        } catch (brevoErr) {
            console.error("[Email] Brevo API error, trying SMTP fallback:", brevoErr.message);
        }
    }

    // 3. Fallback to Nodemailer OAuth2 / SMTP
    const senderName = process.env.EMAIL_SENDER_NAME || "Zora.ai";
    const mailOptions = {
        from: `"${senderName}" <${process.env.GOOGLE_USER || "noreply@zora.ai"}>`,
        to,
        subject,
        html,
        text,
    };

    const details = await transporter.sendMail(mailOptions);
    console.log("[Email] Email sent successfully via SMTP:", details?.messageId);
    return details;
}