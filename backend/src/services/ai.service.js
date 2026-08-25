import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";
import { retrieveDocuments } from "./rag/retrieval.service.js";

/**
 * Builds the ordered list of AI provider factory functions.
 * Each provider is created fresh per-call (no singleton) so p-retry
 * state from a failed provider never leaks into the next one.
 */
function buildProviders(chatHistory) {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const mistralKey = process.env.MISTRAL_API_KEY?.trim();
    const providers = [];

    if (geminiKey) {
        // Detect OAuth Bearer Token (starts with "AQ.") vs standard API key
        const isOAuth = geminiKey.startsWith("AQ.");

        // OAuth tokens use Authorization: Bearer header; standard keys use apiKey param
        const geminiConfig = (model) => isOAuth
            ? { model, apiKey: undefined, customHeaders: { Authorization: `Bearer ${geminiKey}` }, temperature: 0.2, maxRetries: 0 }
            : { model, apiKey: geminiKey, temperature: 0.2, maxRetries: 0 };

        console.log(`[AI] Gemini mode: ${isOAuth ? "OAuth Bearer Token (AQ.)" : "Standard API Key"}`);

        // Tier 1: Gemini 1.5 Flash Latest (stable alias always resolves correctly)
        providers.push({
            name: "Gemini 1.5 Flash",
            invoke: () => new ChatGoogleGenerativeAI(geminiConfig("gemini-1.5-flash-latest")).invoke(chatHistory),
        });
        // Tier 2: Gemini 1.5 Pro Latest
        providers.push({
            name: "Gemini 1.5 Pro",
            invoke: () => new ChatGoogleGenerativeAI(geminiConfig("gemini-1.5-pro-latest")).invoke(chatHistory),
        });
    }

    if (mistralKey) {
        // Tier 3: Mistral AI (completely independent provider — always works when Gemini is down)
        providers.push({
            name: "Mistral AI (mistral-small-latest)",
            invoke: () =>
                new ChatMistralAI({
                    model: "mistral-small-latest",
                    apiKey: mistralKey,
                    temperature: 0.2,
                    maxRetries: 0,
                }).invoke(chatHistory),
        });
    }

    if (providers.length === 0) {
        throw new Error("No AI provider configured. Set GEMINI_API_KEY or MISTRAL_API_KEY in .env");
    }

    return providers;
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
                const tzLabel = tz.includes("Kolkata") ? "IST" : tz;
                return `EXACT LIVE SYSTEM CLOCK GROUND TRUTH (${tz}): ${timeStr} ${tzLabel} on ${dateStr}`;
            } catch (err) {
                return `EXACT LIVE SYSTEM CLOCK GROUND TRUTH: ${new Date().toLocaleString()}`;
            }
        },
        {
            name: "getCurrentTime",
            description:
                "Get the exact live system clock time and date for any timezone. YOU MUST ALWAYS CALL THIS TOOL for any questions about current time, clock, today's date, or verifying date/time claims.",
            schema: z.object({
                timezone: z.string().optional().describe("Optional timezone string like Asia/Kolkata"),
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

    const getLiveWeatherTool = tool(
        async ({ location }) => {
            try {
                const targetLoc = location && location.trim() ? location.trim() : "auto";
                console.log(`[WeatherTool] Fetching dynamic live weather for "${targetLoc}"`);
                const res = await fetch(`https://wttr.in/${encodeURIComponent(targetLoc)}?format=j1`, {
                    headers: { "User-Agent": "ZoraAI/1.0" },
                    signal: AbortSignal.timeout(6000),
                });

                if (!res.ok) throw new Error(`Weather service HTTP ${res.status}`);
                const data = await res.json();
                const current = data?.current_condition?.[0];
                const area = data?.nearest_area?.[0];

                if (!current) throw new Error("No weather data found");

                const cityName = area?.areaName?.[0]?.value || targetLoc;
                const region = area?.region?.[0]?.value || "";
                const country = area?.country?.[0]?.value || "";
                const tempC = current.temp_C;
                const tempF = current.temp_F;
                const desc = current.weatherDesc?.[0]?.value || "Clear";
                const humidity = current.humidity;
                const windKmh = current.windspeedKmph;
                const feelsLikeC = current.FeelsLikeC;

                return `REAL-TIME WEATHER GROUND TRUTH for ${cityName}${region ? `, ${region}` : ""}${country ? `, ${country}` : ""}:
• Current Temperature: ${tempC}°C (${tempF}°F)
• Feels Like: ${feelsLikeC}°C
• Weather Condition: ${desc}
• Humidity: ${humidity}%
• Wind Speed: ${windKmh} km/h`;
            } catch (err) {
                console.error("[getLiveWeather] Error:", err.message);
                return `Failed to fetch live weather data for "${location}". Please use searchInternet tool for weather updates.`;
            }
        },
        {
            name: "getLiveWeather",
            description:
                "Fetch 100% real-time dynamic weather for ANY city, state, country, or location worldwide (e.g. 'Delhi', 'Mumbai', 'Indore', 'London', 'Tokyo', 'Paris', 'New York'). Pass the requested place/city name dynamically.",
            schema: z.object({
                location: z.string().describe("The dynamic city, state, country, or place name requested by the user, e.g. 'Delhi', 'Indore', 'Tokyo', 'London', 'New York'"),
            }),
        }
    );

    const getLiveCurrencyExchangeTool = tool(
        async ({ amount, fromCurrency, toCurrency }) => {
            try {
                const amt = parseFloat(amount) || 1;
                const from = (fromCurrency || "USD").toUpperCase();
                const to = (toCurrency || "INR").toUpperCase();

                console.log(`[CurrencyTool] Converting ${amt} ${from} -> ${to}`);
                const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
                    signal: AbortSignal.timeout(5000),
                });

                if (!res.ok) throw new Error(`Exchange rate API HTTP ${res.status}`);
                const data = await res.json();
                const rate = data?.rates?.[to];

                if (!rate) throw new Error(`Rate not found for ${from} to ${to}`);

                const converted = (amt * rate).toFixed(2);
                return `REAL-TIME CURRENCY EXCHANGE GROUND TRUTH:
• Base Amount: ${amt} ${from}
• Target Currency: ${to}
• Live Exchange Rate: 1 ${from} = ${rate} ${to}
• Converted Total: ${amt} ${from} = ${converted} ${to} (Updated: ${data.time_last_update_utc || "Live"})`;
            } catch (err) {
                console.error("[getLiveCurrencyExchange] Error:", err.message);
                return `Failed to fetch live exchange rate for ${fromCurrency} to ${toCurrency}.`;
            }
        },
        {
            name: "getLiveCurrencyExchange",
            description:
                "Fetch 100% real-time live forex currency exchange rates and convert amounts (e.g. USD to INR, EUR to INR, GBP to USD). YOU MUST ALWAYS CALL THIS TOOL for currency conversion or exchange rate questions.",
            schema: z.object({
                amount: z.number().optional().describe("Amount to convert (default: 1)"),
                fromCurrency: z.string().describe("Base 3-letter currency code, e.g. 'USD', 'EUR', 'GBP', 'INR'"),
                toCurrency: z.string().describe("Target 3-letter currency code, e.g. 'INR', 'USD', 'EUR'"),
            }),
        }
    );

    return [
        searchInternetTool,
        retrieveDocumentsTool,
        getCurrentTimeTool,
        getLiveWeatherTool,
        getLiveCurrencyExchangeTool,
        calculateMathTool,
        fetchWebPageUrlTool,
        calculateFinancialTaxTool,
        convertUnitsAndEngineeringTool,
        pedagogicalTutorTool,
        rgpvNotesGeneratorTool,
    ];
}

