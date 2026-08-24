import { MistralAIEmbeddings } from "@langchain/mistralai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

let mistralEmbeddings = null;
let geminiEmbeddings = null;

if (process.env.MISTRAL_API_KEY) {
    mistralEmbeddings = new MistralAIEmbeddings({
        apiKey: process.env.MISTRAL_API_KEY,
        model: "mistral-embed",
    });
}

if (process.env.GEMINI_API_KEY) {
    geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: "text-embedding-004",
    });
}

export const embeddings = {
    async embedQuery(text) {
        if (mistralEmbeddings) {
            try {
                return await mistralEmbeddings.embedQuery(text);
            } catch (err) {
                console.warn("Mistral embedding failed, attempting fallback:", err.message);
            }
        }
        if (geminiEmbeddings) {
            return await geminiEmbeddings.embedQuery(text);
        }
        throw new Error("No embedding provider available. Please set MISTRAL_API_KEY or GEMINI_API_KEY.");
    },

    async embedDocuments(documents) {
        if (mistralEmbeddings) {
            try {
                return await mistralEmbeddings.embedDocuments(documents);
            } catch (err) {
                console.warn("Mistral documents embedding failed, attempting fallback:", err.message);
            }
        }
        if (geminiEmbeddings) {
            return await geminiEmbeddings.embedDocuments(documents);
        }
        throw new Error("No embedding provider available. Please set MISTRAL_API_KEY or GEMINI_API_KEY.");
    },
};