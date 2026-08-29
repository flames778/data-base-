import { Badge } from "@/components/ui/badge";

interface DocRow {
  id: string;
  title: string;
  category: string | null;
  classification: string;
  isVital: boolean;
  version: number;
  fileSize: number;
  updatedAt: Date;
  uploader: { name: string };
  project: { name: string } | null;
}

const classificationTone: Record<string, string> = {
  INTERNAL: "slate",
  CONFIDENTIAL: "amber",
  RESTRICTED: "red",
};

export function DocumentList({ docs }: { docs: DocRow[] }) {
  if (docs.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="px-5 py-3 font-medium">Document</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Project</th>
            <th className="px-5 py-3 font-medium">Classification</th>
            <th className="px-5 py-3 font-medium">Version</th>
            <th className="px-5 py-3 font-medium">Uploaded</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {docs.map((d) => (
            <tr key={d.id} className="hover:bg-zinc-50">
              <td className="px-5 py-3">
                <a href={`/documents/${d.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                  <svg className="h-4 w-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 7V3.5L18.5 9H13zm-4 4h6v2H9v-2zm0 4h6v2H9v-2z" /></svg>
                  {d.title}
                </a>
                {d.isVital && <span className="ml-1"><Badge tone="purple">Vital</Badge></span>}
              </td>
              <td className="px-5 py-3 text-muted-foreground">{d.category ?? "—"}</td>
              <td className="px-5 py-3 text-muted-foreground">{d.project?.name ?? "—"}</td>
              <td className="px-5 py-3">
                <Badge tone={classificationTone[d.classification] ?? "slate"}>{d.classification}</Badge>
              </td>
              <td className="px-5 py-3">v{d.version}</td>
              <td className="px-5 py-3 text-muted-foreground">
                {d.uploader.name} · {new Date(d.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
