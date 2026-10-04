"use client";

import React from "react";
import { User, ShieldCheck, X, Check, Flame, Users, Headphones, GraduationCap, Compass } from "lucide-react";

interface DemoSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (user: any, activeTab: string) => void;
  currentUserId: string;
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
  currentUserId,
}) => {
  if (!isOpen) return null;

  const demoAccounts = [
    {
      id: "usr_student_01",
      name: "Ramesh Kumar",
      role: "student",
      tab: "chat",
      language: "ta",
      badge: "Sample Student Profile",
      desc: "19 yr old, completed 12th, electrical/electronics interest, Vellore district, budget-conscious.",
      icon: GraduationCap,
    },
    {
      id: "usr_parent_01",
      name: "Sundar Kumar (Parent)",
      role: "parent",
      tab: "parent",
      language: "ta",
      badge: "Parent Profile",
      desc: "Parent evaluating course duration, course fee, verified starting salary, and ROI calculator.",
      icon: Users,
    },
    {
      id: "usr_counselor_01",
      name: "Dr. Ananya Sharma",
      role: "counselor",
      tab: "counselor",
      language: "en",
      badge: "Certified Counselor",
      desc: "Vocational Counselor managing student distress escalations and action guidance notes.",
      icon: Headphones,
    },
    {
      id: "usr_admin_01",
      name: "System Admin",
      role: "admin",
      tab: "admin",
      language: "en",
      badge: "System Admin",
      desc: "Auditor for RAG precision, source ingestion, document chunks, and claim validation.",
      icon: Compass,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Instant Demo Account Switcher</h3>
            <p className="text-xs text-slate-400">Switch user roles and test end-to-end user journeys without password prompts.</p>
          </div>
        </div>

        <div className="space-y-3">
          {demoAccounts.map((acc) => {
            const Icon = acc.icon;
            const isCurrent = acc.id === currentUserId;

            return (
              <div
                key={acc.id}
                onClick={() => {
                  onSelectProfile(acc, acc.tab);
                  onClose();
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-slate-800 border-teal-500/50 shadow-md ring-1 ring-teal-500/30"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm md:text-base">{acc.name}</span>
                        {isCurrent && <Check className="h-4 w-4 text-teal-400" />}
                      </div>
                      <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">{acc.badge}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 pl-12">{acc.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500">
            Demo Mode strictly separates verified government production data from sample input scenarios.
          </p>
        </div>
      </div>
    </div>
  );
};
