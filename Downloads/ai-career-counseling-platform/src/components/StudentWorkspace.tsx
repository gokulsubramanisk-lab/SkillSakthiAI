"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  GraduationCap,
  MapPin,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  BarChart2,
  ChevronRight,
  Sparkles,
  BookOpen,
  Target,
  IndianRupee,
  Layers,
  Award,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface StudentWorkspaceProps {
  userProfile: any;
  onUpdateProfile: (updated: any) => void;
  savedCareers: any[];
  onCompareCareers: (occupationIds: string[]) => void;
  onSaveCareer: (occId: string) => void;
  onRemoveSavedCareer: (occId: string) => void;
  onOpenSkillGap: (occId: string) => void;
}

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({
  userProfile,
  onUpdateProfile,
  savedCareers,
  onCompareCareers,
  onSaveCareer,
  onRemoveSavedCareer,
  onOpenSkillGap,
}) => {
  const [activeTab, setActiveTab] = useState<"recommendations" | "profile" | "skills" | "saved">("recommendations");
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const [skills, setSkills] = useState<string[]>(userProfile?.skills || ["Basic Electronics", "Electrical Fundamentals"]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [district, setDistrict] = useState(userProfile?.district || "Vellore");
  const [education, setEducation] = useState(userProfile?.education || "12th Completed");

  useEffect(() => {
    fetchMatches();
  }, [district, education, skills]);

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await fetch("/api/careers/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          education,
          district,
          state: "Tamil Nadu",
        }),
      });
      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches);
      }
    } catch (e) {
      console.error("Failed to fetch matches:", e);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      const updated = [...skills, newSkillInput.trim()];
      setSkills(updated);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-8 space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Student Career Workspace</h1>
            <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 text-xs text-teal-300 font-semibold">
              Vellore District Cluster
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Personalized career match, skill-gap analysis, and NCVET verified training pathways.
          </p>
        </div>

        {/* Workspace Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === "recommendations" ? "bg-teal-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Recommendations
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === "profile" ? "bg-teal-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Profile & Skills
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
              activeTab === "saved" ? "bg-teal-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Saved Plans ({savedCareers.length})
          </button>
        </div>
      </div>

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400" />
              Evidence-Backed Career Matches for {district}
            </h2>
            {matches.length >= 3 && (
              <button
                onClick={() => onCompareCareers(matches.slice(0, 3).map((m) => m.occupation.id))}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-xs md:text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 hover:from-teal-400 transition"
              >
                <BarChart2 className="h-4 w-4" />
                <span>Compare Top 3 in Family Space</span>
              </button>
            )}
          </div>

          {loadingMatches ? (
            <div className="p-8 text-center text-slate-400">Computing local labor market match score...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((item) => {
                const occ = item.occupation;
                const isSaved = savedCareers.some((s) => s.id === occ.id);

                return (
                  <div
                    key={occ.id}
                    className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 hover:border-slate-700 transition shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header & Match Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{occ.category}</span>
                          <h3 className="text-xl font-bold text-white mt-0.5">{occ.title}</h3>
                        </div>

                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 rounded-xl bg-teal-500/20 px-3 py-1 text-sm font-bold text-teal-300 border border-teal-500/30">
                            <span>{item.overallMatchScore}% Match</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Skill & Location Weighted</p>
                        </div>
                      </div>

                      <p className="text-xs md:text-sm text-slate-300 line-clamp-2 mt-3">{occ.description}</p>

                      {/* Verified Details Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-4 text-xs">
                        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                          <span className="text-slate-400 block text-[11px]">Qualification</span>
                          <span className="font-semibold text-slate-200 mt-0.5 block">{occ.requiredQualification}</span>
                        </div>

                        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
                          <span className="text-slate-400 block text-[11px]">Verified Monthly Salary</span>
                          <span className="font-semibold text-emerald-400 mt-0.5 block">
                            ₹{occ.salaryMin.toLocaleString()} - ₹{occ.salaryMax.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Why Recommended bullet points */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Why Recommended:</span>
                        {item.whyRecommended.map((reason: string, rIdx: number) => (
                          <div key={rIdx} className="flex items-start space-x-2 text-xs text-slate-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenSkillGap(occ.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition text-center"
                      >
                        Skill Gap Analysis
                      </button>

                      <button
                        onClick={() => (isSaved ? onRemoveSavedCareer(occ.id) : onSaveCareer(occ.id))}
                        className={`p-2.5 rounded-xl border transition ${
                          isSaved
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                        }`}
                        title={isSaved ? "Saved" : "Save Career Plan"}
                      >
                        <Bookmark className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Profile & Skills Tab */}
      {activeTab === "profile" && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-teal-400" />
            Natural Student Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">District / Location</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Vellore">Vellore (Tamil Nadu)</option>
                <option value="Chennai">Chennai (Tamil Nadu)</option>
                <option value="Coimbatore">Coimbatore (Tamil Nadu)</option>
                <option value="Madurai">Madurai (Tamil Nadu)</option>
                <option value="Pune">Pune (Maharashtra)</option>
                <option value="Bengaluru">Bengaluru (Karnataka)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Education Level</label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="12th Completed">12th Pass</option>
                <option value="10th Completed">10th Pass</option>
                <option value="ITI / Diploma">ITI Trade / Diploma</option>
              </select>
            </div>
          </div>

          {/* Skill Tag Manager */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase">My Current Competencies / Skills</label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300 border border-teal-500/30"
                >
                  <span>{s}</span>
                  <button onClick={() => handleRemoveSkill(s)} className="text-teal-400 hover:text-white">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex space-x-2 pt-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add skill (e.g. Soldering, Motor Control)..."
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
              />
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Plans Tab */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Saved Career Plans</h2>
          {savedCareers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
              No saved careers yet. Click the bookmark icon on any recommendation card to save it.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedCareers.map((item) => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.category} • ₹{item.salaryMin} - ₹{item.salaryMax}/mo</p>
                  </div>
                  <button
                    onClick={() => onRemoveSavedCareer(item.id)}
                    className="p-2 text-red-400 hover:bg-slate-800 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
