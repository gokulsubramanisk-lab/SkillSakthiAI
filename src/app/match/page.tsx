import MatchExplorer from "@/components/MatchExplorer";
import { SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function MatchPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feature 1.2 · District-level labour market vector matching"
        title="Match the student's skills to hiring pipelines in their own district"
        subtitle="Skill profiles are embedded as vectors and semantically scored against career profiles, then re-weighted by local openings, placement rate and retention — so the advice is hyper-local, not national boilerplate."
      />
      <MatchExplorer />
    </div>
  );
}
