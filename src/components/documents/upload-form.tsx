"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form";

const CLASSIFICATIONS = ["INTERNAL", "CONFIDENTIAL", "RESTRICTED"];
const VITAL_CATEGORIES = [
  "LEGAL", "CONTRACTS", "LICENSES", "CERTIFICATIONS", "INSURANCE",
  "CORPORATE", "SENSITIVE_ENGINEERING", "POLICIES", "OTHER",
];

export function UploadForm({
  projects,
  canVital,
  storageConfigured,
}: {
  projects: Array<{ id: string; name: string }>;
  canVital: boolean;
  storageConfigured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVital, setIsVital] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/documents/upload", { method: "POST", body: fd });

    if (res.status === 501) {
      setError(
        "Object storage is not configured. Set MINIO_ACCESS_KEY, MINIO_SECRET_KEY and MINIO_ENDPOINT to enable uploads."
      );
      setBusy(false);
      return;
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }
    router.push(`/documents/${data.documentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {!storageConfigured && (
        <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Object storage not configured:</strong> document upload requires MinIO/S3
          credentials (see <code>.env.example</code> and <code>docker-compose.yml</code>). The
          database, versions and access controls are ready; enable storage to upload files.
        </div>
      )}

      <Field label="File (up to 25 MB)">
        <Input type="file" name="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpeg,.jpg" />
      </Field>
      <Field label="Title">
        <Input name="title" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Input name="category" placeholder="e.g. Contracts, Reports, Manuals" />
        </Field>
        <Field label="Project (optional)">
          <Select name="projectId">
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Classification">
          <Select name="classification" defaultValue="INTERNAL">
            {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Vital document">
          <Select
            name="isVital"
            value={isVital ? "true" : "false"}
            onChange={(e) => setIsVital(e.target.value === "true")}
            disabled={!canVital}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </Select>
        </Field>
      </div>
      {isVital && (
        <Field label="Vital category">
          <Select name="vitalCategory">
            {VITAL_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Description">
        <Textarea name="description" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={busy}>Upload document</Button>
      </div>
    </form>
  );
}
