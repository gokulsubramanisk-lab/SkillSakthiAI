"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  MessageSquare,
  Send,
  ShieldCheck,
  ChevronRight,
  Filter,
  FileText,
} from "lucide-react";

interface CounselorDashboardProps {
  counselorUser: any;
}

export const CounselorDashboard: React.FC<CounselorDashboardProps> = ({ counselorUser }) => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [noteText, setNoteText] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("IN_PROGRESS");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/counselor/cases");
      const data = await res.json();
      if (data.cases) {
        setCases(data.cases);
        if (data.cases.length > 0 && !selectedCase) {
          setSelectedCase(data.cases[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch counselor cases:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      const res = await fetch(`/api/counselor/cases/${selectedCase.id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteText,
          status: statusUpdate,
          counselorName: counselorUser?.name || "Dr. Ananya Sharma",
        }),
      });

      if (res.ok) {
        setNoteText("");
        fetchCases();
        alert("Counselor case notes and status updated successfully.");
      }
    } catch (e) {
      console.error("Error adding note:", e);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterPriority === "ALL") return true;
    return c.priority === filterPriority;
  });

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Certified Counselor Case Management</h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Human-in-the-Loop Active
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Review escalated career anxiety cases, unverified queries, and student requests for professional intervention.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs md:text-sm text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">URGENT Priority</option>
            <option value="HIGH">HIGH Priority</option>
            <option value="MEDIUM">MEDIUM Priority</option>
            <option value="LOW">LOW Priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading counselor cases...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Case List Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Escalated Queue ({filteredCases.length})</h3>

            {filteredCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              const isUrgent = c.priority === "URGENT";
              const isHigh = c.priority === "HIGH";

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? "bg-slate-800 border-teal-500/50 shadow-md"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white">{c.studentName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isUrgent
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : isHigh
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-teal-500/20 text-teal-300"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">{c.reason}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                    <span>District: {c.studentDistrict}</span>
                    <span className="font-semibold text-teal-400">{c.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Case View */}
          {selectedCase && (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-white">{selectedCase.studentName}</h2>
                    <span className="text-xs text-slate-400">({selectedCase.studentEducation} • {selectedCase.studentDistrict})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Case ID: {selectedCase.id}</p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Status: {selectedCase.status}
                  </span>
                </div>
              </div>

              {/* Case Summary & Detected Concern */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Detected Emotion / Concern</span>
                  <p className="text-slate-200 font-medium">{selectedCase.detectedConcern}</p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Escalation Trigger Reason</span>
                  <p className="text-slate-200 font-medium">{selectedCase.reason}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Conversation Context Summary</span>
                <p className="text-slate-200 text-xs md:text-sm leading-relaxed">{selectedCase.conversationSummary}</p>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-400" />
                  Counselor Recommendation & Action Notes
                </h4>

                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type guidance advice, call notes, or referral instructions for the student..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs md:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-400">Update Status:</span>
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="WAITING_FOR_USER">WAITING FOR USER</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2 text-xs md:text-sm font-bold text-slate-950 shadow hover:from-teal-400 transition"
                  >
                    <Send className="h-4 w-4" />
                    <span>Save Note & Notify Student</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
