
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { messages, transactions } = await req.json();

    if (!messages) {
      return NextResponse.json(
        { error: "No messages provided" },
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

    // Construct the context based on transactions
    // In a real app, you might want to summarize this if it's too large, 
    // or use RAG (Retrieval Augmented Generation).
    // For specific small business queries, pushing the raw JSON (formatted) is often enough for small datasets.
    
    const transactionContext = transactions && transactions.length > 0 
        ? JSON.stringify(transactions) 
        : "No transaction data available yet.";

    const systemPrompt = `
      You are 'Lekka', a smart AI business assistant for a small Indian shopkeeper.
      
      Here is the shop's recent transaction data:
      ${transactionContext}

      Instructions:
      1. Answer questions about sales, expenses, and profits based on this data.
      2. If the user asks something not in the data, explain politely.
      3. Keep answers concise, simple, and friendly (like a manager talking to the owner).
      4. If helpful, mention specific numbers or dates.
      5. Support Hinglish/Telugu if the user asks, but default to English.
    `;

    // Convert messages to Gemini format (user/model)
    // History usually doesn't include the huge system prompt every time in the 'contents' array if using chatSession,
    // but for simple stateless REST, we often prepend it.
    // Let's use startChat if we want history, but here we rebuild history for the API call.
    
    const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    // Start a chat session
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: `System Context: ${systemPrompt}` }],
            },
            {
                role: "model",
                parts: [{ text: "Understood. I am Lekka, ready to help with the business data." }],
            },
            ...chatHistory.slice(0, -1) // All previous messages
        ],
    });

    const lastMessage = chatHistory[chatHistory.length - 1].parts[0].text;
    
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return NextResponse.json({ role: 'assistant', content: responseText });

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