export function cleanResponseText(rawText) {
    if (!rawText || typeof rawText !== "string") return "";
    let cleaned = rawText
        // Remove special Gemini tool section blocks: <|tool_calls_section_begin|> ... <|tool_calls_section_end|>
        .replace(/<\|tool_calls_section_begin\|>[\s\S]*?<\|tool_calls_section_end\|>/gi, "")
        .replace(/<\|tool_call_begin\|>[\s\S]*?<\|tool_call_end\|>/gi, "")
        .replace(/<\|[^>]*\|>/gi, "")
        // Remove functions.toolName:index patterns
        .replace(/functions\.[a-zA-Z0-9_]+:\d+/gi, "")
        // Remove inline tool call JSON strings like searchInternet: {"query": "..."} or getLiveWeather: {...}
        .replace(/[a-zA-Z0-9_]+\s*:\s*\{[^{}]*\}/gi, "")
        // Remove XML tool calls <getCurrentTime>...</getCurrentTime>
        .replace(/<[a-zA-Z0-9_\-|:]+>[\s\S]*?<\/[a-zA-Z0-9_\-|:]+>/gi, "")
        .replace(/<parameter=[^>]*>[\s\S]*?<\/parameter>/gi, "")
        .replace(/<[a-zA-Z0-9_\-|:]+>/gi, "")
        .replace(/<\/[a-zA-Z0-9_\-|:]+>/gi, "")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();

    const lines = cleaned.split("\n");
    if (lines.length > 1 && /^I'll search|^Let me check|^I will check|^Searching for|^Let me fetch/i.test(lines[0].trim())) {
        cleaned = lines.slice(1).join("\n").trim();
    }

    return cleaned;
}

