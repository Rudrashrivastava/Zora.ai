import { Router } from "express";
import { downloadNotesPDF } from "../controllers/pdf.controller.js";

const pdfRouter = Router();

// Route to generate and download PDF notes
pdfRouter.post("/generate", downloadNotesPDF);

export default pdfRouter;
