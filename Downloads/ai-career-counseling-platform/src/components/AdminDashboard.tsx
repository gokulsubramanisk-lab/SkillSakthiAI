"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  BarChart3,
  FileText,
  Clock,
  ExternalLink,
  Activity,
  Layers,
  Search,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resAnal, resSrc] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch("/api/rag/sources"),
      ]);

      const dataAnal = await resAnal.json();
      const dataSrc = await resSrc.json();

      if (dataAnal.analytics) setAnalytics(dataAnal.analytics);
      if (dataSrc.sources) setSources(dataSrc.sources);
    } catch (e) {
      console.error("Admin data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-8 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin & RAG Grounding Control</h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              Health: OPTIMAL
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Audit AI query logs, ground truth source provenance, document index status, and RAG evaluation metrics.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading admin analytics & sources...</div>
      ) : (
        <div className="space-y-8">
          {/* Quality Metrics Grid */}
          {analytics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Retrieval Precision</span>
                <span className="text-2xl font-extrabold text-teal-300 block">{analytics.ragPrecision}%</span>
                <span className="text-[10px] text-slate-500">Semantic & Keyword Hybrid</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Citation Accuracy</span>
                <span className="text-2xl font-extrabold text-emerald-400 block">{analytics.citationAccuracy}%</span>
                <span className="text-[10px] text-slate-500">Claim Validation Engine</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Groundedness Score</span>
                <span className="text-2xl font-extrabold text-white block">{analytics.groundednessScore}%</span>
                <span className="text-[10px] text-slate-500">Zero Hallucination Guard</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Fallback Trigger Rate</span>
                <span className="text-2xl font-extrabold text-amber-400 block">{analytics.fallbackRate}</span>
                <span className="text-[10px] text-slate-500">Safe Evidence Protection</span>
              </div>
            </div>
          )}

          {/* Trusted Sources Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-400" />
              Trusted Government Knowledge Sources
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                    <th className="py-3 px-4 font-semibold">Source Code</th>
                    <th className="py-3 px-4 font-semibold">Organization</th>
                    <th className="py-3 px-4 font-semibold">Title</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs md:text-sm">
                  {sources.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-teal-300">{s.sourceCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{s.organization}</td>
                      <td className="py-3 px-4 text-slate-300">{s.title}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 font-semibold border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          {s.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{s.retrievedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
