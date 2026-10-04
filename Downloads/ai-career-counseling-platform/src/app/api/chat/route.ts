import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages, users, profiles, studentProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/jwt";
import { ensureDbInitialized } from "@/db/init";
import {
  analyzeDistress,
  extractStructuredProfile,
  generateAIResponse,
} from "@/lib/ai/provider";
import { performVerifiedRetrieval, logRAGAudit } from "@/lib/rag/engine";
import { createCounselorCase } from "@/lib/counselor/escalation";

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const tokenUser = await getCurrentUser();
    const body = await req.json();

    const {
      conversationId: inputConvId,
      message: userMsgContent,
      language: inputLang = "ta",
      roleContext = "student",
    } = body;

    if (!userMsgContent || !userMsgContent.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const userId = tokenUser?.userId || "usr_student_01"; // Fallback to demo student for frictionless chat

    // 1. Get or Create Conversation
    let conversationId = inputConvId;
    if (!conversationId) {
      conversationId = "conv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      const titleSnippet = userMsgContent.slice(0, 30) + "...";
      await db.insert(conversations).values({
        id: conversationId,
        userId,
        title: titleSnippet,
        roleContext,
        language: inputLang,
      });
    } else {
      // update conversation timestamp
      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    // 2. Fetch User Profile
    const userProfs = await db.select().from(profiles).where(eq(profiles.userId, userId));
    const uProf = userProfs[0];

    // 3. Extract Structured Profile Data
    const extractedData = extractStructuredProfile(userMsgContent);
    let updatedProfileFields: any = {};

    if (uProf) {
      if (extractedData.age && !uProf.age) updatedProfileFields.age = extractedData.age;
      if (extractedData.district) updatedProfileFields.district = extractedData.district;
      if (extractedData.education) updatedProfileFields.educationLevel = extractedData.education;
      if (extractedData.budget) updatedProfileFields.budgetLevel = extractedData.budget;

      if (Object.keys(updatedProfileFields).length > 0) {
        await db.update(profiles)
          .set(updatedProfileFields)
          .where(eq(profiles.userId, userId));
      }
    }

    // 4. Emotional Distress Detection
    const distressAnalysis = analyzeDistress(userMsgContent);

    // 5. Store User Message
    const userMsgId = "msg_" + Date.now() + "_usr";
    await db.insert(messages).values({
      id: userMsgId,
      conversationId,
      sender: "user",
      content: userMsgContent,
      detectedEmotion: distressAnalysis.emotion,
    });

    // 6. RAG Retrieval
    const retrievalResults = await performVerifiedRetrieval(userMsgContent, {
      district: uProf?.district || "Vellore",
      state: uProf?.state || "Tamil Nadu",
      education: uProf?.educationLevel || "12th Completed",
    });

    // 7. Grounded AI Response Generation
    const aiResult = await generateAIResponse({
      userMessage: userMsgContent,
      language: inputLang,
      userProfile: {
        district: uProf?.district || "Vellore",
        state: uProf?.state || "Tamil Nadu",
        educationLevel: uProf?.educationLevel || "12th Completed",
        role: roleContext,
      },
      retrievedContext: retrievalResults,
    });

    // 8. Auto Counselor Escalation if HIGH CONCERN or URGENT
    let escalationCaseId: string | null = null;
    if (distressAnalysis.emotion === "HIGH CONCERN" || distressAnalysis.emotion === "URGENT") {
      escalationCaseId = await createCounselorCase({
        userId,
        conversationId,
        priority: distressAnalysis.emotion === "URGENT" ? "URGENT" : "HIGH",
        reason: distressAnalysis.reason || "High emotional distress detected in conversation",
        conversationSummary: `User expressed: "${userMsgContent}"`,
        detectedConcern: `Emotion level: ${distressAnalysis.emotion}`,
      });
    }

    // 9. Store AI Assistant Message
    const aiMsgId = "msg_" + Date.now() + "_ast";
    await db.insert(messages).values({
      id: aiMsgId,
      conversationId,
      sender: "assistant",
      content: aiResult.content,
      evidenceCitations: aiResult.citations as any,
      claimValidationStatus: aiResult.claimValidationStatus,
      metadata: {
        ...aiResult.metadata,
        escalatedCaseId: escalationCaseId,
        distressEmotion: distressAnalysis.emotion,
      },
    });

    // 10. Audit Logging
    await logRAGAudit(
      userId,
      userMsgContent,
      retrievalResults.chunks,
      aiResult.content,
      aiResult.citations,
      aiResult.claimValidationStatus === "FALLBACK" ? "FALLBACK_TRIGGERED" : "PASSED",
      aiResult.claimValidationStatus === "FALLBACK"
    );

    return NextResponse.json({
      success: true,
      conversationId,
      message: {
        id: aiMsgId,
        sender: "assistant",
        content: aiResult.content,
        evidenceCitations: aiResult.citations,
        claimValidationStatus: aiResult.claimValidationStatus,
        detectedEmotion: distressAnalysis.emotion,
        escalatedCaseId: escalationCaseId,
        metadata: aiResult.metadata,
      },
      extractedProfileData: extractedData,
      distressAnalysis,
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Something went wrong while processing your request. Please try again." },
      { status: 500 }
    );
  }
}
