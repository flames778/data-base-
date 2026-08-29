import { requireAuth } from "@/lib/authz";
import { searchAll } from "@/services/search";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBox } from "@/components/search/search-box";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const session = await requireAuth();
  const { q = "", type = "all" } = await searchParams;

  let results: Record<string, unknown[]> | null = null;
  if (q.trim()) {
    results = await searchAll(session, q.trim());
  }

  const totalFound = results
    ? Object.values(results).reduce((acc, arr) => acc + arr.length, 0)
    : 0;

  return (
    <div>
      <PageHeader title="Search" description="Search across authorized records only." />
      <div className="mb-6 max-w-2xl">
        <SearchBox defaultQ={q} defaultType={type} />
      </div>

      {!q.trim() ? (
        <EmptyState title="Enter a search term." description="Search reports, projects, documents, issues, claims and discussions." />
      ) : results && totalFound === 0 ? (
        <EmptyState title="No results." description={`No matching records found for "${q}". Remember: you will only see records you are authorized to access.`} />
      ) : results ? (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">{totalFound} result(s) for &quot;{q}&quot;</p>

          {type === "all" || type === "projects" ? <Section title="Projects" icon="blue" count={(results.projects as {id:string;name:string}[]).length}><ProjectRows rows={results.projects as never} />{needEmpty(results.projects as never, "No projects found.")}</Section> : null}
          {type === "all" || type === "reports" ? <Section title="Reports" icon="green" count={(results.reports as unknown[]).length}><ReportRows rows={results.reports as never} />{needEmpty(results.reports as never, "No reports found.")}</Section> : null}
          {type === "all" || type === "documents" ? <Section title="Documents" icon="amber" count={(results.documents as unknown[]).length}><DocRows rows={results.documents as never} />{needEmpty(results.documents as never, "No documents found.")}</Section> : null}
          {type === "all" || type === "issues" ? <Section title="Issues" icon="red" count={(results.issues as unknown[]).length}><IssueRows rows={results.issues as never} />{needEmpty(results.issues as never, "No issues found.")}</Section> : null}
          {type === "all" || type === "claims" ? <Section title="Claims" icon="purple" count={(results.claims as unknown[]).length}><ClaimRows rows={results.claims as never} />{needEmpty(results.claims as never, "No claims found.")}</Section> : null}
          {type === "all" || type === "posts" ? <Section title="Discussions" icon="teal" count={(results.posts as unknown[]).length}><PostRows rows={results.posts as never} />{needEmpty(results.posts as never, "No discussions found.")}</Section> : null}
        </div>
      ) : null}
    </div>
  );
}

function needEmpty(arr: unknown[], msg: string) {
  return arr.length === 0 ? <p className="px-5 py-3 text-sm text-muted-foreground">{msg}</p> : null;
}

function Section({ title, count, children }: { title: string; icon: string; count: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold">{title}</h3>
          <Badge tone="slate">{count}</Badge>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

function ProjectRows({ rows }: { rows: Array<{ id: string; name: string; client: string | null; lead: { name: string } | null }> }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((p) => <li key={p.id} className="px-5 py-3"><a href={`/projects/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</a><p className="text-xs text-muted-foreground">Lead: {p.lead?.name ?? "—"}</p></li>)}
    </ul>
  );
}
function ReportRows({ rows }: { rows: Array<{ id: string; title: string | null; template: { name: string }; author: { name: string } }> }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => <li key={r.id} className="px-5 py-3"><a href={`/reports/${r.id}`} className="font-medium text-primary hover:underline">{r.title ?? "Untitled"}</a><p className="text-xs text-muted-foreground">{r.template.name} · {r.author.name}</p></li>)}
    </ul>
  );
}
function DocRows({ rows }: { rows: Array<{ id: string; title: string; project: { name: string } | null }> }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((d) => <li key={d.id} className="px-5 py-3"><a href={`/documents/${d.id}`} className="font-medium text-primary hover:underline">{d.title}</a><p className="text-xs text-muted-foreground">{d.project?.name ?? "General"}</p></li>)}
    </ul>
  );
}
function IssueRows({ rows }: { rows: Array<{ id: string; title: string; status: string; creator: { name: string } }> }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((i) => <li key={i.id} className="px-5 py-3"><a href={`/staff-hub/issues/${i.id}`} className="font-medium text-primary hover:underline">{i.title}</a><p className="text-xs text-muted-foreground">{i.status.replace(/_/g, " ")} · {i.creator.name}</p></li>)}
    </ul>
  );
}
function ClaimRows({ rows }: { rows: Array<{ id: string; title: string; status: string; applicant: { name: string } }> }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((c) => <li key={c.id} className="px-5 py-3"><a href={`/claims/${c.id}`} className="font-medium text-primary hover:underline">{c.title}</a><p className="text-xs text-muted-foreground">{c.status.replace(/_/g, " ")} · {c.applicant.name}</p></li>)}
    </ul>
  );
}
function PostRows({ rows }: { rows: Array<{ id: string; title: string; author: { name: string } }> }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((p) => <li key={p.id} className="px-5 py-3"><a href={`/staff-hub/posts/${p.id}`} className="font-medium text-primary hover:underline">{p.title}</a><p className="text-xs text-muted-foreground">{p.author.name}</p></li>)}
    </ul>
  );
}
