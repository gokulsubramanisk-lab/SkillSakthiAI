import CompareBoard from "@/components/CompareBoard";
import { SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feature 1.7 · Family comparison screen"
        title="Three career paths, side by side, in one shared family space"
        subtitle="Evaluate financial cost, completion duration and projected salary growth together — the student and the parents looking at the same verified numbers."
      />
      <CompareBoard />
    </div>
  );
}
