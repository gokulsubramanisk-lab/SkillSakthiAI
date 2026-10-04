import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, getSession } from "@/lib/auth";
import { ensureSeeded } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const session = await getSession();
  const profiles = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      language: users.language,
      districtCode: users.districtCode,
    })
    .from(users);
  return Response.json({ session, profiles });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as { userId?: number };
  if (!body.userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }
  const session = await createSession(body.userId);
  if (!session) return Response.json({ error: "Unknown profile" }, { status: 404 });
  return Response.json({ session });
}
