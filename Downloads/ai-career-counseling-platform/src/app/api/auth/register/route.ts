import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, profiles, studentProfiles, parentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth/jwt";
import { ensureDbInitialized } from "@/db/init";

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const { email, password, name, role = "student", language = "ta" } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      name,
      role,
      language,
    });

    await db.insert(profiles).values({
      id: "prof_" + userId,
      userId,
      preferredLanguage: language,
    });

    if (role === "student") {
      await db.insert(studentProfiles).values({
        id: "sprof_" + userId,
        userId,
      });
    } else if (role === "parent") {
      await db.insert(parentProfiles).values({
        id: "pprof_" + userId,
        userId,
      });
    }

    const token = signToken({
      userId,
      email,
      role: role as any,
      name,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email, name, role, language },
    });

    response.cookies.set("saathi_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
