import { embeddings } from "./embedding.service.js";
import { index as pineconeIndex } from "./pinecone.service.js";
import { ChunkModel } from "../../models/document.model.js";

/**
 * Calculates cosine similarity between two numeric vectors.
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieves relevant document chunks matching the query for a user.
 */
export async function retrieveDocuments(query, userId = null, topK = 4) {
    if (!query || !query.trim()) return [];

    try {
        const queryEmbedding = await embeddings.embedQuery(query);

        // 1. Try Pinecone if available
        try {
            const pineconeResult = await pineconeIndex.query({
                vector: queryEmbedding,
                topK,
                includeMetadata: true,
                filter: userId ? { userId: String(userId) } : undefined,
            });

            if (pineconeResult?.matches && pineconeResult.matches.length > 0) {
                const docs = pineconeResult.matches
                    .filter((m) => m.score > 0.4)
                    .map((m) => ({
                        text: m.metadata?.text || "",
                        score: m.score,
                        source: m.metadata?.source || m.metadata?.title || "Document",
                        title: m.metadata?.title || "Document",
                        documentId: m.metadata?.documentId,
                        type: "document",
                    }));
                if (docs.length > 0) return docs;
            }
        } catch (pineErr) {
            // Pinecone failed or unconfigured, fall through to MongoDB cosine similarity
        }

        // 2. Direct MongoDB Vector Search fallback
        const filter = userId ? { user: userId } : {};
        const chunks = await ChunkModel.find(filter)
            .select("text embedding metadata document")
            .populate("document", "title originalName")
            .limit(200)
            .lean();

        if (!chunks || chunks.length === 0) {
            return [];
        }

        // Calculate cosine similarity for all chunks
        const scoredChunks = chunks.map((chunk) => {
            const score = cosineSimilarity(queryEmbedding, chunk.embedding);
            return {
                text: chunk.text,
                score,
                source: chunk.metadata?.source || chunk.document?.originalName || "Document",
                title: chunk.metadata?.title || chunk.document?.title || "Document",
                documentId: chunk.document?._id || chunk.document,
                type: "document",
            };
        });

        // Sort by score descending and take topK
        scoredChunks.sort((a, b) => b.score - a.score);

        const filtered = scoredChunks.filter((item) => item.score > 0.2);
        if (filtered.length > 0) {
            return filtered.slice(0, topK);
        }

        // Fallback: return top chunks regardless of score if user has uploaded docs
        return scoredChunks.slice(0, topK);

    } catch (error) {
        console.error("Retrieval error:", error);
        return [];
    }
}