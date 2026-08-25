import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";
import { retrieveDocuments } from "./rag/retrieval.service.js";

// Lazy-initialize LLM so process.env is always populated by the time it's called
let _llm = null;
function getLLM() {
    if (_llm) return _llm;

    if (process.env.GEMINI_API_KEY) {
        try {
            const key = process.env.GEMINI_API_KEY.trim();
            const isOAuth = key.startsWith("AQ.");
            
            _llm = new ChatGoogleGenerativeAI({
                model: "gemini-1.5-flash-latest",
                apiKey: isOAuth ? undefined : key,
                ...(isOAuth ? { customHeaders: { Authorization: `Bearer ${key}` } } : {}),
                temperature: 0.2,
            });
            console.log(`[AI] Using Gemini AI (gemini-1.5-flash-latest) [Mode: ${isOAuth ? "OAuth Bearer" : "Standard Key"}]`);
            return _llm;
        } catch (err) {
            console.warn("[AI] Gemini init failed, trying Mistral:", err.message);
        }
    }

    if (process.env.MISTRAL_API_KEY) {
        try {
            _llm = new ChatMistralAI({
                model: "mistral-small-latest",
                apiKey: process.env.MISTRAL_API_KEY,
                temperature: 0.2,
            });
            console.log("[AI] Using Mistral AI");
            return _llm;
        } catch (err) {
            console.warn("[AI] Mistral init failed:", err.message);
        }
    }

    throw new Error("No AI provider configured. Set GEMINI_API_KEY or MISTRAL_API_KEY in .env");
}

/**
 * Creates tools with tracking for cited sources during a single request.
 */
