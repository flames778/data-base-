"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReportTemplate, ReportTemplateField, Report, ReportFieldValue } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form";
import { saveReport } from "@/lib/actions/reports";

type TemplateWithFields = ReportTemplate & { fields: ReportTemplateField[] };

interface Props {
  template: TemplateWithFields;
  projects: Array<{ id: string; name: string }>;
  report?: Report & { fieldValues: ReportFieldValue[] } | null;
}

export function ReportForm({ template, projects, report }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState<string>(report?.title ?? `New ${template.name}`);
  const [projectId, setProjectId] = useState<string>(report?.projectId ?? "");
  const [reportingPeriod, setReportingPeriod] = useState<string>(report?.reportingPeriod ?? "");
  const [reportingMonth, setReportingMonth] = useState<string>(report?.reportingMonth ?? "");
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const fv of report?.fieldValues ?? []) map[fv.fieldKey] = fv.value ?? "";
    return map;
  });
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: "save" | "submit") {
    setBusy(action);
    setError(null);
    const res = await saveReport({
      reportId: report?.id ?? "",
      templateId: template.id,
      title,
      projectId: projectId || null,
      reportingPeriod: reportingPeriod || null,
      reportingMonth: reportingMonth || null,
      fields,
      submit: action === "submit",
    });
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    router.push("/reports");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Field label="Report title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.length > 0 && (
          <Field label="Project (optional)">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
        )}
        {template.category === "WEEKLY" && (
          <Field label="Reporting period">
            <Input
              type="week"
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
              placeholder="e.g. 2026-W34"
            />
          </Field>
        )}
        {template.category === "MONTHLY" && (
          <Field label="Reporting month">
            <Input
              type="month"
              value={reportingMonth}
              onChange={(e) => setReportingMonth(e.target.value)}
            />
          </Field>
        )}
      </div>

      {template.fields
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((f) => (
          <div key={f.id}>
            {f.type === "TEXTAREA" ? (
              <Field label={f.label} hint={f.placeholder ?? undefined}>
                <Textarea
                  value={fields[f.key] ?? ""}
                  onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder ?? undefined}
                />
              </Field>
            ) : f.type === "DATE" ? (
              <Field label={f.label}>
                <Input
                  type="date"
                  value={fields[f.key] ?? ""}
                  onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </Field>
            ) : (
              <Field label={f.label} hint={f.placeholder ?? undefined}>
                <Input
                  value={fields[f.key] ?? ""}
                  onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder ?? undefined}
                />
              </Field>
            )}
          </div>
        ))}

      <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button variant="secondary" onClick={() => handle("save")} loading={busy === "save"}>
          Save as draft
        </Button>
        <Button onClick={() => handle("submit")} loading={busy === "submit"} disabled={!report}>
          {report ? "Submit for review" : "Save draft first"}
        </Button>
      </div>
      {!report && (
        <p className="text-right text-xs text-muted-foreground">
          Create the draft first, then fill it in and submit.
        </p>
      )}
    </div>
  );
}
