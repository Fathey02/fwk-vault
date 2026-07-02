import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY environment variable is not set. AI features will fail.");
    }
    // Initialize Google Gen AI client
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

// ----------------- API ENDPOINTS -----------------

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Customer Assistant & Inquiries Agent
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const ai = getAiClient();
    
    // Create system instruction for the CS Library Assistant
    const systemInstruction = `
    You are the Arabic-English Bilingual Smart Assistant for the Computer Science and Information College Library (مكتبة كلية علوم الحاسب والمعلومات).
    Your name is "مساعد المكتبة الذكي" (Smart Library Assistant).
    You help students, faculty, and visitors with:
    - Information about library guidelines and policies (e.g., lending limits, quiet zones, hours: 8 AM to 8 PM).
    - College guidelines, computer science curricula, and project completions.
    - Advising on e-commerce, investment, trading, and business books to start generating income alongside college.
    - Research, scientific theses, and student graduation projects.
    - Assisting users with general library navigation, seat bookings, and equipment queries.
    
    Respond in a professional, warm, and highly helpful manner.
    Always reply in the language the user is speaking (Arabic or English), prioritizing Arabic as the college language if mixed. Keep answers clear, structured with bullet points if necessary, and accurate.
    `;

    // Construct contents from history and current message
    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// AI Smart Search Engine for Library Items
app.post("/api/ai/search", async (req, res) => {
  try {
    const { query, items } = req.body;
    
    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    const ai = getAiClient();
    
    // System instruction for the Search Engine
    const systemInstruction = `
    You are an AI Search Engine for the College of Computer Science and Information Library.
    The user is searching for something in the library (books, graduation projects, theses, achievements).
    You will receive the user's search query along with a JSON array of the available library items (items).
    Your task is to:
    1. Filter and identify the top relevant items (up to 5-10) that match the search query, either directly or semantically (conceptually).
    2. Write a helpful summary in Arabic explaining why these items are relevant, answering the user's question, and suggesting related topics.
    3. Return a JSON response with:
       - "summary": The elegant Arabic explanation.
       - "relevantIds": An array of the IDs of the matching items so the frontend can highlight or filter them.
    
    Format your response STRICTLY as a valid JSON object. Do not include markdown code block syntax (like \`\`\`json) in your actual response text if possible, but if you do, ensure we can parse it. Simply output a JSON object of this structure:
    {
      "summary": "...",
      "relevantIds": ["id1", "id2"]
    }
    `;

    const prompt = `
    User Query: "${query}"
    
    Available Library Items (JSON):
    ${JSON.stringify(items, null, 2)}
    
    Analyze the query and items. Perform semantic search. Output only the JSON response.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    let resultText = response.text || "{}";
    
    // Parse result text cleanly
    try {
      const parsed = JSON.parse(resultText);
      res.json(parsed);
    } catch (parseError) {
      // Fallback clean-up if markdown block was returned
      const cleanJson = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    }
  } catch (error: any) {
    console.error("Gemini Search Error:", error);
    res.status(500).json({ error: error.message || "Failed to perform AI search" });
  }
});

// ----------------- VITE MIDDLEWARE SETUP -----------------

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Error setting up server:", err);
});
