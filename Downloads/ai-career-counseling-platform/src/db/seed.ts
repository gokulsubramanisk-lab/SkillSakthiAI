import { db } from "./index";
import {
  users,
  profiles,
  studentProfiles,
  parentProfiles,
  sources,
  documents,
  documentChunks,
  occupations,
  trainingPrograms,
  laborMarketData,
  conversations,
  messages,
} from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if seed data exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded. Skipping initial seed.");
      return;
    }

    console.log("Seeding database with verified career knowledge...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Create Seed Users
    const studentId = "usr_student_01";
    const parentId = "usr_parent_01";
    const counselorId = "usr_counselor_01";
    const adminId = "usr_admin_01";

    await db.insert(users).values([
      {
        id: studentId,
        email: "ramesh@example.com",
        passwordHash: hashedPassword,
        role: "student",
        name: "Ramesh Kumar",
        language: "ta",
      },
      {
        id: parentId,
        email: "sundar@example.com",
        passwordHash: hashedPassword,
        role: "parent",
        name: "Sundar Kumar (Parent)",
        language: "ta",
      },
      {
        id: counselorId,
        email: "counselor@careersaathi.org",
        passwordHash: hashedPassword,
        role: "counselor",
        name: "Dr. Ananya Sharma",
        language: "en",
      },
      {
        id: adminId,
        email: "admin@careersaathi.org",
        passwordHash: hashedPassword,
        role: "admin",
        name: "System Admin",
        language: "en",
      },
    ]);

    // Profiles
    await db.insert(profiles).values([
      {
        id: "prof_student_01",
        userId: studentId,
        age: 19,
        state: "Tamil Nadu",
        district: "Vellore",
        educationLevel: "12th Completed",
        preferredLanguage: "ta",
        mobilityPreference: "Within District & Nearby",
        budgetLevel: "Low (< ₹30,000)",
        summary: "19 year old student from Vellore who completed 12th, loves electrical and electronics work, and wants affordable training options.",
      },
      {
        id: "prof_parent_01",
        userId: parentId,
        age: 48,
        state: "Tamil Nadu",
        district: "Vellore",
        educationLevel: "10th Pass",
        preferredLanguage: "ta",
        mobilityPreference: "Vellore District",
        budgetLevel: "Moderate (₹50,000)",
        summary: "Parent seeking clear ROI, training cost breakdown, and verified job stability before decision.",
      },
    ]);

    await db.insert(studentProfiles).values({
      id: "sprof_01",
      userId: studentId,
      interests: ["Electronics", "Electrical Repair", "Solar Energy", "Machines"],
      currentSkills: ["Basic Electronics", "Electrical Fundamentals", "Tool Usage"],
      budgetMax: 30000,
      linkedParentId: parentId,
      parentConsentGiven: true,
    });

    await db.insert(parentProfiles).values({
      id: "pprof_01",
      userId: parentId,
      linkedStudentIds: [studentId],
      maxInvestmentBudget: 50000,
      primaryConcerns: ["Course Duration", "Job Placement Rate", "Monthly Starting Salary"],
    });

    // 2. Insert Trusted Sources
    const srcNcvetId = "src_ncvet_01";
    const srcPmkvyId = "src_pmkvy_02";
    const srcNcsId = "src_ncs_03";

    await db.insert(sources).values([
      {
        id: srcNcvetId,
        sourceCode: "GOV-NCVET-2024",
        organization: "National Council for Vocational Education and Training (NCVET)",
        title: "National Skills Qualifications Framework (NSQF) Qualification Standards",
        url: "https://ncvet.gov.in/qualifications",
        documentType: "Official Qualification Standard",
        publicationDate: "2024-01-15",
        retrievedDate: "2025-02-01",
        version: "2024.1",
        verificationStatus: "Verified",
        category: "Vocational Qualification",
        language: "English",
      },
      {
        id: srcPmkvyId,
        sourceCode: "GOV-PMKVY-4.0",
        organization: "Ministry of Skill Development and Entrepreneurship (MSDE)",
        title: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0) Implementation Guidelines",
        url: "https://www.msde.gov.in/pmkvy",
        documentType: "Official Government Scheme",
        publicationDate: "2023-11-10",
        retrievedDate: "2025-01-20",
        version: "4.0",
        verificationStatus: "Verified",
        category: "Government Welfare & Skill Scheme",
        language: "English",
      },
      {
        id: srcNcsId,
        sourceCode: "GOV-NCS-LABOR-2024",
        organization: "National Career Service (NCS) & Ministry of Labour",
        title: "District Skill Development & Labor Market Outlook - Tamil Nadu (Vellore Cluster)",
        url: "https://www.ncs.gov.in/reports/district-vellore",
        documentType: "Official Labor Market Intelligence Report",
        publicationDate: "2024-02-01",
        retrievedDate: "2025-02-10",
        version: "2024.Q1",
        verificationStatus: "Verified",
        category: "Labor Market Intelligence",
        language: "English",
      },
    ]);

    // 3. Insert Documents & Chunks
    const docNcvet = "doc_ncvet_01";
    await db.insert(documents).values([
      {
        id: docNcvet,
        sourceId: srcNcvetId,
        title: "NSQF Level 4 - Electrical Technician & Industrial Automation Standards",
        filePath: "/docs/ncvet_electrical_2024.pdf",
        contentType: "application/pdf",
        fileSize: 245000,
        status: "INDEXED",
      },
    ]);

    await db.insert(documentChunks).values([
      {
        id: "chunk_01",
        documentId: docNcvet,
        sourceId: srcNcvetId,
        chunkIndex: 1,
        textContent: "Electrical Technician NSQF Level 4 requires 10th or 12th qualification. Training duration is 6 to 12 months in Government ITIs or PMKVY centers. Core competencies include: Electrical Safety Standards, Basic Electronics, Wiring & Conduit installation, Single and 3-Phase Motors, Circuit Breakers, and Preventive Maintenance. Average entry salary in Tamil Nadu is ₹18,000 to ₹28,000 per month.",
        keywords: ["Electrical Technician", "Vellore", "12th", "Wiring", "Motor Control", "NCVET", "Salary"],
      },
      {
        id: "chunk_02",
        documentId: docNcvet,
        sourceId: srcNcvetId,
        chunkIndex: 2,
        textContent: "Solar PV Installer & Maintenance Technician NSQF Level 4: Eligibility is Class 10th/12th pass or ITI in Electrical/Wireman. Training duration: 3 to 4 months (approx 350-400 hours). Core competencies: Solar Panel Roof Installation, Inverter Wiring, Battery Storage Maintenance, Net Metering Inspection. Monthly salary ranges from ₹16,000 to ₹25,000 with government subsidies under PM Surya Ghar Muft Bijli Yojana.",
        keywords: ["Solar Technician", "PM Surya Ghar", "Solar Panel", "Inverter", "Vellore", "3 Months"],
      },
      {
        id: "chunk_03",
        documentId: docNcvet,
        sourceId: srcNcvetId,
        chunkIndex: 3,
        textContent: "Industrial Automation & PLC Technician NSQF Level 5: Requires ITI Electrical/Electronics or Higher Secondary with Science. Training duration: 6 months. Key competencies: Programmable Logic Controllers (PLC), SCADA, Motor Drives, Pneumatic Controls, Industrial Sensors, Wiring Standards. Starting monthly salary in industrial hubs like Ranipet, SIPCOT Vellore, Sriperumbudur ranges from ₹22,000 to ₹38,000.",
        keywords: ["Industrial Automation", "PLC", "Ranipet", "Vellore Industrial Cluster", "SCADA", "Motor Drives"],
      },
    ]);

    // 4. Insert Occupations
    const occElec = "occ_elec_01";
    const occSolar = "occ_solar_02";
    const occAuto = "occ_auto_03";
    const occComp = "occ_comp_04";

    await db.insert(occupations).values([
      {
        id: occElec,
        code: "ELEC-TECH-L4",
        title: "Electrical Technician",
        category: "Electrical & Power",
        description: "Installs, tests, maintains, and repairs electrical wiring, fixtures, equipment, and industrial motors in commercial, industrial, and residential setups.",
        requiredQualification: "10th / 12th Pass or ITI Wireman",
        minAge: 18,
        salaryMin: 18000,
        salaryMax: 28000,
        salarySource: "National Career Service (NCS) Tamil Nadu Wages Portal",
        salaryVerifiedDate: "2025-02-01",
        localDemandRating: 88,
        coreSkills: [
          "Basic Electronics",
          "Electrical Fundamentals",
          "Industrial Wiring",
          "Motor Control & Starters",
          "Electrical Safety & Earthing",
        ],
        progressionPath: [
          "Junior Electrician",
          "Electrical Technician",
          "Senior Maintenance Engineer",
          "Electrical Contractor",
        ],
        sourceId: srcNcvetId,
      },
      {
        id: occSolar,
        code: "SOLAR-TECH-L4",
        title: "Solar PV Rooftop Technician",
        category: "Renewable Energy",
        description: "Installs, configures, inspects, and services rooftop solar photovoltaic panels, string inverters, and battery energy storage systems.",
        requiredQualification: "10th / 12th Pass",
        minAge: 18,
        salaryMin: 16000,
        salaryMax: 25000,
        salarySource: "MSDE Renewable Energy Sector Skill Council",
        salaryVerifiedDate: "2025-01-20",
        localDemandRating: 84,
        coreSkills: [
          "Basic Electronics",
          "Solar Module Mounting",
          "DC Wiring & Net Metering",
          "Inverter Diagnostics",
          "Rooftop Safety & Rigging",
        ],
        progressionPath: [
          "Solar Installer Trainee",
          "Solar Rooftop Technician",
          "Solar System Supervisor",
          "Solar Project Entrepreneur",
        ],
        sourceId: srcPmkvyId,
      },
      {
        id: occAuto,
        code: "AUTO-TECH-L5",
        title: "Industrial Automation & PLC Technician",
        category: "Manufacturing & Electronics",
        description: "Operates, programs, and troubleshoots Programmable Logic Controllers (PLCs), sensor networks, pneumatic drives, and automated factory machinery.",
        requiredQualification: "12th Pass (Science/Vocational) or ITI Electrical/Electronics",
        minAge: 18,
        salaryMin: 22000,
        salaryMax: 38000,
        salarySource: "NCS Industrial Cluster Survey - Tamil Nadu",
        salaryVerifiedDate: "2025-02-10",
        localDemandRating: 92,
        coreSkills: [
          "Basic Electronics",
          "Industrial Wiring",
          "Motor Control",
          "PLC Ladder Logic",
          "SCADA & Industrial Sensors",
          "Pneumatics & Hydraulics",
        ],
        progressionPath: [
          "Automation Apprentice",
          "PLC Technician",
          "Automation Systems Engineer",
          "Plant Maintenance Lead",
        ],
        sourceId: srcNcvetId,
      },
      {
        id: occComp,
        code: "ELEC-REPAIR-L3",
        title: "Consumer Electronics Service Technician",
        category: "Electronics Repair",
        description: "Diagnoses and repairs household electronic appliances, PCB boards, smartphones, home power equipment, and LED lighting systems.",
        requiredQualification: "10th / 12th Pass",
        minAge: 18,
        salaryMin: 14000,
        salaryMax: 22000,
        salarySource: "Electronics Sector Skills Council of India (ESSCI)",
        salaryVerifiedDate: "2025-01-15",
        localDemandRating: 79,
        coreSkills: [
          "Basic Electronics",
          "Soldering & PCB Repair",
          "Multimeter Testing",
          "Component Diagnostics",
          "Customer Service",
        ],
        progressionPath: [
          "Service Assistant",
          "Appliance Repair Technician",
          "Service Center Lead",
          "Independent Repair Shop Owner",
        ],
        sourceId: srcNcvetId,
      },
    ]);

    // 5. Insert Training Programs
    await db.insert(trainingPrograms).values([
      {
        id: "tp_elec_01",
        title: "Govt ITI Electrician Trade Certificate",
        provider: "Government Industrial Training Institute (ITI) Vellore",
        durationMonths: 12,
        qualificationAwarded: "NCVT / NCVET Level 4 Certificate",
        costInr: 2500,
        governmentScheme: "Craftsmen Training Scheme (CTS) - 100% Subsidized for Eligible Students",
        eligibility: "10th / 12th Pass",
        locationDistrict: "Vellore",
        locationState: "Tamil Nadu",
        skillsCovered: ["Electrical Safety", "Industrial Wiring", "3-Phase Motor Control", "Transformer Maintenance", "Earthing"],
        occupationId: occElec,
        sourceId: srcNcvetId,
      },
      {
        id: "tp_solar_02",
        title: "PMKVY Surya Mitra Solar Technician Training",
        provider: "National Institute of Solar Energy (NISE) Partner Center - Vellore",
        durationMonths: 3,
        qualificationAwarded: "PMKVY NCVET Level 4 Skill Certificate",
        costInr: 0,
        governmentScheme: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0) - Completely Free + Stipend",
        eligibility: "10th / 12th Pass",
        locationDistrict: "Vellore",
        locationState: "Tamil Nadu",
        skillsCovered: ["Solar Module Mounting", "Inverter Installation", "DC Conduit Wiring", "Grid Connection Inspection"],
        occupationId: occSolar,
        sourceId: srcPmkvyId,
      },
      {
        id: "tp_auto_03",
        title: "Industrial Automation & PLC Specialist Certificate",
        provider: "MSME Technology Centre & Tool Room - Ranipet / Vellore Hub",
        durationMonths: 6,
        qualificationAwarded: "MSME Certified Automation Technician Diploma",
        costInr: 18000,
        governmentScheme: "MSME Skill Development Fee Subsidized Program (50% Scholarship for BC/MBC/SC/ST)",
        eligibility: "12th Pass / ITI Electrical",
        locationDistrict: "Vellore",
        locationState: "Tamil Nadu",
        skillsCovered: ["PLC Programming", "SCADA Integration", "Motor Control Drives", "Industrial Sensors", "Hydraulics"],
        occupationId: occAuto,
        sourceId: srcNcvetId,
      },
    ]);

    // 6. Labor Market Data
    await db.insert(laborMarketData).values([
      {
        id: "lmd_elec_vellore",
        district: "Vellore",
        state: "Tamil Nadu",
        occupationId: occElec,
        demandScore: 88,
        salaryMin: 18000,
        salaryMax: 28000,
        activeJobCount: 142,
        dataFreshnessDate: "2025-02-15",
        sourceId: srcNcsId,
      },
      {
        id: "lmd_solar_vellore",
        district: "Vellore",
        state: "Tamil Nadu",
        occupationId: occSolar,
        demandScore: 84,
        salaryMin: 16000,
        salaryMax: 25000,
        activeJobCount: 86,
        dataFreshnessDate: "2025-02-15",
        sourceId: srcNcsId,
      },
      {
        id: "lmd_auto_vellore",
        district: "Vellore",
        state: "Tamil Nadu",
        occupationId: occAuto,
        demandScore: 92,
        salaryMin: 22000,
        salaryMax: 38000,
        activeJobCount: 210,
        dataFreshnessDate: "2025-02-15",
        sourceId: srcNcsId,
      },
      {
        id: "lmd_comp_vellore",
        district: "Vellore",
        state: "Tamil Nadu",
        occupationId: occComp,
        demandScore: 79,
        salaryMin: 14000,
        salaryMax: 22000,
        activeJobCount: 65,
        dataFreshnessDate: "2025-02-15",
        sourceId: srcNcsId,
      },
    ]);

    // 7. Insert Initial Conversation for Acceptance Test Scenario
    const conv1Id = "conv_student_01";
    await db.insert(conversations).values({
      id: conv1Id,
      userId: studentId,
      title: "Electrical Careers in Vellore (தமிழ்)",
      roleContext: "student",
      language: "ta",
    });

    await db.insert(messages).values([
      {
        id: "msg_01",
        conversationId: conv1Id,
        sender: "user",
        content: "எனக்கு electronics பிடிக்கும். என் district-ல என்ன career நல்லா இருக்கும்?",
        intent: "CAREER_DISCOVERY",
        detectedEmotion: "NORMAL",
        claimValidationStatus: "VERIFIED",
      },
      {
        id: "msg_02",
        conversationId: conv1Id,
        sender: "assistant",
        content: `வணக்கம் Ramesh! வேலூர் (Vellore) மாவட்டத்தில் உங்களது 12-ஆம் வகுப்பு தகுதிக்கும் எலக்ட்ரானிக்ஸ்/எலக்ட்ரிக்கல் ஆர்வத்திற்கும் ஏற்ற 3 சிறந்த சான்றளிக்கப்பட்ட தொழில் வழிகள்:

1. **Electrical Technician (எலக்ட்ரிக்கல் டெக்னீஷியன்)**
   • பொருத்தம்: 88%
   • பயிற்சி காலம்: 12 மாதங்கள் (Govt ITI Vellore)
   • பயிற்சி கட்டணம்: ₹2,500 (அரசு உதவித்தொகை உண்டு)
   • ஆரம்ப சம்பளம்: ₹18,000 - ₹28,000/மாதம் (சராசரி)
   • வேலூர் வேலைவாய்ப்பு: மிக அதிகம் (142+ வேலை வாய்ப்புகள்)

2. **Industrial Automation Technician (தொழில்துறை ஆட்டோமேஷன்)**
   • பொருத்தம்: 92%
   • பயிற்சி காலம்: 6 மாதங்கள் (MSME Technology Centre Ranipet/Vellore)
   • பயிற்சி கட்டணம்: ₹18,000
   • ஆரம்ப சம்பளம்: ₹22,000 - ₹38,000/மாதம்
   • வேலூர் தொழில் மண்டலத்தில் (SIPCOT) அதிக தேவை!

3. **Solar Rooftop Technician (சூரிய ஒளி மின்சார டெக்னீஷியன்)**
   • பொருத்தம்: 84%
   • பயிற்சி காலம்: 3 மாதங்கள் (PMKVY 4.0 - 100% இலவசம்!)
   • ஆரம்ப சம்பளம்: ₹16,000 - ₹25,000/மாதம்

உங்களுக்கு எது பற்றிய கூடுதல் விவரங்கள் தேவை? கீழே உள்ள அட்டவணையில் ஒப்பிட்டுப் பார்க்கவோ அல்லது பயிற்சி விவரங்களை அறியவோ தேர்வு செய்யலாம்.`,
        intent: "CAREER_RECOMMENDATION",
        detectedEmotion: "NORMAL",
        evidenceCitations: [
          {
            sourceId: srcNcvetId,
            title: "NSQF Level 4 Qualification Standard",
            organization: "NCVET",
            url: "https://ncvet.gov.in/qualifications",
            verificationDate: "2025-02-01",
            snippet: "Electrical Technician NSQF Level 4 requires 10th/12th qualification. Entry salary ₹18,000 - ₹28,000/mo.",
          },
          {
            sourceId: srcPmkvyId,
            title: "PMKVY 4.0 Training Scheme",
            organization: "MSDE",
            url: "https://www.msde.gov.in/pmkvy",
            verificationDate: "2025-01-20",
            snippet: "PMKVY Solar PV Rooftop Technician course is 100% free with government certification.",
          },
        ],
        claimValidationStatus: "VERIFIED",
        metadata: {
          recommendedCareers: [occElec, occAuto, occSolar],
        },
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
