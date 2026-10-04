import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, language = "ta" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required for TTS" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      audioUrl: null, // Instructs browser client to use Web Speech API Synthesis for natural locale playback
      language,
      status: "READY",
    });
  } catch (err: any) {
    console.error("Synthesize API error:", err);
    return NextResponse.json({ error: "Speech synthesis failed" }, { status: 500 });
  }
}
