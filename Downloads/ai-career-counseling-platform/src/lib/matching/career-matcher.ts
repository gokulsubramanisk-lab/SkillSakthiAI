import { db } from "@/db";
import { occupations, laborMarketData, trainingPrograms } from "@/db/schema";

export interface CareerMatchInput {
  skills: string[];
  education: string;
  district: string;
  state: string;
  interests: string[];
  budgetMax?: number;
}

export interface CareerMatchResult {
  occupation: any;
  overallMatchScore: number;
  skillMatchPercentage: number;
  qualificationMatchPercentage: number;
  locationRelevancePercentage: number;
  trainingAvailabilityPercentage: number;
  whyRecommended: string[];
  missingSkills: string[];
  availableTraining: any[];
  localDataAvailable: boolean;
  laborMarketInfo?: any;
}

export async function computeCareerMatches(
  input: CareerMatchInput
): Promise<CareerMatchResult[]> {
  const allOccs = await db.select().from(occupations);
  const allLmd = await db.select().from(laborMarketData);
  const allTraining = await db.select().from(trainingPrograms);

  const results: CareerMatchResult[] = allOccs.map((occ) => {
    // 1. Skill Match Calculation
    const coreSkills = occ.coreSkills || [];
    const matchedSkills = coreSkills.filter((sk: string) =>
      input.skills.some(
        (userSk) =>
          userSk.toLowerCase().includes(sk.toLowerCase()) ||
          sk.toLowerCase().includes(userSk.toLowerCase())
      )
    );
    const missingSkills = coreSkills.filter(
      (sk: string) => !matchedSkills.includes(sk)
    );

    const skillMatchPercentage =
      coreSkills.length > 0
        ? Math.min(100, Math.round((matchedSkills.length / Math.max(1, coreSkills.length)) * 100) + 40)
        : 60;

    // 2. Qualification Match
    let qualificationMatchPercentage = 85;
    if (input.education.includes("12th") && occ.requiredQualification.includes("12th")) {
      qualificationMatchPercentage = 95;
    } else if (input.education.includes("10th") && occ.requiredQualification.includes("10th")) {
      qualificationMatchPercentage = 90;
    }

    // 3. Location Relevance & Labor Market Data
    const lmd = allLmd.find(
      (l) =>
        l.occupationId === occ.id &&
        l.district.toLowerCase() === input.district.toLowerCase()
    );

    const localDataAvailable = !!lmd;
    const locationRelevancePercentage = localDataAvailable
      ? lmd.demandScore
      : 50;

    // 4. Training Availability
    const prog = allTraining.filter((t) => t.occupationId === occ.id);
    const trainingAvailabilityPercentage = prog.length > 0 ? 90 : 60;

    // 5. Overall Match Score Formula
    const overallMatchScore = Math.round(
      skillMatchPercentage * 0.35 +
        qualificationMatchPercentage * 0.25 +
        locationRelevancePercentage * 0.25 +
        trainingAvailabilityPercentage * 0.15
    );

    // Why Recommended explanations
    const whyRecommended: string[] = [];
    if (matchedSkills.length > 0) {
      whyRecommended.push(
        `Matches your existing skills in ${matchedSkills.join(", ")}.`
      );
    } else {
      whyRecommended.push("Strong alignment with your interest in technical trades.");
    }

    if (qualificationMatchPercentage > 85) {
      whyRecommended.push(
        `Your education qualification (${input.education}) directly meets NCVET standards.`
      );
    }

    if (localDataAvailable) {
      whyRecommended.push(
        `High verified demand in ${input.district} (${lmd.activeJobCount} active verified job posts).`
      );
    } else {
      whyRecommended.push(`Local data unavailable for ${input.district} - regional average applied.`);
    }

    if (prog.length > 0) {
      whyRecommended.push(
        `${prog.length} verified government/accredited training centers in or near ${input.district}.`
      );
    }

    return {
      occupation: occ,
      overallMatchScore,
      skillMatchPercentage,
      qualificationMatchPercentage,
      locationRelevancePercentage,
      trainingAvailabilityPercentage,
      whyRecommended,
      missingSkills,
      availableTraining: prog,
      localDataAvailable,
      laborMarketInfo: lmd,
    };
  });

  return results.sort((a, b) => b.overallMatchScore - a.overallMatchScore);
}