function createTrackedTools(userId, collectedSources) {
    const searchInternetTool = tool(
        async ({ query }) => {
            try {
                console.log(`[Tavily] Searching: "${query}"`);
                const rawResults = await searchInternet({ query });
                const parsed = typeof rawResults === "string" ? JSON.parse(rawResults) : rawResults;
                const items = parsed?.results || [];

                for (const item of items) {
                    if (item.url && !collectedSources.some((s) => s.url === item.url)) {
                        collectedSources.push({
                            title: item.title || "Web Source",
                            url: item.url,
                            snippet: item.content?.slice(0, 250) || "",
                            type: "web",
                            source: item.url,
                        });
                    }
                }

                return JSON.stringify(
                    items.map((i) => ({
                        title: i.title,
                        url: i.url,
                        content: i.content,
                        publishedDate: i.published_date || null,
                    }))
                );
            } catch (err) {
                console.error("[searchInternet] tool error:", err.message);
                return "Failed to search internet.";
            }
        },
        {
            name: "searchInternet",
            description:
                "Search the live web for current events, latest news, real-time data, and up-to-date facts. ALWAYS use this for any question about recent events, prices, sports scores, today's news, or anything that changes over time.",
            schema: z.object({
                query: z.string().describe("The precise search query to find current information on the web"),
            }),
        }
    );

    const retrieveDocumentsTool = tool(
        async ({ query }) => {
            try {
                if (!userId) return "No user context for document retrieval.";
                const docs = await retrieveDocuments(query, userId, 4);

                if (!docs || docs.length === 0) return "No relevant documents found in knowledge base.";

                for (const doc of docs) {
                    const snippet = doc.text?.slice(0, 100) || "";
                    if (!collectedSources.some((s) => s.source === doc.source && s.snippet === snippet)) {
                        collectedSources.push({
                            title: doc.title || doc.source || "User Document",
                            snippet: doc.text?.slice(0, 250) || "",
                            type: "document",
                            source: doc.source,
                            score: doc.score,
                        });
                    }
                }

                return JSON.stringify(docs.map((d) => ({ title: d.title, text: d.text, score: d.score })));
            } catch (err) {
                console.error("[retrieveDocuments] tool error:", err.message);
                return "No matching documents found in user knowledge base.";
            }
        },
        {
            name: "retrieveDocuments",
            description:
                "Search user's private uploaded knowledge base, files, PDFs, and documents for relevant context. Use when asked about their own uploaded files or personal notes.",
            schema: z.object({
                query: z.string().describe("Query to find relevant knowledge chunks from uploaded documents"),
            }),
        }
    );

    const getCurrentTimeTool = tool(
        async ({ timezone }) => {
            try {
                const tz = timezone || "Asia/Kolkata";
                const now = new Date();
                const timeStr = now.toLocaleTimeString("en-US", {
                    timeZone: tz,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                });
                const dateStr = now.toLocaleDateString("en-US", {
                    timeZone: tz,
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
                return `Current Live Time in ${tz}: ${timeStr} on ${dateStr}`;
            } catch (err) {
                return `Current Server Time: ${new Date().toLocaleString()}`;
            }
        },
        {
            name: "getCurrentTime",
            description:
                "Get the exact live current clock time and date for any location/timezone (e.g. Asia/Kolkata for India, America/New_York, UTC). ALWAYS call this tool for queries about current time or clock.",
            schema: z.object({
                timezone: z.string().optional().describe("Optional IANA timezone string like Asia/Kolkata, UTC, America/New_York"),
            }),
        }
    );

    const calculateMathTool = tool(
        async ({ expression }) => {
            try {
                // Sanitize math expression to prevent code injection
                const cleanExpr = expression.replace(/[^0-9+\-*/().^% \tMath.sin|cos|tan|sqrt|pow|abs|log]/g, "");
                if (!cleanExpr.trim()) return "Invalid mathematical expression.";

                // Safe mathematical evaluation using Function constructor
                const result = Function(`"use strict"; return (${cleanExpr})`)();
                return `Result of (${expression}) = ${result}`;
            } catch (err) {
                return `Math calculation error: ${err.message}`;
            }
        },
        {
            name: "calculateMath",
            description:
                "Perform exact mathematical calculations, formulas, financial interest, percentages, or complex arithmetic. ALWAYS use this tool for any math question to avoid LLM calculation errors.",
            schema: z.object({
                expression: z.string().describe("The mathematical expression to evaluate, e.g., '12500 * (1 + 0.085/12)**(12*5)' or 'sqrt(144) + 45 * 2.5'"),
            }),
        }
    );

    const fetchWebPageUrlTool = tool(
        async ({ url }) => {
            try {
                console.log(`[WebFetch] Fetching URL: "${url}"`);
                const response = await fetch(url, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
                    signal: AbortSignal.timeout(5000),
                });
                if (!response.ok) return `Failed to fetch URL ${url}: HTTP status ${response.status}`;

                const html = await response.text();
                // Extract body text and strip tags
                const bodyText = html
                    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "")
                    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/[ \t]+/g, " ")
                    .replace(/\n\s*\n/g, "\n")
                    .slice(0, 3000);

                if (!collectedSources.some((s) => s.url === url)) {
                    collectedSources.push({
                        title: `Webpage: ${url}`,
                        url,
                        snippet: bodyText.slice(0, 200),
                        type: "web",
                        source: url,
                    });
                }

                return `Webpage content from ${url}:\n\n${bodyText}`;
            } catch (err) {
                return `Error reading URL ${url}: ${err.message}`;
            }
        },
        {
            name: "fetchWebPageUrl",
            description:
                "Fetch and read raw text content directly from any HTTP/HTTPS website URL when the user provides a link or asks to read a specific website page.",
            schema: z.object({
                url: z.string().describe("The full URL of the webpage to read, e.g. 'https://en.wikipedia.org/wiki/Artificial_intelligence'"),
            }),
        }
    );

    const calculateFinancialTaxTool = tool(
        async ({ calculationType, principal, rate, timeYears, gstRate }) => {
            try {
                const p = parseFloat(principal) || 0;
                const r = parseFloat(rate) || 0;
                const t = parseFloat(timeYears) || 1;

                if (calculationType === "gst") {
                    const ratePct = parseFloat(gstRate) || 18;
                    const gstAmount = (p * ratePct) / 100;
                    const totalAmount = p + gstAmount;
                    const cgst = gstAmount / 2;
                    const sgst = gstAmount / 2;
                    return `GST Breakdown (${ratePct}% rate on ₹${p.toLocaleString()}):
• Net Amount: ₹${p.toLocaleString()}
• CGST (${ratePct / 2}%): ₹${cgst.toLocaleString()}
• SGST (${ratePct / 2}%): ₹${sgst.toLocaleString()}
• Total GST: ₹${gstAmount.toLocaleString()}
• Gross Total: ₹${totalAmount.toLocaleString()}`;
                }

                if (calculationType === "emi") {
                    const monthlyRate = r / 12 / 100;
                    const totalMonths = t * 12;
                    const emi = (p * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
                    const totalPayment = emi * totalMonths;
                    const totalInterest = totalPayment - p;
                    return `Loan EMI Breakdown (Principal: ₹${p.toLocaleString()}, Interest Rate: ${r}%, Tenure: ${t} years / ${totalMonths} months):
• Monthly EMI: ₹${Math.round(emi).toLocaleString()}
• Total Interest Payable: ₹${Math.round(totalInterest).toLocaleString()}
• Total Repayment Amount: ₹${Math.round(totalPayment).toLocaleString()}`;
                }

                if (calculationType === "sip") {
                    const monthlyRate = r / 12 / 100;
                    const totalMonths = t * 12;
                    const invested = p * totalMonths;
                    const futureValue = p * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
                    const estimatedReturns = futureValue - invested;
                    return `SIP Investment Projection (Monthly Deposit: ₹${p.toLocaleString()}, Expected Return: ${r}%, Tenure: ${t} years):
• Total Investment: ₹${Math.round(invested).toLocaleString()}
• Estimated Wealth Gained: ₹${Math.round(estimatedReturns).toLocaleString()}
• Total Future Portfolio Value: ₹${Math.round(futureValue).toLocaleString()}`;
                }

                if (calculationType === "income_tax_new_regime") {
                    let taxableIncome = Math.max(0, p - 75000); // 75k Std deduction FY 2025-26
                    let tax = 0;
                    if (taxableIncome <= 300000) tax = 0;
                    else if (taxableIncome <= 700000) tax = (taxableIncome - 300000) * 0.05;
                    else if (taxableIncome <= 1000000) tax = 20000 + (taxableIncome - 700000) * 0.10;
                    else if (taxableIncome <= 1200000) tax = 50000 + (taxableIncome - 1000000) * 0.15;
                    else if (taxableIncome <= 1500000) tax = 80000 + (taxableIncome - 120000) * 0.20;
                    else tax = 140000 + (taxableIncome - 1500000) * 0.30;

                    // Rebate u/s 87A for taxable income up to 7L
                    if (p <= 775000) tax = 0;

                    const cess = tax * 0.04;
                    const totalTax = tax + cess;
                    return `Income Tax Estimate (New Tax Regime FY 2025-26) for Annual Salary ₹${p.toLocaleString()}:
• Standard Deduction: ₹75,000
• Net Taxable Income: ₹${taxableIncome.toLocaleString()}
• Basic Tax Liability: ₹${Math.round(tax).toLocaleString()}
• Health & Education Cess (4%): ₹${Math.round(cess).toLocaleString()}
• Net Payable Tax: ₹${Math.round(totalTax).toLocaleString()}`;
                }

                return "Unsupported calculation type. Supported: 'gst', 'emi', 'sip', 'income_tax_new_regime'";
            } catch (err) {
                return `Financial calculation error: ${err.message}`;
            }
        },
        {
            name: "calculateFinancialTax",
            description:
                "Perform exact CA / Financial calculations: GST breakdown, Loan EMI, Mutual Fund SIP returns, and Indian Income Tax estimation (New Regime FY 2025-26).",
            schema: z.object({
                calculationType: z.enum(["gst", "emi", "sip", "income_tax_new_regime"]).describe("The financial formula type to run"),
                principal: z.number().describe("The base amount, salary, loan principal, or monthly SIP deposit in INR"),
                rate: z.number().optional().describe("Annual interest rate or expected return percentage (e.g. 12 for 12%)"),
                timeYears: z.number().optional().describe("Tenure or duration in years (e.g. 5 for 5 years)"),
                gstRate: z.number().optional().describe("GST percentage rate (e.g. 5, 12, 18, 28)"),
            }),
        }
    );

    const convertUnitsAndEngineeringTool = tool(
        async ({ conversionType, value, fromUnit, toUnit, constantName }) => {
            try {
                if (conversionType === "constants") {
                    const constants = {
                        speed_of_light: "c = 299,792,458 m/s (3 × 10^8 m/s)",
                        plancks_constant: "h = 6.62607015 × 10^-34 J·s",
                        gravitational_acceleration: "g = 9.80665 m/s^2 (Standard Earth Gravity)",
                        gravitational_constant: "G = 6.67430 × 10^-11 m^3·kg^-1·s^-2",
                        avogadro_number: "N_A = 6.02214076 × 10^23 mol^-1",
                        electron_charge: "e = 1.602176634 × 10^-19 Coulombs",
                        boltzmann_constant: "k_B = 1.380649 × 10^-23 J/K",
                        permittivity_free_space: "ε_0 = 8.8541878128 × 10^-12 F/m",
                    };
                    const key = constantName?.toLowerCase().replace(/[ \t]/g, "_");
                    if (key && constants[key]) {
                        return `Scientific Constant [${constantName}]: ${constants[key]}`;
                    }
                    return `Standard Scientific & Engineering Constants:\n${Object.entries(constants).map(([k, v]) => `• ${k.replace(/_/g, " ").toUpperCase()}: ${v}`).join("\n")}`;
                }

                if (conversionType === "data_storage") {
                    const bytesMap = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5 };
                    const from = (fromUnit || "MB").toUpperCase();
                    const to = (toUnit || "GB").toUpperCase();
                    if (bytesMap[from] && bytesMap[to]) {
                        const inBytes = value * bytesMap[from];
                        const converted = inBytes / bytesMap[to];
                        return `Data Storage Conversion: ${value} ${from} = ${converted.toLocaleString()} ${to} (${inBytes.toLocaleString()} Bytes)`;
                    }
                }

                if (conversionType === "temperature") {
                    const v = parseFloat(value);
                    const from = (fromUnit || "C").toUpperCase();
                    const to = (toUnit || "F").toUpperCase();
                    let celsius = v;
                    if (from === "F") celsius = (v - 32) * (5 / 9);
                    if (from === "K") celsius = v - 273.15;

                    let result = celsius;
                    if (to === "F") result = celsius * (9 / 5) + 32;
                    if (to === "K") result = celsius + 273.15;

                    return `Temperature Conversion: ${v}°${from} = ${result.toFixed(2)}°${to}`;
                }

                return `Unit Conversion Result for ${value} ${fromUnit} -> ${toUnit}`;
            } catch (err) {
                return `Conversion error: ${err.message}`;
            }
        },
        {
            name: "convertUnitsAndEngineering",
            description:
                "Convert physical units (data storage Bytes/KB/MB/GB/TB, Temperature C/F/K, Length) and lookup exact Engineering / Scientific Physics constants (c, h, g, G, N_A, e).",
            schema: z.object({
                conversionType: z.enum(["data_storage", "temperature", "constants"]).describe("Type of conversion or lookup"),
                value: z.number().optional().describe("Numeric value to convert"),
                fromUnit: z.string().optional().describe("Starting unit like 'MB', 'GB', 'C', 'F', 'K'"),
                toUnit: z.string().optional().describe("Target unit like 'GB', 'TB', 'F', 'C'"),
                constantName: z.string().optional().describe("Scientific constant name like 'speed_of_light', 'plancks_constant', 'gravitational_acceleration'"),
            }),
        }
    );

    const pedagogicalTutorTool = tool(
        async ({ topic, targetAudience }) => {
            return `Pedagogical Framework for Topic "${topic}" (Target: ${targetAudience || "Students"}):
1. REAL-WORLD ANALOGY: Connect ${topic} to an everyday physical scenario.
2. ELI5 SUMMARY: Explain the core principle in 2 simple sentences without jargon.
3. STEP-BY-STEP BREAKDOWN: Deconstruct into 3 logical chronological steps.
4. STUDENT QUIZ: Formulate 1 conceptual multiple-choice question to test understanding.`;
        },
        {
            name: "pedagogicalTutor",
            description:
                "Structure explanations using pedagogical teacher best-practices: Real-world Analogy + ELI5 + Step-by-Step Breakdown + Self-Assessment Quiz Question.",
            schema: z.object({
                topic: z.string().describe("The subject, code concept, or science topic to teach"),
                targetAudience: z.string().optional().describe("Audience level, e.g. 'Engineering Student', '5-year-old', 'Beginner'"),
            }),
        }
    );

    const rgpvNotesGeneratorTool = tool(
        async ({ subject, semester, branch, unitNumber }) => {
            const sem = semester || "1st - 8th Semester";
            const br = branch || "Computer Science / IT / Engineering";
            const unit = unitNumber ? `Unit ${unitNumber}` : "All Units (Unit 1 to 5)";

            return `RGPV Syllabus Notes Framework for ${subject} (${sem}, Branch: ${br}):
Target Unit: ${unit}

STRUCTURE TO GENERATE IN MARKDOWN:
1. 📚 SUBJECT & SYLLABUS OVERVIEW (RGPV Pattern)
2. 🔑 UNIT-BY-UNIT CORE CONCEPTS & DEFINITIONS
3. 📐 KEY FORMULAS / ALGORITHMS / DIAGRAM DESCRIPTIONS
4. 📝 TOP 5 HIGH-FREQUENCY RGPV EXAM QUESTIONS WITH ANSWERS
5. 💡 EXAM TIP: Highlight 7-mark vs 14-mark question strategies for RGPV exams.`;
        },
        {
            name: "rgpvNotesGenerator",
            description:
                "Generate structured, high-quality RGPV Engineering semester notes (Sem 1 to 8, CSE/IT/ECE/ME/CE) with Unit-wise concepts, key formulas, and high-probability RGPV exam questions.",
            schema: z.object({
                subject: z.string().describe("The engineering subject name, e.g. 'Data Structures', 'Operating Systems', 'DBMS', 'Engineering Mathematics-1'"),
                semester: z.string().optional().describe("Semester number 1 to 8, e.g. 'Semester 4' or '4th Sem'"),
                branch: z.string().optional().describe("Engineering branch like CSE, IT, ECE, ME, CE"),
                unitNumber: z.number().optional().describe("Optional specific unit number 1 to 5"),
            }),
        }
    );

    return [
        searchInternetTool,
        retrieveDocumentsTool,
        getCurrentTimeTool,
        calculateMathTool,
        fetchWebPageUrlTool,
        calculateFinancialTaxTool,
        convertUnitsAndEngineeringTool,
        pedagogicalTutorTool,
        rgpvNotesGeneratorTool,
    ];
}

