import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;

    const conv = await db.select().from(conversations).where(eq(conversations.id, id));
    if (conv.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      conversation: conv[0],
      messages: msgs,
    });
  } catch (err: any) {
    console.error("GET /api/conversations/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await db.update(conversations).set({ title }).where(eq(conversations.id, id));

    return NextResponse.json({ success: true, title });
  } catch (err: any) {
    console.error("PATCH /api/conversations/[id] error:", err);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;

    await db.delete(conversations).where(eq(conversations.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/conversations/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
