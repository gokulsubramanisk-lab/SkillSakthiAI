import { Suspense } from "react";
import ParentCalculator from "@/components/ParentCalculator";
import { SectionTitle, Spinner } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ParentPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Feature 1.4 / 1.9 · The Parent Calculator"
        title="Proof, not promises: what this course costs and what it returns"
        subtitle="Hard local labour metrics — government support, break-even months, five-year salary growth and employment safety — presented for the parent who is afraid of wasting the family's money."
      />
      <Suspense fallback={<Spinner label="Loading calculator…" />}>
        <ParentCalculator />
      </Suspense>
    </div>
  );
}
