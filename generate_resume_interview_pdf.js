import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

async function generatePDF() {
    const mdPath = "d:\\perplexity\\RESUME_INTERVIEW_MASTER_DEFENSE.md";
    const pdfPath = "d:\\perplexity\\Zora_AI_Resume_Interview_Master_Defense.pdf";
    const artifactPath = "C:\\Users\\rudra\\.gemini\\antigravity-ide\\brain\\4b39e483-6f6d-459d-be10-e81860d01e81\\Zora_AI_Resume_Interview_Master_Defense.pdf";

    if (!fs.existsSync(mdPath)) {
        console.error("MD file not found");
        return;
    }

    const content = fs.readFileSync(mdPath, "utf8");
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Title Banner
    doc.rect(40, 40, 515, 60).fill("#0F172A");
    doc.fillColor("#38BDF8").fontSize(20).text("ZORA.AI — RESUME INTERVIEW DEFENSE", 55, 55, { bold: true });
    doc.fillColor("#94A3B8").fontSize(10).text("Comprehensive Q&A & Technical Defense Guide Matched to Your Resume", 55, 80);

    doc.moveDown(3);
    doc.fillColor("#1E293B");

    const lines = content.split("\n");

    for (let line of lines) {
        if (line.startsWith("# ")) {
            doc.addPage();
            doc.fillColor("#0F172A").fontSize(16).text(line.replace("# ", "").trim(), { underline: true });
            doc.moveDown(0.5);
        } else if (line.startsWith("## ")) {
            doc.moveDown(0.5);
            doc.fillColor("#1E3A8A").fontSize(13).text(line.replace("## ", "").trim());
            doc.moveDown(0.3);
        } else if (line.startsWith("### ")) {
            doc.moveDown(0.4);
            doc.fillColor("#0284C7").fontSize(11).text(line.replace("### ", "").trim());
            doc.moveDown(0.2);
        } else if (line.startsWith("#### ")) {
            doc.moveDown(0.3);
            doc.fillColor("#0369A1").fontSize(10).text(line.replace("#### ", "").trim());
            doc.moveDown(0.2);
        } else if (line.startsWith("> ")) {
            doc.fillColor("#334155").fontSize(9.5).text(line.replace("> ", "").trim(), { italic: true });
            doc.moveDown(0.3);
        } else if (line.startsWith("• ") || line.startsWith("- ")) {
            doc.fillColor("#334155").fontSize(9.5).text(line, { indent: 10 });
            doc.moveDown(0.2);
        } else if (line.trim().length > 0) {
            doc.fillColor("#334155").fontSize(9.5).text(line);
            doc.moveDown(0.2);
        }
    }

    doc.end();

    stream.on("finish", () => {
        console.log("PDF generated successfully at:", pdfPath);
        fs.copyFileSync(pdfPath, artifactPath);
        console.log("Copied PDF to artifact path:", artifactPath);
    });
}

generatePDF();
