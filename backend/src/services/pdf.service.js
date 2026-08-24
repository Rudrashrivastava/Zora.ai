import PDFDocument from "pdfkit";

function sanitizePDFText(text) {
    if (!text) return "";
    return text
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/→|⇒|➔/g, "->")
        .replace(/←|⇐/g, "<-")
        .replace(/≠/g, "!=")
        .replace(/≤/g, "<=")
        .replace(/≥/g, ">=")
        .replace(/•/g, "*")
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
        .replace(/[^\x00-\x7F]/g, (ch) => {
            const code = ch.charCodeAt(0);
            return code >= 160 && code <= 255 ? ch : "";
        })
        .replace(/[ \t]+/g, " ");
}

/**
 * Generates a clean, readable PDF buffer from markdown/structured text notes.
 * Ideal for RGPV engineering students' semester notes.
 */
export function generateNotesPDF({ title, subject, semester, content }) {
    return new Promise((resolve, reject) => {
        try {
            const cleanTitle = sanitizePDFText(title || "RGPV Study Notes");
            const cleanSubject = sanitizePDFText(subject || "RGPV Syllabus Notes");
            const cleanSem = sanitizePDFText(semester || "1-8 Sem");

            const doc = new PDFDocument({
                size: "A4",
                margins: { top: 50, bottom: 60, left: 50, right: 50 },
                info: {
                    Title: cleanTitle,
                    Author: "Zora.ai AI Tutor",
                    Subject: cleanSubject,
                },
            });

            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            // Top Header Banner
            doc.rect(0, 0, 595.28, 80).fill("#111827");

            doc
                .fillColor("#38bdf8")
                .fontSize(20)
                .font("Helvetica-Bold")
                .text("Zora.ai - Engineering Study Notes", 50, 20);

            doc
                .fillColor("#9ca3af")
                .fontSize(10)
                .font("Helvetica")
                .text(
                    `Subject: ${cleanSubject}  |  Semester: ${cleanSem}  |  Date: ${new Date().toLocaleDateString()}`,
                    50,
                    50
                );

            doc.moveDown(3);

            // Document Title
            doc
                .fillColor("#0f172a")
                .fontSize(16)
                .font("Helvetica-Bold")
                .text(cleanTitle, { align: "left" });

            doc.moveDown(0.5);

            // Horizontal Separator Line
            doc
                .strokeColor("#38bdf8")
                .lineWidth(1.5)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();

            doc.moveDown(1);

            // Render Body Content line by line
            const lines = (content || "").split("\n");
            doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937");

            for (const rawLine of lines) {
                const line = sanitizePDFText(rawLine.trim());

                if (!line) {
                    doc.moveDown(0.3);
                    continue;
                }

                // Headings ### or ## or #
                if (line.startsWith("#")) {
                    const level = (line.match(/^#+/) || [""])[0].length;
                    const text = line.replace(/^#+\s*/, "");
                    const size = level === 1 ? 15 : level === 2 ? 13 : 11.5;

                    doc.moveDown(0.5);
                    doc
                        .font("Helvetica-Bold")
                        .fontSize(size)
                        .fillColor("#0f172a")
                        .text(text);
                    doc.font("Helvetica").fontSize(10.5).fillColor("#1f2937");
                    doc.moveDown(0.2);
                } else if (line.startsWith("- ") || line.startsWith("* ")) {
                    // Bullet points
                    const text = line.substring(2).replace(/\*\*(.*?)\*\*/g, "$1");
                    doc.text(`•  ${text}`, { indent: 12, lineGap: 2 });
                } else {
                    // Regular paragraph text
                    const cleanText = line.replace(/\*\*(.*?)\*\*/g, "$1");
                    doc.text(cleanText, { align: "justify", lineGap: 2.5 });
                }
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
