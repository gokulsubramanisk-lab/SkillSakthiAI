import VaultBrowser from "@/components/VaultBrowser";
import { SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function VaultPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feature 1.5 / 1.8 · Hallucination-free government RAG vault"
        title="Every fact the AI may use — open for inspection and audit"
        subtitle="Generation is locked to this vault of MSDE, NSDC, DGT and NCVET records. Queries that fall below the retrieval floor are refused and escalated to a human counsellor."
      />
      <VaultBrowser />
    </div>
  );
}
