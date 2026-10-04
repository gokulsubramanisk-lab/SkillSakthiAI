import { NextResponse } from "next/server";
import { db } from "@/db";
import { counselorCases, users, profiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const cases = await db.select().from(counselorCases).orderBy(desc(counselorCases.createdAt));
    const allUsers = await db.select().from(users);
    const allProfiles = await db.select().from(profiles);

    const enrichedCases = cases.map((c) => {
      const student = allUsers.find((u) => u.id === c.userId);
      const prof = allProfiles.find((p) => p.userId === c.userId);
      return {
        ...c,
        studentName: student?.name || "Student",
        studentEmail: student?.email,
        studentDistrict: prof?.district || "Vellore",
        studentEducation: prof?.educationLevel || "12th Completed",
      };
    });

    return NextResponse.json({ cases: enrichedCases });
  } catch (err: any) {
    console.error("GET /api/counselor/cases error:", err);
    return NextResponse.json({ cases: [] });
  }
}
