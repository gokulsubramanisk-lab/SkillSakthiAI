import CounselorQueue from "@/components/CounselorQueue";
import { SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function CounselorPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feature 1.3 · Proactive emotional SOS & escalation"
        title="Counsellor desk — prioritised human case management"
        subtitle="Distress and dropout risk detected during AI conversations arrive here with severity, SLA, the triggering utterance and the skill-gap prescription to discuss with the family."
      />
      <CounselorQueue />
    </div>
  );
}