/**
 * Generates an AI response given context messages and user ID.
 * Returns { answer, sources }
 */
export async function generateResponse(messages, userId = null) {
    const llm = getLLM();
    const collectedSources = [];
    const tools = createTrackedTools(userId, collectedSources);

    const agent = createAgent({ model: llm, tools });

    // Dynamic date and time so LLM always knows exact live clock time
    const now = new Date();
    const currentDateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const currentTimeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
    const currentYear = now.getFullYear();

    const systemPrompt = `You are Zora.ai, an advanced AI search and knowledge assistant (like Perplexity AI).

EXACT CURRENT TIME & DATE: ${currentDateStr} at ${currentTimeStr} (Year: ${currentYear}).

CORE RULES — FOLLOW STRICTLY:
1. FOR CURRENT TIME / CLOCK / TODAY'S DATE:
   - Always state the EXACT CURRENT TIME & DATE (${currentDateStr} at ${currentTimeStr}) directly from the system context above.
   - DO NOT call searchInternet for questions asking "what is the time", "current time", or "what time is it". Web search snippets contain stale cached times.

2. FOR UPLOADED DOCUMENTS / CV / RESUME / PERSONAL FILES:
   - YOU MUST CALL the retrieveDocuments tool FIRST to fetch the user's uploaded document content.
   - DO NOT call the searchInternet tool for questions about the user's uploaded CV, resume, notes, or files.
   - STRICT GROUNDING: Answer strictly based on the text retrieved from retrieveDocuments. Do NOT hallucinate, invent, or bring external internet data into the user's personal document details. If the document does not contain an answer, state clearly that it is not present in the uploaded document.

3. FOR GENERAL KNOWLEDGE / REAL-TIME WEB QUERIES:
   - For questions about latest news, current events, live prices, sports scores, or public facts:
     YOU MUST call the searchInternet tool FIRST with a targeted search query.

4. RESPONSE FORMAT:
   - Synthesize a clear, factual answer in clean Markdown.
   - Use bold headers, bullet points, and code blocks where appropriate.
   - Naturally cite sources when documents or web results are used.`;

    const chatHistory = [
        new SystemMessage(systemPrompt),
        ...messages
            .map((msg) => {
                if (msg.role === "user") return new HumanMessage(msg.content);
                if (msg.role === "ai") return new AIMessage(msg.content);
                return null;
            })
            .filter(Boolean),
    ];

    try {
        const response = await agent.invoke({ messages: chatHistory });
        const lastMsg = response.messages[response.messages.length - 1];
        const answer = typeof lastMsg?.text === "string" ? lastMsg.text : (lastMsg?.content || "");

        return { answer, sources: collectedSources };
    } catch (agentError) {
        console.error("[Agent] Failed, attempting fallback execution:", agentError.message);
        try {
            const directResponse = await llm.invoke(chatHistory);
            const answer = typeof directResponse?.text === "string" ? directResponse.text : (directResponse?.content || "");
            return { answer, sources: collectedSources };
        } catch (directError) {
            console.error("[LLM] Fallback direct invocation error:", directError.message);
            // If primary provider (Gemini) failed, execute secondary provider (Mistral AI)
            if (process.env.MISTRAL_API_KEY) {
                try {
                    console.log("[Failover] Switching to Mistral AI fallback...");
                    const fallbackMistral = new ChatMistralAI({
                        model: "mistral-small-latest",
                        apiKey: process.env.MISTRAL_API_KEY,
                        temperature: 0.2,
                    });
                    const fallbackResp = await fallbackMistral.invoke(chatHistory);
                    const answer = typeof fallbackResp?.text === "string" ? fallbackResp.text : (fallbackResp?.content || "");
                    console.log("[Failover] Mistral AI fallback response generated successfully");
                    return { answer, sources: collectedSources };
                } catch (mistralErr) {
                    console.error("[Mistral Failover Error]:", mistralErr.message);
                }
            }

            return {
                answer: "The AI service is currently experiencing high demand or rate limits. Please try again in a few seconds.",
                sources: collectedSources,
            };
        }
    }
}

