// Seeds the verified government knowledge base + district labour market data.
// Every document carries a real MSDE / NSDC / DGT / NCVET source URL so the RAG
// vault can cite it. Labour statistics are district-level reference values used
// by the matcher and the Parent Calculator.

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { localEmbed } from "@/lib/embeddings";
import {
  aiResponses,
  auditLogs,
  careers,
  conversations,
  districtLaborStats,
  districts,
  familyComparisonItems,
  familyComparisons,
  govDocuments,
  messages,
  parentCalculatorSnapshots,
  skills,
  sosCases,
  studentSkills,
  trainingModuleSkills,
  trainingModules,
  userSessions,
  users,
  welfareSchemes,
} from "./schema";

type Agency = "MSDE" | "NSDC" | "ITI" | "NSQF" | "OtherGov";
type Category =
  | "career"
  | "scheme"
  | "policy"
  | "guideline"
  | "iti_module"
  | "nsqf"
  | "faq";

const DISTRICTS = [
  { code: "BR-PAT", name: "Patna", state: "Bihar", regionType: "mixed" },
  { code: "UP-VNS", name: "Varanasi", state: "Uttar Pradesh", regionType: "mixed" },
  { code: "MH-NSK", name: "Nashik", state: "Maharashtra", regionType: "mixed" },
  { code: "MH-JAL", name: "Jalna", state: "Maharashtra", regionType: "rural" },
  { code: "TN-MDU", name: "Madurai", state: "Tamil Nadu", regionType: "mixed" },
  { code: "RJ-JAI", name: "Jaipur", state: "Rajasthan", regionType: "urban" },
  { code: "WB-PUR", name: "Purulia", state: "West Bengal", regionType: "rural" },
  { code: "TS-WGL", name: "Warangal", state: "Telangana", regionType: "rural" },
];

