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
export async function retrieveDocuments(query, userId = null, topK = 5) {
    if (!query || !query.trim()) return [];

    try {
        let queryEmbedding = null;
        try {
            queryEmbedding = await embeddings.embedQuery(query);
        } catch (embedErr) {
            console.warn("[Retrieval] Vector query embedding failed, falling back to keyword search:", embedErr.message);
        }

        // 1. Try Pinecone if available and queryEmbedding exists
        if (queryEmbedding && pineconeIndex) {
            try {
                const pineconeResult = await pineconeIndex.query({
                    vector: queryEmbedding,
                    topK,
                    includeMetadata: true,
                    filter: userId ? { userId: String(userId) } : undefined,
                });

                if (pineconeResult?.matches && pineconeResult.matches.length > 0) {
                    const docs = pineconeResult.matches
                        .filter((m) => m.score > 0.15 && m.metadata?.text)
                        .map((m) => ({
                            text: m.metadata.text,
                            score: m.score,
                            source: m.metadata?.source || m.metadata?.title || "Document",
                            title: m.metadata?.title || "Document",
                            documentId: m.metadata?.documentId,
                            type: "document",
                        }));
                    if (docs.length > 0) {
                        console.log(`[Retrieval] Pinecone returned ${docs.length} relevant chunks`);
                        return docs;
                    }
                }
            } catch (pineErr) {
                // Pinecone unconfigured or failed, fall through to MongoDB
            }
        }

        // 2. Direct MongoDB Vector & Keyword Fallback Search
        const filter = userId ? { user: userId } : {};
        const rawChunks = await ChunkModel.find(filter)
            .select("text embedding metadata document")
            .populate("document", "title originalName")
            .limit(200)
            .lean();

        // CRITICAL FIX: Filter out orphaned chunks whose parent document has been deleted by user
        const chunks = (rawChunks || []).filter((c) => c.document && c.document._id);

        if (!chunks || chunks.length === 0) {
            return [];
        }

        if (queryEmbedding) {
            const validChunks = chunks.filter(
                (c) => Array.isArray(c.embedding) && c.embedding.length > 0 && !c.embedding.every((v) => v === 0)
            );

            if (validChunks.length > 0) {
                const scoredChunks = validChunks.map((chunk) => {
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

                scoredChunks.sort((a, b) => b.score - a.score);

                // Lower threshold to 0.1 for maximum semantic recall
                const filtered = scoredChunks.filter((item) => item.score > 0.1);
                if (filtered.length > 0) {
                    console.log(`[Retrieval] MongoDB returned ${filtered.length} relevant vector chunks (best score: ${scoredChunks[0].score.toFixed(4)})`);
                    return filtered.slice(0, topK);
                }
            }
        }

        // 3. Keyword Text Matching Fallback
        const lowerQuery = query.toLowerCase();
        const keywords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);

        if (keywords.length > 0) {
            const keywordMatched = chunks
                .map((chunk) => {
                    const txt = (chunk.text || "").toLowerCase();
                    const matchCount = keywords.reduce((acc, k) => acc + (txt.includes(k) ? 1 : 0), 0);
                    return {
                        text: chunk.text,
                        score: matchCount / keywords.length,
                        source: chunk.metadata?.source || chunk.document?.originalName || "Document",
                        title: chunk.metadata?.title || chunk.document?.title || "Document",
                        documentId: chunk.document?._id || chunk.document,
                        type: "document",
                    };
                })
                .filter((item) => item.score > 0)
                .sort((a, b) => b.score - a.score);

            if (keywordMatched.length > 0) {
                console.log(`[Retrieval] Keyword search returned ${keywordMatched.length} matching chunks`);
                return keywordMatched.slice(0, topK);
            }
        }

        // 4. General Document Fallback (When asking general overview/summary questions on active uploaded files)
        if (/summary|summarize|document|file|pdf|content|overview|all|read|my doc|notes|resume|cv|who|what/i.test(query)) {
            console.log(`[Retrieval] Returning top ${Math.min(chunks.length, topK)} default chunks for active document inquiry`);
            return chunks.slice(0, topK).map((c) => ({
                text: c.text,
                score: 0.5,
                source: c.metadata?.source || c.document?.originalName || "Document",
                title: c.metadata?.title || c.document?.title || "Document",
                documentId: c.document?._id || c.document,
                type: "document",
            }));
        }

        return [];
    } catch (error) {
        console.error("Retrieval error:", error);
        return [];
    }
}