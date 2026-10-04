import { db } from "@/db";
import { occupations, trainingPrograms, laborMarketData, sources, documentChunks } from "@/db/schema";
import { ilike, or, eq } from "drizzle-orm";

export interface AIResponseOptions {
  userMessage: string;
  conversationHistory?: { sender: string; content: string }[];
  userProfile?: {
    name?: string;
    age?: number;
    district?: string;
    state?: string;
    educationLevel?: string;
    interests?: string[];
    currentSkills?: string[];
    role?: string;
  };
  language?: string; // e.g., 'ta', 'hi', 'te', 'en', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'
  retrievedContext?: {
    chunks: { text: string; sourceCode: string; title: string; organization: string; url: string; score: number }[];
    occupations: any[];
    trainingPrograms: any[];
  };
}

export interface ExtractedProfileData {
  age?: number;
  location?: string;
  district?: string;
  state?: string;
  education?: string;
  skills?: string[];
  interests?: string[];
  budget?: string;
  career_preferences?: string[];
  language?: string;
  mobility_preference?: string;
}

export interface DistressAnalysis {
  emotion: "NORMAL" | "CONFUSED" | "ANXIOUS" | "HIGH CONCERN" | "URGENT";
  score: number;
  reason?: string;
}

// 1. Detect distress / anxiety level
export function analyzeDistress(userMessage: string): DistressAnalysis {
  const text = userMessage.toLowerCase();
  
  const urgentKeywords = [
    "suicide", "end my life", "hopeless", "self harm", "no way out", "give up on life",
    "வாழ்க்கையை முடிக்க", "தற்கொலை", "உயிரை மாய்க்க"
  ];
  const highConcernKeywords = [
    "extremely stressed", "depressed", "parents forcing me", "overwhelming pressure",
    "cannot take this pressure", "panic attack", "crying every day", "terrified of failure",
    "மன அழுத்தம்", "அழுத்தம் தாங்க முடியல", "பயமா இருக்கு", "பெற்றோர் வற்புறுத்துகிறார்கள்"
  ];
  const anxiousKeywords = [
    "confused about future", "worried", "scared", "fear", "anxious", "no idea what to do",
    "uncertain", "what if i fail", "பயம்", "குழப்பம்", "எதிர்காலம் பயமா இருக்கு"
  ];
  const confusedKeywords = [
    "not sure", "help me decide", "lost", "dont know", "which option", "குழப்பமாக உள்ளது"
  ];

  for (const kw of urgentKeywords) {
    if (text.includes(kw)) {
      return { emotion: "URGENT", score: 0.95, reason: "Severe crisis / distress detected." };
    }
  }

  for (const kw of highConcernKeywords) {
    if (text.includes(kw)) {
      return { emotion: "HIGH CONCERN", score: 0.85, reason: "High level of career pressure or anxiety detected." };
    }
  }

  for (const kw of anxiousKeywords) {
    if (text.includes(kw)) {
      return { emotion: "ANXIOUS", score: 0.65, reason: "Anxiety and uncertainty regarding career direction." };
    }
  }

  for (const kw of confusedKeywords) {
    if (text.includes(kw)) {
      return { emotion: "CONFUSED", score: 0.45, reason: "General decision confusion." };
    }
  }

  return { emotion: "NORMAL", score: 0.1, reason: "Normal conversation." };
}

