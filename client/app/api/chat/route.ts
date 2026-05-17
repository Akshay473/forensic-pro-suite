import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return NextResponse.json({ error: "No API Keys configured (Gemini or Groq)" }, { status: 500 });
    }

    const latestMessage = messages[messages.length - 1].content;
    const systemPrompt = `You are an intelligent AI assistant built into the Forensic Pro Suite application. 
      Your purpose is to provide contextual, real-time guidance to users. 
      Help them understand features, guide navigation, clarify processes, and resolve any doubts.
      Keep responses concise, helpful, and professional.`;

    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        interface ChatMessage { role: string; content: string; }
        let formattedHistory = messages.slice(0, -1).map((msg: ChatMessage) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));
        
        // Gemini requires the first message in history to be from 'user'
        if (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
          formattedHistory = formattedHistory.slice(1);
        }
        
        const chat = model.startChat({
          history: formattedHistory,
          generationConfig: {
            maxOutputTokens: 1000,
          },
        });

        const result = await chat.sendMessage(`${systemPrompt}\n\nUser message: ${latestMessage}`);
        const responseText = result.response.text();

        return NextResponse.json({ response: responseText, provider: "gemini" });
      } catch (geminiError: unknown) {
        console.warn("Gemini API failed, falling back to Groq if available:", geminiError instanceof Error ? geminiError.message : geminiError);
        // Fallback to Groq if available
        if (!groqKey) {
          throw geminiError;
        }
      }
    }

    // Groq Fallback
    if (groqKey) {
      const groqMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role === "model" ? "assistant" : msg.role,
          content: msg.content
        }))
      ];

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Supported Groq model
          messages: groqMessages,
          max_tokens: 1000,
        })
      });

      if (!groqResponse.ok) {
        throw new Error(`Groq API returned ${groqResponse.status}: ${await groqResponse.text()}`);
      }

      const groqData = await groqResponse.json();
      const responseText = groqData.choices[0].message.content;
      
      return NextResponse.json({ response: responseText, provider: "groq" });
    }
  } catch (error) {
    console.error("AI Assistant API Error:", error);
    return NextResponse.json(
      { error: "Failed to process the request" },
      { status: 500 }
    );
  }
}
