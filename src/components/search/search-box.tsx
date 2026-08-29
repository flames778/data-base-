"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const TYPES = ["all", "reports", "projects", "documents", "issues", "claims", "posts"];

export function SearchBox({ defaultQ, defaultType }: { defaultQ: string; defaultType: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [type, setType] = useState(defaultType);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search reports, projects, documents, issues..."
        className="flex-1"
      />
      <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-40">
        {TYPES.map((t) => (
          <option key={t} value={t}>{t === "all" ? "All" : t}</option>
        ))}
      </Select>
      <Button type="submit">Search</Button>
    </form>
  );
}