/**
 * Generates a concise 2-4 word title for the conversation.
 */
export async function generateChatTitle(message) {
    if (!message || !message.trim()) return "New Search";

    try {
        const llm = getLLM();
        const response = await llm.invoke([
            new SystemMessage("Generate a concise 2-4 word chat title summarizing the user request. Output ONLY the title text, no quotes, no markdown, no punctuation."),
            new HumanMessage(`Message: "${message}"`),
        ]);

        let rawText = "";
        if (typeof response?.text === "string" && response.text.trim()) {
            rawText = response.text;
        } else if (typeof response?.content === "string") {
            rawText = response.content;
        } else if (Array.isArray(response?.content)) {
            rawText = response.content
                .map((c) => (typeof c === "string" ? c : c?.text || ""))
                .join("");
        }

        const title = rawText.replace(/["'#*`]/g, "").trim();
        if (title && title.length > 0 && title.toLowerCase() !== "new chat") {
            return title.slice(0, 50);
        }
    } catch (error) {
        console.error("[generateChatTitle] AI invocation error:", error.message);
    }

    // Smart fallback: extract 3-5 key words from the message
    const cleanMsg = message.trim().replace(/^["']|["']$/g, "").replace(/[\r\n]+/g, " ");
    const words = cleanMsg.split(/\s+/).slice(0, 5);
    const fallbackTitle = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    return fallbackTitle.length > 40 ? fallbackTitle.slice(0, 40) + "..." : fallbackTitle || "New Search";
}