import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const language = (formData.get("language") as string) || "ta";
    const simulatedText = (formData.get("simulatedText") as string) || "";

    // If client supplied a simulated voice text or standard recording
    let text = simulatedText;
    if (!text) {
      if (language === "ta") {
        text = "எனக்கு electronics பிடிக்கும். என் district-ல என்ன career நல்லா இருக்கும்?";
      } else if (language === "hi") {
        text = "मुझे इलेक्ट्रिक्स पसंद है। मेरे जिले में कौन सा करियर अच्छा रहेगा?";
      } else {
        text = "I am interested in electronics and electrical repair. What careers are good in my district?";
      }
    }

    return NextResponse.json({
      success: true,
      text,
      detectedLanguage: language,
      confidence: 0.96,
    });
  } catch (err: any) {
    console.error("Transcribe API error:", err);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
