import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/jwt";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const tokenUser = await getCurrentUser();
    const userId = tokenUser?.userId || "usr_student_01";

    const convs = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));

    return NextResponse.json({ conversations: convs });
  } catch (err: any) {
    console.error("GET /api/conversations error:", err);
    return NextResponse.json({ conversations: [] });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const tokenUser = await getCurrentUser();
    const userId = tokenUser?.userId || "usr_student_01";
    const { title = "New Conversation", roleContext = "student", language = "ta" } = await req.json();

    const id = "conv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    await db.insert(conversations).values({
      id,
      userId,
      title,
      roleContext,
      language,
    });

    return NextResponse.json({
      success: true,
      conversation: { id, userId, title, roleContext, language },
    });
  } catch (err: any) {
    console.error("POST /api/conversations error:", err);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
