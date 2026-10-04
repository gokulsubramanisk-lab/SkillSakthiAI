import { Suspense } from "react";
import SkillGapPanel from "@/components/SkillGapPanel";
import { SectionTitle, Spinner } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function SkillGapPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feature 1.10 · Skill-gap diagnostics"
        title="Exactly which local ITI module closes the gap"
        subtitle="Current competencies are mapped onto NSQF levels, the missing competencies are isolated, and the precise government training module available in the student's district is prescribed."
      />
      <Suspense fallback={<Spinner label="Loading diagnostics…" />}>
        <SkillGapPanel />
      </Suspense>
    </div>
  );
}
