import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { db } from "@/db";
import { users, profiles, studentProfiles, parentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ user: null });
    }

    const found = await db.select().from(users).where(eq(users.id, tokenUser.userId));
    if (found.length === 0) {
      return NextResponse.json({ user: null });
    }

    const u = found[0];
    const userProfiles = await db.select().from(profiles).where(eq(profiles.userId, u.id));
    const profile = userProfiles[0] || null;

    let subProfile = null;
    if (u.role === "student") {
      const sp = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, u.id));
      subProfile = sp[0] || null;
    } else if (u.role === "parent") {
      const pp = await db.select().from(parentProfiles).where(eq(parentProfiles.userId, u.id));
      subProfile = pp[0] || null;
    }

    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        language: u.language,
        profile,
        subProfile,
      },
    });
  } catch (err: any) {
    console.error("Auth me error:", err);
    return NextResponse.json({ user: null });
  }
}
