
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { transactions } = await req.json();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a business advisor for a small Indian shopkeeper.
      Analyze the following transactions and provide insights.
      
      Transactions:
      ${JSON.stringify(transactions)}

      Return a JSON object with exactly these two keys:
      - "english_insight": A simple, actionable business insight in English (max 2 sentences).
      - "telugu_insight": The same insight translated into simple Telugu.
      
      Do not include markdown code blocks. Just the JSON string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Cleanup potential markdown formatting if Gemini adds it
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const insights = JSON.parse(cleanText);

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze data" },
      { status: 500 }
    );
  }
}