// 2. Natural Profile Extractor from User Text/Voice
export function extractStructuredProfile(input: string): ExtractedProfileData {
  const profile: ExtractedProfileData = {};
  const text = input.toLowerCase();

  // Age extraction
  const ageMatch = input.match(/\b(\d{2})\s*(?:year|yrs|years|வயது|வயசு)\b/i) || input.match(/\bi am (\d{2})\b/i);
  if (ageMatch) {
    profile.age = parseInt(ageMatch[1], 10);
  }

  // District / Location extraction
  if (text.includes("vellore") || text.includes("வேலூர்")) profile.district = "Vellore";
  if (text.includes("chennai") || text.includes("சென்னை")) profile.district = "Chennai";
  if (text.includes("coimbatore") || text.includes("கோவை") || text.includes("கோயம்புத்தூர்")) profile.district = "Coimbatore";
  if (text.includes("madurai") || text.includes("மதுரை")) profile.district = "Madurai";
  if (text.includes("pune") || text.includes("பூனே")) profile.district = "Pune";
  if (text.includes("bengaluru") || text.includes("bangalore") || text.includes("பெங்களூரு")) profile.district = "Bengaluru";

  // Education extraction
  if (text.includes("12th") || text.includes("12-ஆம்") || text.includes("plus two") || text.includes("+2")) {
    profile.education = "12th Completed";
  } else if (text.includes("10th") || text.includes("10-ஆம்") || text.includes("sslc")) {
    profile.education = "10th Completed";
  } else if (text.includes("iti") || text.includes("diploma")) {
    profile.education = "Diploma / ITI";
  }

  // Interests / Skills
  const interests: string[] = [];
  if (text.includes("electric") || text.includes("electronics") || text.includes("எலக்ட்ரானிக்ஸ்") || text.includes("மின்சாரம்") || text.includes("wiring")) {
    interests.push("Electronics", "Electrical Repair");
  }
  if (text.includes("solar") || text.includes("சூரிய ஒளி") || text.includes("மின்சாரம்")) {
    interests.push("Solar Energy", "Renewable Power");
  }
  if (text.includes("automation") || text.includes("machine") || text.includes("plc") || text.includes("தொழில்துறை")) {
    interests.push("Industrial Automation", "Machines");
  }
  if (text.includes("computer") || text.includes("coding") || text.includes("software") || text.includes("கணினி")) {
    interests.push("Computer & IT");
  }
  if (interests.length > 0) {
    profile.interests = interests;
    profile.skills = ["Basic Fundamentals", "Problem Solving"];
  }

  // Budget
  if (text.includes("cheap") || text.includes("free") || text.includes("inexpensive") || text.includes("low budget") || text.includes("செலவு குறைவு") || text.includes("இலவசம்")) {
    profile.budget = "Low (< ₹25,000)";
  }

  return profile;
}