const GOV_DOCS: {
  key: string;
  title: string;
  category: Category;
  agency: Agency;
  url: string;
  body: string;
}[] = [
  {
    key: "pmkvy",
    title: "PMKVY 4.0 Short Term Training and Certification",
    category: "scheme",
    agency: "MSDE",
    url: "https://www.msde.gov.in/en/schemes-initiatives/short-term-training/pmkvy",
    body:
      "Pradhan Mantri Kaushal Vikas Yojana (PMKVY) 4.0 is the flagship skill certification scheme of the Ministry of Skill Development and Entrepreneurship. Short Term Training under PMKVY is offered free of cost to eligible candidates at empanelled training centres, so the family does not pay tuition for the certified course. Candidates are assessed and certified against National Skills Qualification Framework aligned Qualification Packs. Training includes employability, digital and financial literacy modules in addition to the trade skills. Certified candidates are supported with placement assistance through the training provider and the district skill committee.",
  },
  {
    key: "naps",
    title: "National Apprenticeship Promotion Scheme (NAPS) Stipend Support",
    category: "scheme",
    agency: "MSDE",
    url: "https://www.apprenticeshipindia.gov.in/",
    body:
      "The National Apprenticeship Promotion Scheme supports apprenticeship training by sharing a part of the prescribed stipend payable to apprentices through Direct Benefit Transfer. Apprentices earn a monthly stipend while they train on the shop floor, which means a family earns during the training period instead of only paying fees. Establishments register on the apprenticeshipindia portal and engage apprentices against notified trades. Apprenticeship contracts are registered on the portal and the period of apprenticeship counts as recognised work experience. ITI passouts are eligible to join as graduate or technician apprentices depending on the trade.",
  },
  {
    key: "cts",
    title: "Craftsman Training Scheme (CTS) and ITI Admission Process",
    category: "policy",
    agency: "MSDE",
    url: "https://dgt.gov.in/CTS",
    body:
      "The Craftsman Training Scheme is implemented through a network of Industrial Training Institutes across the country under the Directorate General of Training. Trades under CTS are of one year or two year duration and admission is generally after Class 8, Class 10 or Class 12 depending on the trade requirement. Admission to Government ITIs is conducted through a state level online counselling process based on marks in the qualifying examination. Successful trainees appear for the All India Trade Test and receive the National Trade Certificate. Government ITI fees are nominal compared to private institutions and reserved category and women candidates receive fee concessions as notified by the state.",
  },
  {
    key: "nsqf",
    title: "National Skills Qualification Framework (NSQF) Level Descriptors",
    category: "nsqf",
    agency: "NSQF",
    url: "https://www.ncvet.gov.in/nsqf",
    body:
      "The National Skills Qualification Framework organises qualifications in a series of levels of knowledge, skills and aptitude from Level 1 to Level 8. NSQF Level 3 denotes a person who can perform a limited range of routine tasks under supervision with basic theoretical knowledge. NSQF Level 4 denotes the ability to work in a familiar context with a broad range of practical skills and responsibility for own work. NSQF Level 5 denotes a worker who can handle a wide range of complex activities, supervise others and take responsibility for quality of output. All government recognised vocational qualifications must be aligned to an NSQF level before they can be certified.",
  },
  {
    key: "sidh",
    title: "Skill India Digital Hub Registration and Credential Verification",
    category: "guideline",
    agency: "MSDE",
    url: "https://www.skillindiadigital.gov.in/",
    body:
      "Skill India Digital Hub is the unified digital platform of the Ministry of Skill Development and Entrepreneurship for skilling, credentialing and employment linkages. Learners create a verified profile, discover government approved courses and store certificates in a digital locker. Employers and training providers use the platform to publish jobs and apprenticeship opportunities. Certificates issued through the platform can be verified online, which protects families from fake institutes and unrecognised certificates. Families should confirm that any training centre they pay money to is listed on the official portal.",
  },
  {
    key: "ncvet",
    title: "NCVET Awarding Body and Assessment Agency Standards",
    category: "policy",
    agency: "OtherGov",
    url: "https://www.ncvet.gov.in/",
    body:
      "The National Council for Vocational Education and Training is the national regulator for vocational education and training in India. NCVET recognises Awarding Bodies and Assessment Agencies and approves qualifications for inclusion in the national qualification register. Only qualifications approved by NCVET and aligned to the NSQF are recognised for government certification purposes. Assessment agencies must follow prescribed assessment and certification norms including independent assessors and recorded evidence. Candidates and parents can check whether a qualification is recognised on the regulator's public register before enrolling.",
  },
  {
    key: "ddugky",
    title: "DDU-GKY Placement Linked Skilling for Rural Youth",
    category: "scheme",
    agency: "OtherGov",
    url: "https://ddugky.gov.in/",
    body:
      "Deen Dayal Upadhyaya Grameen Kaushalya Yojana is a placement linked skill development programme for rural poor youth between 15 and 35 years of age. The programme funds training, boarding, lodging and post placement support for eligible rural candidates at no cost to the family. Training providers are mandated to place a minimum share of trained candidates in wage employment with documented salary proof. Post placement support is paid for a defined period to help migrant trainees settle in their first job. Placement must be verified with appointment letters and salary records before the provider is paid.",
  },
  {
    key: "jss",
    title: "Jan Shikshan Sansthan Non-Formal Skilling for School Dropouts",
    category: "scheme",
    agency: "MSDE",
    url: "https://www.msde.gov.in/en/schemes-initiatives/Skill-Development-Schemes/JSS",
    body:
      "Jan Shikshan Sansthan provides vocational skilling to non literate, neo literate and school dropouts in the age group of 15 to 45 years. Courses are delivered close to the learner's village at very low or no cost, with flexible timings for women and working youth. The scheme is designed for those who could not continue formal schooling and therefore cannot immediately join a two year ITI trade. Training focuses on locally relevant livelihoods such as tailoring, food processing, repair services and beauty and wellness. Learners can later progress into NSQF aligned certification through recognition of prior learning.",
  },
  {
    key: "electrician_qp",
    title: "Electrician Trade (CTS) Curriculum and Employment Outcomes",
    category: "career",
    agency: "ITI",
    url: "https://dgt.gov.in/Trades/Electrician",
    body:
      "The Electrician trade under the Craftsman Training Scheme is a two year course aligned to NSQF Level 4 and admission requires Class 10 with science and mathematics. The curriculum covers electrical wiring, measurement of electrical quantities, winding and maintenance of motors, control panels and safety practices. Trainees learn domestic and industrial wiring, earthing, testing of circuits and basic preventive maintenance of rotating machines. Certified electricians find wage employment in construction, manufacturing maintenance, power distribution and building services, and many become self employed contractors. The trade also qualifies the candidate to apply for a state wiring licence and for electrician apprenticeship positions.",
  },
  {
    key: "solar_qp",
    title: "Suryamitra Solar PV Technician Qualification Pack",
    category: "career",
    agency: "NSDC",
    url: "https://www.nsdcindia.org/",
    body:
      "The Solar PV Installer qualification prepares candidates to install, commission and maintain rooftop and ground mounted solar photovoltaic systems. The short duration residential programme is aligned to the NSQF and covers module mounting structures, cabling, inverter commissioning and battery bank maintenance. Trainees practise site survey, load assessment, safety procedures for working at height and basic performance troubleshooting. Demand for the role is driven by rooftop solar programmes and rural electrification works, including operation and maintenance contracts. Certified technicians work with EPC contractors, distribution companies and solar operation and maintenance service providers.",
  },
  {
    key: "welder_qp",
    title: "Welder Trade Curriculum and Industry Demand",
    category: "career",
    agency: "ITI",
    url: "https://dgt.gov.in/Trades/Welder",
    body:
      "The Welder trade under the Craftsman Training Scheme is a one year course aligned to NSQF Level 3 with Class 8 or Class 10 entry depending on the state. The syllabus covers shielded metal arc welding, gas welding and cutting, weld joint preparation, distortion control and visual weld inspection. Safety training covers protective equipment, ventilation, fire control and handling of gas cylinders. Welders are employed in fabrication units, infrastructure projects, railway workshops, agricultural implement manufacturing and shipbuilding. Experienced welders who clear specialised qualification tests earn substantially higher wages in pipeline and pressure vessel work.",
  },
  {
    key: "mlt_qp",
    title: "Medical Laboratory Technician Qualification and Practice Norms",
    category: "career",
    agency: "NSDC",
    url: "https://www.nsdcindia.org/",
    body:
      "The Medical Laboratory Technician qualification is aligned to NSQF Level 5 and is typically a two year programme after Class 12 with science. The curriculum covers specimen collection, haematology, clinical biochemistry, microbiology basics, microscopy and laboratory quality control. Trainees are taught biomedical waste segregation, infection control and documentation of test results under supervision of a pathologist. Technicians are employed in district hospitals, diagnostic chains, primary health centres and collection centres. Employment is comparatively stable because diagnostic services operate through economic cycles and are expanding in Tier 2 and Tier 3 towns.",
  },
  {
    key: "apprentice_rules",
    title: "Apprenticeship Contract, Stipend and Working Hours Rules",
    category: "guideline",
    agency: "MSDE",
    url: "https://www.apprenticeshipindia.gov.in/",
    body:
      "Apprenticeship engagement is governed by the Apprentices Act and the rules notified under it. A contract of apprenticeship must be registered on the national portal within the prescribed period of engagement. The establishment must pay at least the minimum prescribed stipend rate for the category of apprentice every month. Apprentices cannot be engaged beyond prescribed working hours and are entitled to the safety provisions applicable to regular workers. On completion the apprentice receives a proficiency certificate which is recognised for employment and for further apprenticeship.",
  },
  {
    key: "vishwakarma",
    title: "PM Vishwakarma Toolkit Incentive and Collateral Free Credit",
    category: "scheme",
    agency: "OtherGov",
    url: "https://pmvishwakarma.gov.in/",
    body:
      "PM Vishwakarma supports traditional artisans and craftspeople working with hands and tools in eighteen notified trades. Registered beneficiaries receive skill upgradation training with a training stipend, a toolkit incentive and access to collateral free enterprise development loans. Beneficiaries also receive a recognition certificate and identity card that establishes their status as a registered artisan. The scheme encourages digital transactions and marketing support for products made by registered artisans. Families with a traditional trade background can use the scheme to formalise and modernise an existing household occupation.",
  },
  {
    key: "placement_reporting",
    title: "District Skill Committee Placement and Employment Reporting",
    category: "guideline",
    agency: "MSDE",
    url: "https://www.msde.gov.in/en/about-msde/Skill-Development-Mission",
    body:
      "District Skill Committees under the Skill Development Mission are responsible for assessing local skill demand and monitoring training outcomes in the district. Committees prepare district skill development plans that map industry demand to available training capacity. Training providers report candidate enrolment, certification and placement outcomes with verifiable employment evidence. These district level records are the basis for publishing local placement rates and employer requirements. Families should ask the training centre for the district placement record of the previous batch before enrolling.",
  },
  {
    key: "women_skilling",
    title: "Women Candidates: Fee Concession and Safe Training Provisions",
    category: "scheme",
    agency: "MSDE",
    url: "https://www.msde.gov.in/en/schemes-initiatives/women-skilling",
    body:
      "Skilling programmes include specific provisions to increase participation of women, including fee concessions in government institutes as notified by states. Residential facilities, safe transport allowances and women only batches are provided in several schemes to address safety concerns of families. Courses in sectors such as apparel, healthcare, beauty and wellness, electronics assembly and IT services have high women participation. Flexible batch timings and crèche support are recommended for women learners in long duration programmes. Families concerned about safety can request information on hostel facilities and women faculty before admission.",
  },
  {
    key: "iti_fees",
    title: "ITI Fee Structure, Scholarships and Reimbursement",
    category: "guideline",
    agency: "ITI",
    url: "https://dgt.gov.in/",
    body:
      "Government Industrial Training Institutes charge a nominal admission and tuition fee notified by the state government, which is far lower than private institute charges. Scheduled Caste, Scheduled Tribe, Other Backward Class and economically weaker section candidates may claim post matric scholarship or fee reimbursement as notified by the state social welfare department. Additional costs usually include a refundable caution deposit, examination fee, tool kit and uniform. Families should obtain an official receipt for every payment and verify the institute code on the government portal. Private institutes that are not affiliated under the Craftsman Training Scheme cannot issue a National Trade Certificate.",
  },
  {
    key: "family_faq",
    title: "Choosing a Vocational Trade: Official Guidance for Families",
    category: "faq",
    agency: "MSDE",
    url: "https://www.skillindiadigital.gov.in/",
    body:
      "Families should select a trade by matching the learner's aptitude with verified local employer demand rather than by popularity alone. Check whether the qualification is NSQF aligned and whether the awarding body is recognised by the national regulator. Compare the total cost of the course including fees, tools and travel against the documented starting wage for that trade in the district. Ask for the previous batch placement record and for employer names where trainees were placed. A vocational certificate can be stacked later with apprenticeship and higher qualifications, so an early vocational choice does not close the path to further study.",
  },
];

