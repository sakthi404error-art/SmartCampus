import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { GEMINI_MODEL_FALLBACKS, buildCampusPrompt, resolveGeminiModel } from "@/lib/geminiConfig";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const prompt = buildCampusPrompt(message);
    const candidates = [resolveGeminiModel("gemini-2.0-flash"), ...GEMINI_MODEL_FALLBACKS.filter((model) => model !== resolveGeminiModel("gemini-2.0-flash"))];

    let finalText = "";
    let lastError: unknown = null;

    for (const modelName of candidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: "You are Nexus AI, the official smart campus assistant for MBA students. Provide concise, practical, and accurate responses about attendance, leave policies, studies, project deadlines, placements, and campus systems."
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        finalText = response.text();

        if (finalText && finalText.trim()) {
          return NextResponse.json({ reply: finalText.trim() });
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return NextResponse.json({
      reply: "I’m here to help with attendance, placements, projects, and campus queries. Please ask again in a clearer, shorter way."
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Nexus AI is temporarily unavailable. Please try again in a moment." },
      { status: 500 }
    );
  }
}