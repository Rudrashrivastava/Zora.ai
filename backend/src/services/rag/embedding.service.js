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
        let lastErr = null;

        if (mistralEmbeddings) {
            try {
                return await mistralEmbeddings.embedQuery(text);
            } catch (err) {
                console.warn("[Embeddings] Mistral query embedding failed, trying fallback:", err.message);
                lastErr = err;
            }
        }
        if (geminiEmbeddings) {
            try {
                return await geminiEmbeddings.embedQuery(text);
            } catch (err) {
                console.warn("[Embeddings] Gemini query embedding failed:", err.message);
                lastErr = err;
            }
        }
        throw lastErr || new Error("All AI embedding providers are temporarily unavailable (quota limits or network issue).");
    },

    async embedDocuments(documents) {
        let lastErr = null;

        if (mistralEmbeddings) {
            try {
                return await mistralEmbeddings.embedDocuments(documents);
            } catch (err) {
                console.warn("[Embeddings] Mistral documents embedding failed, trying fallback:", err.message);
                lastErr = err;
            }
        }
        if (geminiEmbeddings) {
            try {
                return await geminiEmbeddings.embedDocuments(documents);
            } catch (err) {
                console.warn("[Embeddings] Gemini documents embedding failed:", err.message);
                lastErr = err;
            }
        }
        throw lastErr || new Error("All AI embedding providers are temporarily unavailable (quota limits or network issue).");
    },
};