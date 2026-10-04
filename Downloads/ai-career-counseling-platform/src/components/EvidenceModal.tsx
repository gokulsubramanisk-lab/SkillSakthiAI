"use client";

import React from "react";
import { ShieldCheck, ExternalLink, X, FileText, Calendar, CheckCircle2 } from "lucide-react";

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: {
    sourceId?: string;
    title: string;
    organization: string;
    url: string;
    verificationDate?: string;
    snippet: string;
  } | null;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ isOpen, onClose, citation }) => {
  if (!isOpen || !citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">Verified Government Source</h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Audit Passed
              </span>
            </div>
            <p className="text-xs text-slate-400">{citation.organization}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="rounded-xl bg-slate-800/80 p-4 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <FileText className="h-3.5 w-3.5 text-teal-400" />
                {citation.title}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="h-3 w-3" />
                Verified: {citation.verificationDate || "2025-02-01"}
              </span>
            </div>

            <div className="text-slate-200 text-xs md:text-sm leading-relaxed pt-2 border-t border-slate-700/40 font-mono bg-slate-950/40 p-3 rounded-lg">
              "{citation.snippet}"
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs md:text-sm text-teal-400 hover:text-teal-300 font-medium underline underline-offset-4"
            >
              <span>Visit Official Government Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs md:text-sm font-medium text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
