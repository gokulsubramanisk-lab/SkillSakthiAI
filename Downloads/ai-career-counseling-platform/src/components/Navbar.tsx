"use client";

import React, { useState } from "react";
import {
  Mic,
  Globe,
  User,
  ShieldCheck,
  Bell,
  Sparkles,
  BarChart3,
  BookOpen,
  Headphones,
  Settings,
  Flame,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { SUPPORTED_LANGUAGES, getLanguageInfo } from "@/lib/voice/speech";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedLanguage: string;
  setLanguage: (lang: string) => void;
  currentUser: any;
  setCurrentUser: (user: any) => void;
  notificationsCount: number;
  openDemoModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedLanguage,
  setLanguage,
  currentUser,
  notificationsCount,
  openDemoModal,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const currentLang = getLanguageInfo(selectedLanguage);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-md text-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("chat")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-100 tracking-tight">Career Saathi</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                RAG Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI Career Counselling & Family Decision Support</p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "chat"
                ? "bg-teal-500 text-slate-950 font-semibold shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab("student")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "student"
                ? "bg-teal-500 text-slate-950 font-semibold shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Student Mode</span>
          </button>

          <button
            onClick={() => setActiveTab("parent")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "parent"
                ? "bg-teal-500 text-slate-950 font-semibold shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Parent Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("counselor")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "counselor"
                ? "bg-teal-500 text-slate-950 font-semibold shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Headphones className="h-4 w-4" />
            <span>Counselor</span>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "admin"
                ? "bg-teal-500 text-slate-950 font-semibold shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Admin RAG</span>
          </button>
        </nav>

        {/* Right Tools & Profile Switcher */}
        <div className="flex items-center space-x-3">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs md:text-sm font-medium text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
              title="Select Language"
            >
              <Globe className="h-4 w-4 text-teal-400" />
              <span>{currentLang.nativeName}</span>
              <span className="text-[10px] text-slate-400 uppercase">({currentLang.code})</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl z-50 p-1 py-1 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Voice & AI Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs md:text-sm text-left rounded-lg transition ${
                      selectedLanguage === lang.code
                        ? "bg-teal-500/20 text-teal-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-700/60"
                    }`}
                  >
                    <span>{lang.nativeName} ({lang.name})</span>
                    {selectedLanguage === lang.code && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Demo Profile Account Switcher Badge */}
          <button
            onClick={openDemoModal}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30 px-3 py-1.5 text-xs md:text-sm text-teal-200 hover:border-teal-400 transition"
          >
            <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline font-medium">
              Demo Account: <strong className="text-white">{currentUser?.name || "Ramesh Kumar"}</strong>
            </span>
            <span className="sm:hidden font-medium">Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