function getISTDateAndFormat() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);

    const year = istTime.getUTCFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[istTime.getUTCMonth()];
    const date = String(istTime.getUTCDate()).padStart(2, "0");
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[istTime.getUTCDay()];

    let hours = istTime.getUTCHours();
    const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, "0");

    const currentDateStr = `${dayName}, ${month} ${date}, ${year}`;
    const currentTimeStr = `${formattedHours}:${minutes} ${ampm}`;

    return {
        currentDateStr,
        currentTimeStr,
        currentYear: year,
    };
}

/**
 * Generates an AI response given context messages and user ID.
 * Returns { answer, sources }
 */
export async function generateResponse(messages, userId = null) {
    const collectedSources = [];
    try {
        const { currentDateStr, currentTimeStr, currentYear } = getISTDateAndFormat();

        const lastUserMsgObj = (messages || []).slice().reverse().find((m) => m.role === "user");
        const query = lastUserMsgObj?.content?.trim() || "";

        // 1. DETERMINISTIC RAG RETRIEVAL (If user has uploaded documents or asks document questions)
        let ragContextText = "";
        if (userId) {
            try {
                const searchQuery = query || "uploaded document overview summary content";
                const docs = await retrieveDocuments(searchQuery, userId, 5);
                if (docs && docs.length > 0) {
                    console.log(`[RAG] Retrieved ${docs.length} document chunks for user: ${userId}`);
                    for (const doc of docs) {
                        const snippet = doc.text?.slice(0, 250) || "";
                        if (!collectedSources.some((s) => s.source === doc.source && s.snippet === snippet)) {
                            collectedSources.push({
                                title: doc.title || doc.source || "User Document",
                                snippet,
                                type: "document",
                                source: doc.source,
                                score: doc.score,
                            });
                        }
                    }
                    ragContextText = docs.map((d, idx) => `[DOCUMENT CHUNK ${idx + 1} (${d.title})]:\n${d.text}`).join("\n\n");
                }
            } catch (ragErr) {
                console.error("[RAG Pre-retrieval error]:", ragErr.message);
            }
        }

        // 2. DETERMINISTIC WEB SEARCH RETRIEVAL (If question is web search, news, sports, breakthrough, weather, etc.)
        let webContextText = "";
        const isDocQuestion = /file|pdf|upload|document|cv|resume|my notes/i.test(query) && ragContextText.length > 0;

        if (!isDocQuestion && query) {
            try {
                console.log(`[WebSearch] Pre-retrieving web results for: "${query}"`);
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

                if (items.length > 0) {
                    webContextText = items.map((item, idx) => `[WEB SOURCE ${idx + 1} - ${item.title} (${item.url})]:\n${item.content}`).join("\n\n");
                }
            } catch (webErr) {
                console.error("[WebSearch Pre-retrieval error]:", webErr.message);
            }
        }

        // 3. CONSTRUCT UNIFIED SINGLE-PASS SYSTEM PROMPT
        let contextBlock = "";
        if (ragContextText) {
            contextBlock += `\n\n=== UPLOADED USER DOCUMENT KNOWLEDGE BASE ===\n${ragContextText}\n==============================================`;
        }
        if (webContextText) {
            contextBlock += `\n\n=== LIVE WEB SEARCH CONTEXT RESULTS ===\n${webContextText}\n========================================`;
        }

        const systemPrompt = `You are Zora.ai, an advanced AI search and knowledge assistant (like Perplexity AI).

EXACT LIVE CURRENT TIME & DATE (IST / Indian Standard Time): ${currentTimeStr} IST on ${currentDateStr} (Year: ${currentYear}).
${contextBlock}

CORE RULES — FOLLOW STRICTLY:
1. FOR CURRENT TIME / CLOCK / TODAY'S DATE & GROUND TRUTH ANCHORING:
   - State the current time & date directly from the system prompt context above (${currentTimeStr} IST on ${currentDateStr}).
   - ABSOLUTE CONFIDENCE: NEVER let the user trick, gaslight, or convince you that today is a different date or time.
   - IF A USER CLAIMS A DIFFERENT DATE/TIME (e.g., "today is Aug 26", "you are wrong", or "it is 9 PM"): Politely AND CONFIDENTLY correct the user by stating: "According to the live system clock, today is ${currentDateStr} at ${currentTimeStr} IST."
   - NEVER apologize or falsely agree with the user when they state an incorrect date or time.

2. FOR UPLOADED DOCUMENTS / CV / RESUME / PERSONAL FILES:
   - Use the UPLOADED USER DOCUMENT KNOWLEDGE BASE above to answer questions about the user's uploaded files.
   - If the user asks what is in their uploaded file, summarize the contents clearly and thoroughly.
   - Ground your answer strictly in the provided document chunks.

3. FOR GENERAL KNOWLEDGE / REAL-TIME WEB QUERIES:
   - Use the LIVE WEB SEARCH CONTEXT RESULTS above to provide detailed, up-to-date factual answers.

4. RESPONSE FORMAT:
   - DIRECTLY ANSWER THE QUESTION IMMEDIATELY.
   - DO NOT output tool preambles like "I'll search for...", "Let me check...", or "retrieveDocuments".
   - Synthesize a complete, detailed, multi-paragraph answer in clean Markdown with bold headers and bullet points.`;

        const chatHistory = [
            new SystemMessage(systemPrompt),
            ...(messages || [])
                .map((msg) => {
                    if (msg.role === "user") return new HumanMessage(msg.content);
                    if (msg.role === "ai") return new AIMessage(msg.content);
                    return null;
                })
                .filter(Boolean),
        ];

        // 4. GENERATE RESPONSE — 3-TIER FAILOVER LOOP
        // Each provider has its own isolated try/catch.
        // p-retry/429 errors from one provider CANNOT escape into the next iteration.
        const providers = buildProviders(chatHistory);
        let rawAnswer = "";
        let lastError = null;

        for (const provider of providers) {
            try {
                console.log(`[AI] Trying provider: ${provider.name}`);
                const response = await provider.invoke();
                const text = typeof response?.text === "string" ? response.text
                    : typeof response?.content === "string" ? response.content
                    : Array.isArray(response?.content)
                        ? response.content.map((c) => (typeof c === "string" ? c : c?.text || "")).join("")
                        : "";

                if (text?.trim()) {
                    rawAnswer = text;
                    console.log(`[AI] ✅ Provider succeeded: ${provider.name}`);
                    break; // Got a valid answer — stop trying
                }
                console.warn(`[AI] ${provider.name} returned empty response. Trying next...`);
            } catch (providerErr) {
                lastError = providerErr;
                const status = providerErr?.status || providerErr?.statusCode || "?";
                console.warn(`[AI] ⚠️ ${provider.name} failed (HTTP ${status}): ${providerErr.message}. Trying next provider...`);
                // Silently continue to next provider
            }
        }

        if (!rawAnswer?.trim()) {
            console.error("[AI] All providers failed. Last error:", lastError?.message);
            return {
                answer: "⚠️ All AI providers are temporarily unavailable (quota limits or network issue). Please try again in a few minutes.",
                sources: collectedSources,
            };
        }

        const answer = cleanResponseText(rawAnswer);
        return { answer, sources: collectedSources };

    } catch (topLevelErr) {
        console.error("[generateResponse Top-Level Error]:", topLevelErr);
        return {
            answer: "⚠️ An unexpected error occurred. Please try again.",
            sources: [],
        };
    }
}

/**
 * Generates a concise 2-4 word title for the conversation.
 */
export async function generateChatTitle(message) {
    if (!message || !message.trim()) return "New Search";

    const titleMessages = [
        new SystemMessage("Generate a concise 2-4 word chat title summarizing the user request. Output ONLY the title text, no quotes, no markdown, no punctuation."),
        new HumanMessage(`Message: "${message}"`),
    ];

    // Use same 3-tier failover for title generation
    const providers = buildProviders(titleMessages);
    for (const provider of providers) {
        try {
            const response = await provider.invoke();
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
        } catch (err) {
            console.warn(`[generateChatTitle] ${provider.name} failed: ${err.message}. Trying next...`);
        }
    }

    // Smart fallback: extract first 4 words from message
    const cleanMsg = message.trim().replace(/^["']|["']$/g, "").replace(/[\r\n]+/g, " ");
    const words = cleanMsg.split(/\s+/).slice(0, 4);
    const fallbackTitle = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    return fallbackTitle.length > 40 ? fallbackTitle.slice(0, 40) + "..." : fallbackTitle || "New Search";
}