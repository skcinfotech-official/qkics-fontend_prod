import { MdFeed } from "react-icons/md";
import { PageHeader, EmptyState } from "../../components/ui";

export default function AdminPosts() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MdFeed />}
        title="Posts Management"
        subtitle="Moderate community feed posts"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Posts" }]}
      />
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <EmptyState
          icon={<MdFeed />}
          title="Coming Soon"
          description="Post moderation tools are under construction and will appear here."
        />
      </div>
    </div>
  );
}
