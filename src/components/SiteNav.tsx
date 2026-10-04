"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Profile = {
  id: number;
  name: string;
  role: string;
  language: string;
  districtCode: string | null;
};

const LINKS = [
  { href: "/", label: "Overview", icon: "🏠" },
  { href: "/voice", label: "Voice Counsellor", icon: "🎙️" },
  { href: "/match", label: "District Match", icon: "📍" },
  { href: "/compare", label: "Family Compare", icon: "⚖️" },
  { href: "/parent", label: "Parent Calculator", icon: "📊" },
  { href: "/skill-gap", label: "Skill Gap → ITI", icon: "🎯" },
  { href: "/counselor", label: "Counsellor Desk", icon: "🆘" },
  { href: "/vault", label: "Gov RAG Vault", icon: "🔐" },
  { href: "/docs", label: "Docs", icon: "📚" },
];

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/session")
      .then((r) => r.json())
      .then((data: { profiles?: Profile[]; session?: { userId: number } | null }) => {
        if (!active) return;
        setProfiles(data.profiles ?? []);
        setCurrentId(data.session?.userId ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [pathname]);

  async function switchProfile(userId: number) {
    setSwitching(true);
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setCurrentId(userId);
    setSwitching(false);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-lg text-white shadow-md">
            🪔
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-tight text-slate-900">
              Kaushal Saathi
            </span>
            <span className="block text-[11px] font-medium text-slate-500">
              SIH26241 · Team 125818 SYSTRONICS
            </span>
          </span>
        </Link>

        <div className="order-3 w-full overflow-x-auto scroll-thin lg:order-2 lg:w-auto lg:flex-1">
          <nav className="flex items-center gap-1 pb-1 lg:justify-center">
            {LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="mr-1.5" aria-hidden>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="order-2 ml-auto flex items-center gap-2 lg:order-3">
          <span className="hidden text-xs font-medium text-slate-500 sm:inline">Profile</span>
          <select
            value={currentId ?? ""}
            disabled={switching || profiles.length === 0}
            onChange={(e) => switchProfile(Number(e.target.value))}
            className="max-w-[210px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-indigo-500"
          >
            {profiles.length === 0 ? <option value="">Loading…</option> : null}
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