const CAREER_SEED = [
  { key: "electrician", name: "Electrician (ITI Trade)", nsqf: 4, doc: "electrician_qp", min: 24, max: 24, cost: 12000, start: 14500, five: 28000, safety: 82, agency: "ITI" as Agency, url: "https://dgt.gov.in/Trades/Electrician", desc: "Installs and maintains domestic and industrial wiring, motors, panels and earthing systems." },
  { key: "fitter", name: "Fitter (ITI Trade)", nsqf: 4, doc: "cts", min: 24, max: 24, cost: 12000, start: 14000, five: 26500, safety: 78, agency: "ITI" as Agency, url: "https://dgt.gov.in/CTS", desc: "Performs bench fitting, assembly, alignment and maintenance of mechanical equipment." },
  { key: "welder", name: "Welder (Gas & Electric)", nsqf: 3, doc: "welder_qp", min: 12, max: 12, cost: 8000, start: 13500, five: 24000, safety: 76, agency: "ITI" as Agency, url: "https://dgt.gov.in/Trades/Welder", desc: "Joins metal structures using arc and gas welding for fabrication and infrastructure work." },
  { key: "solar", name: "Solar PV Installer (Suryamitra)", nsqf: 4, doc: "solar_qp", min: 6, max: 9, cost: 9500, start: 16000, five: 32000, safety: 85, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Installs, commissions and maintains rooftop and ground mounted solar PV systems." },
  { key: "cnc", name: "CNC Machine Operator", nsqf: 4, doc: "cts", min: 12, max: 18, cost: 15000, start: 17000, five: 34000, safety: 80, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Sets up and operates computer controlled machine tools for precision components." },
  { key: "auto", name: "Automotive Service Technician", nsqf: 4, doc: "cts", min: 18, max: 24, cost: 13000, start: 15000, five: 29000, safety: 79, agency: "ITI" as Agency, url: "https://dgt.gov.in/CTS", desc: "Diagnoses and repairs engines, brakes and vehicle electrical systems in service workshops." },
  { key: "mlt", name: "Medical Laboratory Technician", nsqf: 5, doc: "mlt_qp", min: 24, max: 24, cost: 25000, start: 18000, five: 36000, safety: 83, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Collects samples and runs clinical laboratory tests under supervision in hospitals and labs." },
  { key: "apparel", name: "Sewing Machine Operator (Apparel)", nsqf: 3, doc: "jss", min: 4, max: 6, cost: 4000, start: 11000, five: 19000, safety: 68, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Operates industrial sewing machines for garment assembly and finishing lines." },
  { key: "agri", name: "Agriculture Equipment Technician", nsqf: 4, doc: "cts", min: 9, max: 12, cost: 7000, start: 13000, five: 24500, safety: 74, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Services tractors, pumps and farm implements for rural service centres and custom hiring units." },
  { key: "ithelp", name: "IT Help Desk Assistant", nsqf: 4, doc: "sidh", min: 6, max: 9, cost: 11000, start: 15500, five: 31000, safety: 77, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Resolves hardware, network and software tickets for offices, BPOs and CSC networks." },
  { key: "beauty", name: "Beauty Therapist", nsqf: 3, doc: "women_skilling", min: 6, max: 9, cost: 9000, start: 12000, five: 23000, safety: 70, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Delivers skin, hair and grooming services in salons or as a home-service micro entrepreneur." },
  { key: "food", name: "Food Processing Technician", nsqf: 4, doc: "jss", min: 12, max: 12, cost: 10000, start: 13500, five: 25000, safety: 72, agency: "NSDC" as Agency, url: "https://www.nsdcindia.org/", desc: "Operates processing and packaging lines with food safety and hygiene compliance." },
];

const SKILL_SEED: { name: string; nsqf: number; desc: string }[] = [
  { name: "Electrical Wiring", nsqf: 4, desc: "Domestic and industrial wiring, earthing and load distribution." },
  { name: "Circuit Testing", nsqf: 4, desc: "Use of multimeter, megger and clamp meter for fault finding." },
  { name: "Motor Winding", nsqf: 4, desc: "Rewinding and maintenance of single and three phase motors." },
  { name: "Blueprint Reading", nsqf: 3, desc: "Reading engineering drawings, symbols and tolerances." },
  { name: "Precision Measurement", nsqf: 4, desc: "Vernier, micrometer and gauge based measurement." },
  { name: "Bench Fitting", nsqf: 4, desc: "Filing, drilling, tapping and assembly operations." },
  { name: "Arc Welding", nsqf: 3, desc: "Shielded metal arc welding of plates and structures." },
  { name: "Gas Cutting", nsqf: 3, desc: "Oxy fuel cutting and safe cylinder handling." },
  { name: "Weld Inspection", nsqf: 4, desc: "Visual inspection of weld joints and defect identification." },
  { name: "Solar Panel Mounting", nsqf: 4, desc: "Structure erection and module mounting with safety at height." },
  { name: "Inverter Commissioning", nsqf: 4, desc: "String configuration, inverter setup and performance checks." },
  { name: "Battery Maintenance", nsqf: 3, desc: "Battery bank wiring, electrolyte checks and safety." },
  { name: "CNC Programming", nsqf: 4, desc: "G and M code part programs and tool offsets." },
  { name: "Lathe Operation", nsqf: 3, desc: "Turning, facing and threading operations." },
  { name: "Quality Inspection", nsqf: 4, desc: "Dimensional checks and rejection analysis." },
  { name: "Engine Diagnostics", nsqf: 4, desc: "Scan tool diagnostics and engine fault isolation." },
  { name: "Brake Servicing", nsqf: 3, desc: "Disc and drum brake servicing and bleeding." },
  { name: "Vehicle Electrical Systems", nsqf: 4, desc: "Battery, starter, alternator and wiring harness work." },
  { name: "Sample Collection", nsqf: 4, desc: "Phlebotomy and specimen handling protocols." },
  { name: "Microscopy", nsqf: 5, desc: "Slide preparation and microscopic examination." },
  { name: "Biomedical Waste Handling", nsqf: 4, desc: "Segregation and disposal as per prescribed norms." },
  { name: "Machine Stitching", nsqf: 3, desc: "Industrial sewing machine operation and seam quality." },
  { name: "Fabric Cutting", nsqf: 3, desc: "Marker making and bulk fabric cutting." },
  { name: "Tractor Maintenance", nsqf: 4, desc: "Periodic service of tractors and farm implements." },
  { name: "Irrigation Pump Repair", nsqf: 3, desc: "Diagnosis and repair of pump sets and starters." },
  { name: "Hardware Troubleshooting", nsqf: 4, desc: "Desktop, printer and peripheral fault resolution." },
  { name: "Network Basics", nsqf: 4, desc: "LAN setup, IP configuration and connectivity checks." },
  { name: "Customer Ticketing", nsqf: 3, desc: "Logging, tracking and closing service tickets." },
  { name: "Skin & Hair Care", nsqf: 3, desc: "Facial, hair and grooming service procedures." },
  { name: "Salon Hygiene", nsqf: 3, desc: "Sanitisation and client safety practices." },
  { name: "Food Safety & HACCP", nsqf: 4, desc: "Hygiene, hazard control and traceability on processing lines." },
  { name: "Packaging Line Operation", nsqf: 3, desc: "Filling, sealing and labelling machine operation." },
  { name: "Digital Literacy", nsqf: 2, desc: "Smartphone, internet and digital payment usage." },
  { name: "Workplace Communication", nsqf: 3, desc: "Reporting, teamwork and customer interaction." },
  { name: "Basic Mathematics", nsqf: 2, desc: "Measurement, ratios and workshop calculations." },
  { name: "Workshop Safety", nsqf: 3, desc: "PPE usage, hazard identification and first aid basics." },
];

const CAREER_SKILLS: Record<string, string[]> = {
  electrician: ["Electrical Wiring", "Circuit Testing", "Motor Winding", "Workshop Safety", "Basic Mathematics"],
  fitter: ["Blueprint Reading", "Precision Measurement", "Bench Fitting", "Workshop Safety", "Basic Mathematics"],
  welder: ["Arc Welding", "Gas Cutting", "Weld Inspection", "Workshop Safety"],
  solar: ["Solar Panel Mounting", "Inverter Commissioning", "Battery Maintenance", "Circuit Testing", "Workshop Safety"],
  cnc: ["CNC Programming", "Lathe Operation", "Precision Measurement", "Quality Inspection", "Blueprint Reading"],
  auto: ["Engine Diagnostics", "Brake Servicing", "Vehicle Electrical Systems", "Workshop Safety"],
  mlt: ["Sample Collection", "Microscopy", "Biomedical Waste Handling", "Workplace Communication"],
  apparel: ["Machine Stitching", "Fabric Cutting", "Quality Inspection", "Workplace Communication"],
  agri: ["Tractor Maintenance", "Irrigation Pump Repair", "Workshop Safety", "Basic Mathematics"],
  ithelp: ["Hardware Troubleshooting", "Network Basics", "Customer Ticketing", "Digital Literacy"],
  beauty: ["Skin & Hair Care", "Salon Hygiene", "Workplace Communication", "Digital Literacy"],
  food: ["Food Safety & HACCP", "Packaging Line Operation", "Quality Inspection", "Workshop Safety"],
};

const SCHEME_SEED = [
  { name: "PMKVY 4.0 Free Short Term Training", doc: "pmkvy", benefit: 9000, criteria: "Indian citizen, age 15-45, Aadhaar linked, not already certified for the same QP.", career: null as string | null, district: null as string | null },
  { name: "NAPS Apprenticeship Stipend Support", doc: "naps", benefit: 12000, criteria: "Engaged as a registered apprentice on apprenticeshipindia portal.", career: null, district: null },
  { name: "Post-Matric Scholarship / ITI Fee Reimbursement", doc: "iti_fees", benefit: 8000, criteria: "SC/ST/OBC/EWS candidate admitted to a government ITI with valid income certificate.", career: null, district: null },
  { name: "Women Candidate Fee Concession", doc: "women_skilling", benefit: 6000, criteria: "Women candidates admitted in notified government institutes.", career: null, district: null },
  { name: "DDU-GKY Rural Placement Linked Training", doc: "ddugky", benefit: 15000, criteria: "Rural youth aged 15-35 from an eligible household.", career: null, district: "WB-PUR" },
  { name: "PM Vishwakarma Toolkit Incentive", doc: "vishwakarma", benefit: 15000, criteria: "Artisan in one of the 18 notified traditional trades (e.g. tailoring), registered on the portal.", career: "apparel", district: null },
];

// Deterministic pseudo random so district stats stay stable across reseeds.
function prand(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 10000) / 10000;
}

export async function seedDatabase() {
  // Clear in dependency order (demo/reference data only).
  await db.delete(familyComparisonItems);
  await db.delete(familyComparisons);
  await db.delete(parentCalculatorSnapshots);
  await db.delete(sosCases);
  await db.delete(aiResponses);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(userSessions);
  await db.delete(auditLogs);
  await db.delete(studentSkills);
  await db.delete(trainingModuleSkills);
  await db.delete(trainingModules);
  await db.delete(welfareSchemes);
  await db.delete(districtLaborStats);
  await db.delete(careers);
  await db.delete(skills);
  await db.delete(govDocuments);
  await db.delete(users);
  await db.delete(districts);

  await db.insert(districts).values(DISTRICTS);

  const docRows = await db
    .insert(govDocuments)
    .values(
      GOV_DOCS.map((doc) => ({
        title: doc.title,
        category: doc.category,
        body: doc.body,
        language: "en-IN",
        sourceUrl: doc.url,
        sourceAgency: doc.agency,
        embedding: localEmbed(`${doc.title}. ${doc.body}`),
      })),
    )
    .returning({ id: govDocuments.id, title: govDocuments.title });

  const docIdByKey = new Map<string, number>();
  GOV_DOCS.forEach((doc) => {
    const row = docRows.find((r) => r.title === doc.title);
    if (row) docIdByKey.set(doc.key, row.id);
  });

  const skillRows = await db
    .insert(skills)
    .values(
      SKILL_SEED.map((s) => ({ name: s.name, nsqfLevel: s.nsqf, description: s.desc })),
    )
    .returning({ id: skills.id, name: skills.name });
  const skillIdByName = new Map(skillRows.map((r) => [r.name, r.id]));

  const careerRows = await db
    .insert(careers)
    .values(
      CAREER_SEED.map((c) => ({
        name: c.name,
        nsqfLevel: c.nsqf,
        description: c.desc,
        govDocumentId: docIdByKey.get(c.doc) ?? null,
        sourceUrl: c.url,
        sourceAgency: c.agency,
        minTrainingMonths: c.min,
        maxTrainingMonths: c.max,
        avgStartSalary: String(c.start),
        avgFiveYearSalary: String(c.five),
        employmentSafetyScore: c.safety,
        typicalTrainingCost: String(c.cost),
      })),
    )
    .returning({ id: careers.id, name: careers.name });
  const careerIdByKey = new Map<string, number>();
  CAREER_SEED.forEach((c) => {
    const row = careerRows.find((r) => r.name === c.name);
    if (row) careerIdByKey.set(c.key, row.id);
  });

  // District labour market statistics (district x career).
  const statValues: {
    districtCode: string;
    careerId: number;
    avgSalary: string;
    jobOpenings: number;
    placementRate: string;
    attritionRate: string;
    sourceUrl: string;
  }[] = [];
  for (const district of DISTRICTS) {
    for (const career of CAREER_SEED) {
      const r1 = prand(`${district.code}|${career.key}|openings`);
      const r2 = prand(`${district.code}|${career.key}|placement`);
      const r3 = prand(`${district.code}|${career.key}|salary`);
      const r4 = prand(`${district.code}|${career.key}|attrition`);
      const base = district.regionType === "urban" ? 420 : district.regionType === "mixed" ? 260 : 140;
      statValues.push({
        districtCode: district.code,
        careerId: careerIdByKey.get(career.key)!,
        avgSalary: String(Math.round(career.start * (0.88 + r3 * 0.3))),
        jobOpenings: Math.round(base * (0.5 + r1 * 1.4)),
        placementRate: (0.46 + r2 * 0.46).toFixed(2),
        attritionRate: (0.08 + r4 * 0.24).toFixed(2),
        sourceUrl: "https://www.msde.gov.in/en/about-msde/Skill-Development-Mission",
      });
    }
  }
  await db.insert(districtLaborStats).values(statValues);

  // ITI / training modules per district x career + module-skill mapping.
  const moduleValues: {
    code: string;
    title: string;
    nsqfLevel: number;
    durationMonths: number;
    tuitionCost: string;
    itiName: string;
    districtCode: string;
    careerId: number;
    govDocumentId: number | null;
    sourceUrl: string;
    careerKey: string;
  }[] = [];
  for (const district of DISTRICTS) {
    for (const career of CAREER_SEED) {
      const r = prand(`${district.code}|${career.key}|fee`);
      moduleValues.push({
        code: `${career.key.toUpperCase().slice(0, 4)}-${district.code}`,
        title: `${career.name} — Government ITI module`,
        nsqfLevel: career.nsqf,
        durationMonths: career.min,
        tuitionCost: String(Math.round(career.cost * (0.8 + r * 0.5))),
        itiName: `Government ITI ${district.name}`,
        districtCode: district.code,
        careerId: careerIdByKey.get(career.key)!,
        govDocumentId: docIdByKey.get(career.doc) ?? null,
        sourceUrl: career.url,
        careerKey: career.key,
      });
    }
  }
  const insertedModules = await db
    .insert(trainingModules)
    .values(moduleValues.map(({ careerKey: _k, ...rest }) => rest))
    .returning({ id: trainingModules.id, code: trainingModules.code });

  const moduleSkillValues: { trainingModuleId: number; skillId: number }[] = [];
  insertedModules.forEach((row) => {
    const seedRow = moduleValues.find((m) => m.code === row.code);
    if (!seedRow) return;
    for (const skillName of CAREER_SKILLS[seedRow.careerKey] ?? []) {
      const skillId = skillIdByName.get(skillName);
      if (skillId) moduleSkillValues.push({ trainingModuleId: row.id, skillId });
    }
  });
  await db.insert(trainingModuleSkills).values(moduleSkillValues);

  await db.insert(welfareSchemes).values(
    SCHEME_SEED.map((s) => ({
      name: s.name,
      description: GOV_DOCS.find((d) => d.key === s.doc)?.body.slice(0, 240) ?? s.name,
      eligibilityCriteria: s.criteria,
      benefitAmount: String(s.benefit),
      districtCode: s.district,
      careerId: s.career ? (careerIdByKey.get(s.career) ?? null) : null,
      govDocumentId: docIdByKey.get(s.doc) ?? null,
      sourceUrl: GOV_DOCS.find((d) => d.key === s.doc)?.url ?? "https://www.msde.gov.in/",
    })),
  );

  const userRows = await db
    .insert(users)
    .values([
      { name: "Asha Devi (Student)", role: "student", language: "hi-IN", districtCode: "BR-PAT", phone: "+91-90000-00001" },
      { name: "Ramesh Prasad (Parent)", role: "parent", language: "hi-IN", districtCode: "BR-PAT", phone: "+91-90000-00002" },
      { name: "Karthik S (Student)", role: "student", language: "ta-IN", districtCode: "TN-MDU", phone: "+91-90000-00003" },
      { name: "Dr. Meena Rao (Counsellor)", role: "counselor", language: "mr-IN", districtCode: "MH-NSK", phone: "+91-90000-00004" },
      { name: "District Skill Admin", role: "admin", language: "en-IN", districtCode: "MH-NSK", phone: "+91-90000-00005" },
    ])
    .returning({ id: users.id, name: users.name, role: users.role });

  const asha = userRows.find((u) => u.name.startsWith("Asha"));
  const karthik = userRows.find((u) => u.name.startsWith("Karthik"));
  const studentSkillValues: { studentId: number; skillId: number; proficiencyLevel: number; evidenceText: string }[] = [];
  if (asha) {
    for (const [name, level] of [["Digital Literacy", 3], ["Basic Mathematics", 3], ["Machine Stitching", 2]] as const) {
      const skillId = skillIdByName.get(name);
      if (skillId) studentSkillValues.push({ studentId: asha.id, skillId, proficiencyLevel: level, evidenceText: "Self declared during voice intake" });
    }
  }
  if (karthik) {
    for (const [name, level] of [["Workshop Safety", 3], ["Arc Welding", 2], ["Basic Mathematics", 3]] as const) {
      const skillId = skillIdByName.get(name);
      if (skillId) studentSkillValues.push({ studentId: karthik.id, skillId, proficiencyLevel: level, evidenceText: "Family workshop experience" });
    }
  }
  if (studentSkillValues.length) await db.insert(studentSkills).values(studentSkillValues);

  return {
    districts: DISTRICTS.length,
    documents: docRows.length,
    careers: careerRows.length,
    skills: skillRows.length,
    modules: insertedModules.length,
    laborStats: statValues.length,
    users: userRows.length,
  };
}

export async function isSeeded(): Promise<boolean> {
  try {
    const result = await db.execute<{ count: string }>(
      sql`select count(*)::text as count from gov_documents`,
    );
    const rows = result.rows as { count: string }[];
    return Number(rows[0]?.count ?? "0") > 0;
  } catch {
    return false;
  }
}
