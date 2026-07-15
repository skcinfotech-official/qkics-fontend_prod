import { useNavigate } from "react-router-dom";
import { PageHeader, ContentSection, BulletList } from "../components/ui";
import Card from "../components/ui/Card";

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-4xl mx-auto">
      <PageHeader
        breadcrumb={[{ label: "Refund & Cancellation" }]}
        title="Refund & Cancellation Policy"
        subtitle="Last Updated: June 30, 2026"
        onBack={() => navigate(-1)}
      />

      <Card className="p-6 md:p-8 space-y-8">
        <ContentSection title="1. Paid Sessions">
          <BulletList items={[
            "Payments made for sessions are generally non-refundable",
            "Refunds may be considered only in specific cases",
          ]} />
        </ContentSection>

        <ContentSection title="2. Eligible Refund Cases">
          <p className="text-sm text-muted-foreground">Refund may be provided if:</p>
          <BulletList items={[
            "Session was not conducted due to expert absence",
            "Technical failure from platform side",
            "Duplicate payment",
          ]} />
        </ContentSection>

        <ContentSection title="3. Non-Refundable Cases">
          <BulletList items={[
            "Change of mind",
            "Dissatisfaction with advice",
            "Missed session by user",
          ]} />
        </ContentSection>

        <ContentSection title="4. Cancellation Policy">
          <BulletList items={[
            "Users must cancel before session start time",
            "Late cancellations may not be eligible for refund",
          ]} />
        </ContentSection>

        <ContentSection title="5. Processing Time">
          <BulletList items={["Approved refunds will be processed within 5\u201310 business days"]} />
        </ContentSection>

        <ContentSection title="6. Contact" last>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Email: kalyaniinfotech2000@gmail.com</span>
          </p>
        </ContentSection>
      </Card>
    </div>
  );
}
