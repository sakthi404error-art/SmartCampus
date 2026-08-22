import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Updated to the exact model version requested by the API
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      systemInstruction: "You are Nexus, the official AI assistant for ISSM Business School students. You help MBA students with queries regarding ERP, academic policies, attendance (75% minimum), and general campus information. Keep your answers concise, professional, and directly helpful."
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Nexus AI." },
      { status: 500 }
    );
  }
}