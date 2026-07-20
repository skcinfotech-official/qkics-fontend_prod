import { FaTerminal } from "react-icons/fa";
import { PageHeader, EmptyState } from "../../components/ui";

export default function SystemLogs() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaTerminal />}
        title="System Logs"
        subtitle="Audit trail and system activity"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Logs" }]}
      />
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <EmptyState
          icon={<FaTerminal />}
          title="Coming Soon"
          description="System log streaming is under construction and will appear here."
        />
      </div>
    </div>
  );
}
