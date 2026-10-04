import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaushal Saathi — AI Career Counselling & Family Decision Support (SIH26241)",
  description:
    "Voice-first, Indic-language career counselling for vocational education with district labour-market matching, family ROI calculator, emotional SOS escalation and a zero-hallucination MSDE/NSDC RAG vault.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-900 antialiased">
        <SiteNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-slate-200/70 bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500">
            <p className="font-semibold text-slate-700">
              Kaushal Saathi · AI-Enabled Career Counselling and Family Decision-Support Platform
              for Vocational Education
            </p>
            <p className="mt-1">
              Problem Statement SIH26241 · Smart Education · Software · Team 125818 — SYSTRONICS.
              All generative answers are locked to verified MSDE / NSDC / DGT / NCVET sources;
              unverifiable queries are routed to human counsellors.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
