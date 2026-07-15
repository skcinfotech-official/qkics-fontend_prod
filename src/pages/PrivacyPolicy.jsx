import { useNavigate } from "react-router-dom";
import { PageHeader, ContentSection, BulletList } from "../components/ui";
import Card from "../components/ui/Card";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-4xl mx-auto">
      <PageHeader
        breadcrumb={[{ label: "Privacy Policy" }]}
        title="Privacy Policy"
        subtitle="Last Updated: June 30, 2026"
        onBack={() => navigate(-1)}
      />

      <Card className="p-6 md:p-8 space-y-8">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Welcome to Qkics. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
        </p>

        <ContentSection title="1. Information We Collect">
          <p className="text-sm text-muted-foreground">We may collect the following types of information:</p>
          <div className="ml-4 mt-3">
            <h3 className="text-base font-semibold text-foreground mb-2">1.1 Personal Information</h3>
            <BulletList items={["Name", "Email Address", "Phone Number", "Profile Details"]} />
          </div>
          <div className="ml-4 mt-3">
            <h3 className="text-base font-semibold text-foreground mb-2">1.2 Usage Data</h3>
            <BulletList items={["Chat and communication data", "Session history", "Platform activity"]} />
          </div>
          <div className="ml-4 mt-3">
            <h3 className="text-base font-semibold text-foreground mb-2">1.3 Payment Information</h3>
            <BulletList items={["Payment details are processed via third-party payment gateways (e.g., PayU)", "We do not store card or sensitive financial data"]} />
          </div>
        </ContentSection>

        <ContentSection title="2. How We Use Your Information">
          <p className="text-sm text-muted-foreground">We use your data to:</p>
          <BulletList items={["Provide and improve our services", "Enable chat, video calls, and sessions", "Process payments", "Connect users with experts/investors", "Ensure platform security"]} />
        </ContentSection>

        <ContentSection title="3. Communication & Data Sharing">
          <BulletList items={["Users may interact with others via chat or video calls", "Information shared during sessions is at your own discretion", "We do not sell your personal data"]} />
          <p className="text-sm text-muted-foreground mt-3">We may share data with:</p>
          <BulletList items={["Payment partners", "Legal authorities (if required)"]} />
        </ContentSection>

        <ContentSection title="4. Data Security">
          <p className="text-sm text-muted-foreground leading-relaxed">We implement industry-standard security measures to protect your data. However, no system is 100% secure.</p>
        </ContentSection>

        <ContentSection title="5. Cookies">
          <p className="text-sm text-muted-foreground leading-relaxed">We may use cookies to improve user experience and track usage.</p>
        </ContentSection>

        <ContentSection title="6. User Rights">
          <BulletList items={["Access your data", "Request deletion of your account", "Update your profile information"]} />
        </ContentSection>

        <ContentSection title="7. Third-Party Services">
          <p className="text-sm text-muted-foreground">We use third-party services for:</p>
          <BulletList items={["Payments", "Analytics", "Communication"]} />
          <p className="text-sm text-muted-foreground mt-3">We are not responsible for their privacy practices.</p>
        </ContentSection>

        <ContentSection title="8. Changes to Policy">
          <p className="text-sm text-muted-foreground leading-relaxed">We may update this policy from time to time. Continued use of the platform means acceptance.</p>
        </ContentSection>

        <ContentSection title="9. Contact Us" last>
          <p className="text-sm text-muted-foreground">For any questions: <span className="font-semibold text-foreground">Email: kalyaniinfotech2000@gmail.com</span></p>
        </ContentSection>
      </Card>
    </div>
  );
}
