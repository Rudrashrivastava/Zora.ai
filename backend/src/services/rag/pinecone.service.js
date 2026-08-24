import { Pinecone } from "@pinecone-database/pinecone";

let pc = null;
let pineconeIndex = null;

export function getPineconeIndex() {
    if (!process.env.PINECONE_API_KEY) {
        return null;
    }
    if (!pc) {
        try {
            pc = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY,
            });
            const indexName = process.env.PINECONE_INDEX || "rag";
            pineconeIndex = pc.index(indexName);
        } catch (err) {
            console.warn("Pinecone initialization failed:", err.message);
            return null;
        }
    }
    return pineconeIndex;
}

export const index = {
    async upsert(params) {
        const idx = getPineconeIndex();
        if (idx) {
            return await idx.upsert(params);
        }
        return null;
    },
    async query(params) {
        const idx = getPineconeIndex();
        if (idx) {
            return await idx.query(params);
        }
        return null;
    },
};