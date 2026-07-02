import { useNavigate } from "react-router-dom";
import { PageHeader, ContentSection, BulletList } from "../components/ui";
import Card from "../components/ui/Card";

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-4xl mx-auto">
      <PageHeader
        title="Terms & Conditions"
        subtitle="Last Updated: June 30, 2026"
        onBack={() => navigate(-1)}
      />

      <Card className="p-6 md:p-8 space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          By using Qkics, you agree to the following terms:
        </p>

        <ContentSection title="1. Platform Overview">
          <p className="text-sm text-muted-foreground">Qkics is a platform where users, experts, and investors can:</p>
          <BulletList items={[
            "Connect via chat and video calls",
            "Conduct paid sessions",
            "Share and discuss ideas",
            "Post in community",
          ]} />
        </ContentSection>

        <ContentSection title="2. User Roles">
          <BulletList items={[
            "Users: Seek advice or discussions",
            "Experts: Provide paid sessions",
            "Investors: Engage in opportunities",
          ]} />
          <p className="text-sm text-muted-foreground mt-3">We are not responsible for outcomes of any interaction.</p>
        </ContentSection>

        <ContentSection title="3. Payments">
          <BulletList items={[
            "All sessions may be paid",
            "Payments are processed via third-party gateways",
            "Qkics is not responsible for transaction failures caused by external providers",
          ]} />
        </ContentSection>

        <ContentSection title="4. No Guarantees">
          <BulletList items={[
            "We do not guarantee results, investments, or outcomes",
            "Advice shared by experts is their personal opinion",
          ]} />
        </ContentSection>

        <ContentSection title="5. User Conduct">
          <p className="text-sm text-muted-foreground">Users must NOT:</p>
          <BulletList items={[
            "Share illegal content",
            "Abuse or harass others",
            "Misrepresent identity",
            "Conduct fraud",
          ]} />
          <p className="text-sm text-muted-foreground mt-3">Violation may result in account suspension.</p>
        </ContentSection>

        <ContentSection title="6. Content Ownership">
          <BulletList items={[
            "Users own the content they post",
            "Qkics has the right to use content for platform improvement",
          ]} />
        </ContentSection>

        <ContentSection title="7. Session Responsibility">
          <BulletList items={[
            "Users are responsible for what they discuss/share",
            "Qkics is not liable for any financial or business decisions",
          ]} />
        </ContentSection>

        <ContentSection title="8. Account Suspension">
          <p className="text-sm text-muted-foreground">We reserve the right to:</p>
          <BulletList items={[
            "Suspend accounts",
            "Remove content",
            "Restrict access without prior notice",
          ]} />
        </ContentSection>

        <ContentSection title="9. Limitation of Liability">
          <p className="text-sm text-muted-foreground">Qkics is not liable for:</p>
          <BulletList items={[
            "Financial loss",
            "Business decisions",
            "Miscommunication between users",
          ]} />
        </ContentSection>

        <ContentSection title="10. Changes to Terms">
          <p className="text-sm text-muted-foreground leading-relaxed">We may update these terms anytime.</p>
        </ContentSection>

        <ContentSection title="11. Contact" last>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Email: [your email]</span>
          </p>
        </ContentSection>
      </Card>
    </div>
  );
}
