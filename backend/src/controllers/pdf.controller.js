import { generateNotesPDF } from "../services/pdf.service.js";

/**
 * Controller to generate and download printable PDF notes for RGPV students.
 * POST /api/pdf/generate
 */
export async function downloadNotesPDF(req, res) {
    try {
        const { title, subject, semester, content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Content is required to generate PDF notes.",
            });
        }

        console.log(`[PDF Generator] Generating PDF for: "${title || "Study Notes"}"`);

        const pdfBuffer = await generateNotesPDF({
            title: title || "RGPV Engineering Study Notes",
            subject: subject || "RGPV Syllabus",
            semester: semester || "1-8 Sem",
            content,
        });

        const safeFilename = (title || "RGPV_Study_Notes")
            .replace(/[^a-zA-Z0-9_\-]/g, "_")
            .toLowerCase();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeFilename}.pdf"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        return res.send(pdfBuffer);
    } catch (error) {
        console.error("[PDF Generator Error]:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate PDF notes: " + error.message,
        });
    }
}
