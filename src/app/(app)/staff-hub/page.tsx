import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const categoryTone: Record<string, string> = {
  ANNOUNCEMENTS: "purple",
  QUESTIONS: "blue",
  SUGGESTIONS: "teal",
  TECHNICAL_ISSUES: "amber",
  CHALLENGES: "red",
  CLAIMS: "slate",
};

export default async function StaffHubPage() {
  const session = await requireAuth();
  await requirePermission("forum.create", session);

  const [posts, issues] = await Promise.all([
    prisma.forumPost.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 30,
      include: {
        author: { select: { name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.issue.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        creator: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Staff Hub"
        description="Internal discussions, challenges, issues and announcements."
        actions={
          <LinkButton href="/staff-hub/new">New Post</LinkButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Discussion</h2>
          <div className="space-y-3">
            {posts.length === 0 && (
              <EmptyState title="No posts yet." description="Start a discussion or share an announcement." action={<LinkButton href="/staff-hub/new" size="sm">New Post</LinkButton>} />
            )}
            {posts.map((p) => (
              <a key={p.id} href={`/staff-hub/posts/${p.id}`} className="block rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_32px_rgba(59,130,246,0.08)]">
                <div className="flex items-center gap-2">
                  <Badge tone={categoryTone[p.category] ?? "gray"}>{p.category.replace(/_/g, " ")}</Badge>
                  {p.isAnnouncement && <Badge tone="purple">Announcement</Badge>}
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{p.author.name} · {new Date(p.createdAt).toLocaleDateString()}</span>
                  <span>{p._count.comments} comment(s)</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden rounded-[28px]">
          <CardHeader
            title="Recent issues & challenges"
            action={<Link className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline" href="/staff-hub/issues">All issues</Link>}
          />
          <CardBody className="p-0">
            {issues.length === 0 ? (
              <EmptyState title="No issues." />
            ) : (
              <ul className="divide-y divide-slate-200">
                {issues.map((i) => (
                  <li key={i.id} className="px-4 py-3">
                    <a href={`/staff-hub/issues/${i.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline">
                      {i.title}
                    </a>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <Badge tone={i.priority === "CRITICAL" ? "red" : i.priority === "HIGH" ? "amber" : "slate"}>{i.priority}</Badge>
                      <span>{i.status.replace(/_/g, " ")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
