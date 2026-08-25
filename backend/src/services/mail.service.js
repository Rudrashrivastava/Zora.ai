import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 resolution to prevent IPv6 ENETUNREACH errors on hosts without IPv6 routing
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

const ipv4Lookup = (hostname, options, cb) => {
    dns.lookup(hostname, { family: 4 }, cb);
};

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
    family: 4,
    lookup: ipv4Lookup,
    auth: smtpAuth,
    connectionTimeout: 8000,
    socketTimeout: 8000,
});

export async function sendEmail({ to, subject, html, text }) {
    // 1. Resend HTTPS REST API (Port 443 - Unblockable on Render)
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
            console.error("[Email] Resend API error, trying Brevo fallback:", resendErr.message);
        }
    }

    // 2. Brevo (Sendinblue) - Handles both REST API (xkeysib-) & SMTP Relay (xsmtpsib-) keys
    if (process.env.BREVO_API_KEY) {
        const key = process.env.BREVO_API_KEY.trim();
        const senderEmail = process.env.GOOGLE_USER || process.env.EMAIL_USER || "rudrashrivastava45@gmail.com";
        const senderName = process.env.EMAIL_SENDER_NAME || "Zora.ai";

        // Case A: Brevo REST API Key (starts with xkeysib-)
        if (key.startsWith("xkeysib-")) {
            try {
                console.log("[Email] Sending via Brevo HTTPS REST API to:", to);
                const res = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "api-key": key,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sender: { name: senderName, email: senderEmail },
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
                console.error("[Email] Brevo REST API error, trying Brevo SMTP fallback:", brevoErr.message);
            }
        }

        // Case B: Brevo SMTP Relay Key (starts with xsmtpsib- or fallback from REST)
        try {
            console.log("[Email] Sending via Brevo SMTP Relay to:", to);
            const brevoTransporter = nodemailer.createTransport({
                host: "smtp-relay.brevo.com",
                port: 587,
                secure: false,
                lookup: ipv4Lookup,
                auth: {
                    user: senderEmail,
                    pass: key,
                },
                connectionTimeout: 8000,
                socketTimeout: 8000,
            });

            const details = await brevoTransporter.sendMail({
                from: `"${senderName}" <${senderEmail}>`,
                to,
                subject,
                html,
                text,
            });
            console.log("[Email] Brevo SMTP email delivered successfully:", details?.messageId);
            return details;
        } catch (brevoSmtpErr) {
            console.error("[Email] Brevo SMTP error, trying primary SMTP fallback:", brevoSmtpErr.message);
        }
    }

    // 3. Nodemailer OAuth2 / Gmail SMTP Fallback
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