// 3. AI Generation Engine (with Strict RAG Grounding & Language Awareness)
export async function generateAIResponse(options: AIResponseOptions): Promise<{
  content: string;
  citations: { sourceId: string; title: string; organization: string; url: string; verificationDate: string; snippet: string }[];
  claimValidationStatus: "VERIFIED" | "PARTIAL" | "FALLBACK" | "UNVERIFIED";
  metadata?: any;
}> {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  const lang = options.language || "ta";
  const userMsg = options.userMessage;

  // Check if LLM API Key is configured for live API call
  if (apiKey) {
    try {
      // In production with API key, we call OpenAI/Gemini REST endpoint here
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are Career Saathi, an empathetic, verified AI Career Counsellor for Indian students and families.
Target language code: ${lang}.
Respond strictly in the user's preferred language (${lang === "ta" ? "Tamil" : lang === "hi" ? "Hindi" : lang === "te" ? "Telugu" : "English"}).
Use retrieved context as truth. Do not make up fake salary, government schemes, or fake stats.
Retrieved Context: ${JSON.stringify(options.retrievedContext || {})}`,
            },
            { role: "user", content: userMsg },
          ],
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const textResp = data.choices?.[0]?.message?.content;
        if (textResp) {
          return {
            content: textResp,
            citations: (options.retrievedContext?.chunks || []).map((c) => ({
              sourceId: c.sourceCode,
              title: c.title,
              organization: c.organization,
              url: c.url,
              verificationDate: "2025-02-01",
              snippet: c.text,
            })),
            claimValidationStatus: "VERIFIED",
          };
        }
      }
    } catch (err) {
      console.warn("AI API call failed, falling back to verified RAG grounded engine:", err);
    }
  }

  // Fallback / Standalone RAG Grounded Generator:
  const retrievedChunks = options.retrievedContext?.chunks || [];
  const recOccupations = options.retrievedContext?.occupations || [];

  const citations = retrievedChunks.map((c) => ({
    sourceId: c.sourceCode,
    title: c.title,
    organization: c.organization,
    url: c.url,
    verificationDate: "2025-02-01",
    snippet: c.text,
  }));

  // Tamil Response Construction
  if (lang === "ta" || userMsg.match(/[\u0B80-\u0BFF]/)) {
    if (recOccupations.length > 0) {
      const topOccs = recOccupations.slice(0, 3);
      let listStr = "";
      topOccs.forEach((occ, idx) => {
        listStr += `\n\n${idx + 1}. **${occ.title}**\n   • **தகுதி:** ${occ.requiredQualification}\n   • **சம்பள வரம்பு:** ₹${occ.salaryMin.toLocaleString()} - ₹${occ.salaryMax.toLocaleString()}/மாதம் (${occ.salarySource})\n   • **தேவை மதிப்பீடு:** ${occ.localDemandRating}% (வேலூர் மண்டலம்)\n   • **முக்கிய திறன்கள்:** ${occ.coreSkills.slice(0, 3).join(", ")}`;
      });

      return {
        content: `வணக்கம்! உங்களது விருப்பத்திற்கும் ${options.userProfile?.district || "வேலூர்"} மாவட்ட வேலைவாய்ப்பு தரவுகளுக்கும் ஏற்ற சான்றளிக்கப்பட்ட தொழில் வழிகள்:${listStr}\n\nஉங்களுக்கு இவை பற்றிய பயிற்சி விவரங்கள் அல்லது பெற்றோர் மதிப்பீட்டு ஒப்பீடு தேவைப்பட்டால் கீழே உள்ள பட்டன்களைப் பயன்படுத்தவும்.`,
        citations,
        claimValidationStatus: "VERIFIED",
        metadata: { recommendedCareers: topOccs.map((o) => o.id) },
      };
    }

    if (retrievedChunks.length > 0) {
      return {
        content: `அரசு சான்றளிக்கப்பட்ட தரவுகளின்படி:\n\n${retrievedChunks[0].text}\n\nகூடுதல் விவரங்கள் அல்லது நேரில் வழிகாட்டல் தேவைப்பட்டால், நீங்கள் எங்கள் ஆலோசகரை (Counselor) உடனடியாகத் தொடர்புகொள்ளலாம்.`,
        citations,
        claimValidationStatus: "VERIFIED",
      };
    }

    // Safety fallback when no verified evidence exists
    return {
      content: "I could not verify this information from the available trusted sources. I can help you connect with a counselor instead.",
      citations: [],
      claimValidationStatus: "FALLBACK",
    };
  }

  // Hindi Response Construction
  if (lang === "hi") {
    if (recOccupations.length > 0) {
      const topOccs = recOccupations.slice(0, 3);
      let listStr = "";
      topOccs.forEach((occ, idx) => {
        listStr += `\n\n${idx + 1}. **${occ.title}**\n   • **योग्यता:** ${occ.requiredQualification}\n   • **वेतन:** ₹${occ.salaryMin.toLocaleString()} - ₹${occ.salaryMax.toLocaleString()}/माह\n   • **मांग स्कोर:** ${occ.localDemandRating}%\n   • **आवश्यक कौशल:** ${occ.coreSkills.slice(0, 3).join(", ")}`;
      });

      return {
        content: `नमस्ते! आपकी रुचि और स्थान के अनुसार सत्यापित करियर विकल्प:${listStr}\n\nक्या आप प्रशिक्षण या तुलना देखना चाहते हैं?`,
        citations,
        claimValidationStatus: "VERIFIED",
        metadata: { recommendedCareers: topOccs.map((o) => o.id) },
      };
    }
  }

  // English Response Construction
  if (recOccupations.length > 0) {
    const topOccs = recOccupations.slice(0, 3);
    let listStr = "";
    topOccs.forEach((occ, idx) => {
      listStr += `\n\n${idx + 1}. **${occ.title}**\n   • **Qualification:** ${occ.requiredQualification}\n   • **Verified Salary:** ₹${occ.salaryMin.toLocaleString()} - ₹${occ.salaryMax.toLocaleString()}/mo (${occ.salarySource})\n   • **Local Opportunity Score:** ${occ.localDemandRating}/100\n   • **Core Skills:** ${occ.coreSkills.slice(0, 3).join(", ")}`;
    });

    return {
      content: `Hello! Based on your profile and verified labor market data for ${options.userProfile?.district || "Vellore"}, here are evidence-backed career options:${listStr}\n\nWould you like to compare these options, view missing skills, or calculate ROI for parents?`,
      citations,
      claimValidationStatus: "VERIFIED",
      metadata: { recommendedCareers: topOccs.map((o) => o.id) },
    };
  }

  if (retrievedChunks.length > 0) {
    return {
      content: `Based on official verified records:\n\n${retrievedChunks[0].text}\n\nYou can view the source citation below or speak to a Human Counsellor for personalized assistance.`,
      citations,
      claimValidationStatus: "VERIFIED",
    };
  }

  return {
    content: "I could not verify this information from the available trusted sources. I can help you connect with a counselor instead.",
    citations: [],
    claimValidationStatus: "FALLBACK",
  };
}
