import VoiceConsole from "@/components/VoiceConsole";
import { SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function VoicePage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feature 1.1 / 1.6 · Voice-first Indic AI"
        title="Speak naturally — no reading, no typing, no literacy barrier"
        subtitle="Speech is transcribed in the family's own language, answered strictly from verified MSDE/NSDC records, read back aloud, and continuously monitored for emotional distress."
      />
      <VoiceConsole />
    </div>
  );
}
