import { tavily as Tavily } from "@tavily/core";

const tavily = Tavily({
    apiKey: process.env.TAVILY_API_KEY,
});

export const searchInternet = async ({ query }) => {
    try {
        console.log(`[Tavily] Searching web for: "${query}"`);

        const results = await tavily.search(query, {
            searchDepth: "basic",
            maxResults: 4,
            includeAnswer: false,
        });

        return JSON.stringify(results);
    } catch (error) {
        console.error("[Tavily] Search failed:", error);
        return JSON.stringify({ results: [], error: error.message });
    }
};