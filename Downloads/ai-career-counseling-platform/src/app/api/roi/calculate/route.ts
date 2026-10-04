import { NextResponse } from "next/server";
import { calculateCareerROI } from "@/lib/roi/calculator";
import { getCurrentUser } from "@/lib/auth/jwt";
import { db } from "@/db";
import { roiCalculations } from "@/db/schema";
import { ensureDbInitialized } from "@/db/init";

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const tokenUser = await getCurrentUser();
    const userId = tokenUser?.userId || "usr_student_01";
    const body = await req.json();

    const {
      occupationId = "occ_elec_01",
      courseFee = 2500,
      travelCost = 3000,
      accommodationCost = 0,
      equipmentCost = 2000,
      durationMonths = 12,
      financialAssistance = 1000,
      userExpectedMonthlyIncome = 22000,
      verifiedSalaryMin = 18000,
      verifiedSalaryMax = 28000,
    } = body;

    const result = calculateCareerROI({
      courseFee: Number(courseFee),
      travelCost: Number(travelCost),
      accommodationCost: Number(accommodationCost),
      equipmentCost: Number(equipmentCost),
      durationMonths: Number(durationMonths),
      financialAssistance: Number(financialAssistance),
      userExpectedMonthlyIncome: Number(userExpectedMonthlyIncome),
      verifiedSalaryMin: Number(verifiedSalaryMin),
      verifiedSalaryMax: Number(verifiedSalaryMax),
    });

    // Save calculation
    try {
      await db.insert(roiCalculations).values({
        id: "roi_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        userId,
        occupationId,
        courseFee: Number(courseFee),
        travelCost: Number(travelCost),
        accommodationCost: Number(accommodationCost),
        equipmentCost: Number(equipmentCost),
        userExpectedIncome: Number(userExpectedMonthlyIncome),
        verifiedSalaryMin: Number(verifiedSalaryMin),
        verifiedSalaryMax: Number(verifiedSalaryMax),
        financialAssistance: Number(financialAssistance),
        calculatedPaybackMonths: result.paybackPeriodMonths,
        calculatedCostIncomeRatio: result.costToIncomeRatio,
      });
    } catch (e) {
      console.warn("ROI saving skipped:", e);
    }

    return NextResponse.json({ roiResult: result });
  } catch (err: any) {
    console.error("POST /api/roi/calculate error:", err);
    return NextResponse.json({ error: "ROI calculation failed" }, { status: 500 });
  }
}
