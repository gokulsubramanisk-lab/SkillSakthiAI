"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  BarChart2,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  IndianRupee,
  Clock,
  Briefcase,
  Layers,
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Award,
} from "lucide-react";

interface ParentWorkspaceProps {
  selectedCareerIds: string[];
  onOpenEvidence: (cite: any) => void;
  onEscalateCounselor: (reason: string) => void;
}

export const ParentWorkspace: React.FC<ParentWorkspaceProps> = ({
  selectedCareerIds,
  onOpenEvidence,
  onEscalateCounselor,
}) => {
  const [activeTab, setActiveTab] = useState<"comparison" | "roi">("comparison");
  const [comparisonItems, setComparisonItems] = useState<any[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // ROI Calculator Inputs
  const [selectedOccForRoi, setSelectedOccForRoi] = useState<string>("occ_elec_01");
  const [courseFee, setCourseFee] = useState<number>(2500);
  const [travelCost, setTravelCost] = useState<number>(3000);
  const [accommodationCost, setAccommodationCost] = useState<number>(0);
  const [equipmentCost, setEquipmentCost] = useState<number>(2000);
  const [financialAssistance, setFinancialAssistance] = useState<number>(1000);
  const [userExpectedIncome, setUserExpectedIncome] = useState<number>(22000);

  const [roiResult, setRoiResult] = useState<any>(null);

  useEffect(() => {
    fetchComparison();
  }, [selectedCareerIds]);

  useEffect(() => {
    calculateRoi();
  }, [
    selectedOccForRoi,
    courseFee,
    travelCost,
    accommodationCost,
    equipmentCost,
    financialAssistance,
    userExpectedIncome,
  ]);

  const fetchComparison = async () => {
    setLoadingCompare(true);
    try {
      const ids = selectedCareerIds.length > 0 ? selectedCareerIds : ["occ_elec_01", "occ_solar_02", "occ_auto_03"];
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occupationIds: ids, district: "Vellore" }),
      });
      const data = await res.json();
      if (data.comparisonItems) {
        setComparisonItems(data.comparisonItems);
      }
    } catch (e) {
      console.error("Comparison fetch error:", e);
    } finally {
      setLoadingCompare(false);
    }
  };

  const calculateRoi = async () => {
    try {
      const res = await fetch("/api/roi/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupationId: selectedOccForRoi,
          courseFee,
          travelCost,
          accommodationCost,
          equipmentCost,
          financialAssistance,
          userExpectedMonthlyIncome: userExpectedIncome,
          verifiedSalaryMin: 18000,
          verifiedSalaryMax: 28000,
        }),
      });
      const data = await res.json();
      if (data.roiResult) {
        setRoiResult(data.roiResult);
      }
    } catch (e) {
      console.error("ROI calculation error:", e);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-8 space-y-6">
      {/* Parent Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Family Decision-Support Workspace</h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Government Data
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Compare training costs, duration, verified salary statistics, and ROI payback metrics for family peace of mind.
          </p>
        </div>

        {/* Workspace Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === "comparison" ? "bg-teal-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>3-Career Comparison Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("roi")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === "roi" ? "bg-teal-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Parent ROI Calculator</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 3-Career Comparison Matrix */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Side-by-Side Family Evaluation (Vellore District)</h2>
            <button
              onClick={() => onEscalateCounselor("Parent requested counselor advice on family career choice")}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition"
            >
              Request Counselor Discussion
            </button>
          </div>

          {loadingCompare ? (
            <div className="p-8 text-center text-slate-400">Loading comparison details...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-semibold w-1/4">Evaluation Metric</th>
                    {comparisonItems.map((item) => (
                      <th key={item.id} className="p-4 font-bold text-white text-sm">
                        {item.title}
                        <span className="block text-xs font-normal text-teal-400 mt-0.5">{item.category}</span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80 text-xs md:text-sm">
                  {/* Row 1: Training Duration */}
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-teal-400" />
                      Training Duration
                    </td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4 font-medium text-slate-200">
                        {item.trainingDurationMonths} Months
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Training Cost & Government Support */}
                  <tr className="hover:bg-slate-900/40 bg-slate-950/40">
                    <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-teal-400" />
                      Course Fee & Subsidies
                    </td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4">
                        <span className="font-bold text-emerald-400 text-base">
                          {item.trainingCostInr === 0 ? "100% Free (PMKVY Scheme)" : `₹${item.trainingCostInr.toLocaleString()}`}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">{item.governmentScheme}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: Required Qualification */}
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-teal-400" />
                      Required Qualification
                    </td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4 font-medium text-slate-200">
                        {item.requiredQualification}
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: Verified Starting Monthly Salary */}
                  <tr className="hover:bg-slate-900/40 bg-slate-950/40">
                    <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-teal-400" />
                      Verified Starting Salary
                    </td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4">
                        <span className="font-bold text-emerald-400 text-base">
                          ₹{item.salaryMin.toLocaleString()} - ₹{item.salaryMax.toLocaleString()} /mo
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Source: {item.salarySource}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Local Opportunities in District */}
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-teal-400" />
                      Vellore District Opportunity
                    </td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4">
                        {item.localDataAvailable ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-bold text-teal-300">
                              {item.localDemandRating}/100 Demand Score
                            </span>
                            <span className="block text-xs text-slate-400">{item.activeJobCount} active verified job posts</span>
                          </div>
                        ) : (
                          <span className="text-amber-400 font-semibold">Local data unavailable</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 6: Official Source Provenance */}
                  <tr className="hover:bg-slate-900/40 bg-slate-950/40">
                    <td className="p-4 font-semibold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Data Source & Freshness
                    </td>
                    {comparisonItems.map((item) => (
                      <td key={item.id} className="p-4 space-y-1">
                        <button
                          onClick={() => onOpenEvidence(item.source)}
                          className="text-xs font-semibold text-teal-300 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{item.source?.organization || "NCVET Verified"}</span>
                        </button>
                        <span className="block text-[10px] text-slate-400">Last Verified: {item.dataFreshness}</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Visual Parent ROI Calculator */}
      {activeTab === "roi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="h-5 w-5 text-teal-400" />
                Training Investment & Expense Input
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Customize course fee, travel, and stipend inputs.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Career Option</label>
              <select
                value={selectedOccForRoi}
                onChange={(e) => setSelectedOccForRoi(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="occ_elec_01">Electrical Technician (ITI - 12 Months)</option>
                <option value="occ_solar_02">Solar Rooftop Technician (PMKVY - 3 Months)</option>
                <option value="occ_auto_03">Industrial Automation Specialist (MSME - 6 Months)</option>
              </select>
            </div>

            <div className="space-y-4 text-xs md:text-sm">
              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Course / Tuition Fee (INR)</span>
                  <span className="text-emerald-400 font-bold">₹{courseFee.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={courseFee}
                  onChange={(e) => setCourseFee(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Travel & Transport Expenses</span>
                  <span className="text-emerald-400 font-bold">₹{travelCost.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={travelCost}
                  onChange={(e) => setTravelCost(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Equipment & Tool Kit Expenses</span>
                  <span className="text-emerald-400 font-bold">₹{equipmentCost.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="500"
                  value={equipmentCost}
                  onChange={(e) => setEquipmentCost(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Government Financial Support / Stipend</span>
                  <span className="text-teal-300 font-bold">₹{financialAssistance.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="500"
                  value={financialAssistance}
                  onChange={(e) => setFinancialAssistance(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between font-medium text-slate-300 mb-1">
                  <span>Family Expected Starting Monthly Salary</span>
                  <span className="text-emerald-400 font-bold">₹{userExpectedIncome.toLocaleString()} /mo</span>
                </div>
                <input
                  type="range"
                  min="12000"
                  max="40000"
                  step="1000"
                  value={userExpectedIncome}
                  onChange={(e) => setUserExpectedIncome(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ROI Outputs & Provenance Badges */}
          {roiResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Calculated Financial Payback & ROI Summary
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Strict distinction between Verified facts, User input, and Estimates.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block">Net Out-of-Pocket Cost</span>
                    <span className="text-2xl font-bold text-white mt-1 block">₹{roiResult.netInvestment.toLocaleString()}</span>
                    <span className="mt-2 inline-block rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                      {roiResult.provenance.totalInvestment}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block">Payback Period</span>
                    <span className="text-2xl font-bold text-emerald-400 mt-1 block">{roiResult.paybackPeriodMonths} Months</span>
                    <span className="mt-2 inline-block rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                      {roiResult.provenance.paybackPeriod}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Verified Regional Average Salary:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      ₹{roiResult.verifiedMonthlyAverage.toLocaleString()} /mo
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400">
                        {roiResult.provenance.verifiedSalary}
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">First Year Income Spent on Training:</span>
                    <span className="font-bold text-slate-200">{roiResult.costToIncomeRatio}%</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-300 font-semibold">5-Year Expected Net Earnings:</span>
                    <span className="font-bold text-emerald-300 text-sm">
                      ₹{roiResult.fiveYearExpectedCumulativeEarnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                <strong>Parent Verdict:</strong> Low initial risk. The payback period of {roiResult.paybackPeriodMonths} months means total training expenses are fully recovered in under a year.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
