"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { NavLink } from "@/lib/nav";
import { useState } from "react";

const icons: Record<string, string> = {
  "/dashboard": "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  "/reports": "M12 20.58c-2.5 0-4.5-2-4.5-4.5v-1.08H6.25a2.25 2.25 0 010-4.5H7.5v-1.5H5.25a2.25 2.25 0 010-4.5H7.5V7.5h9.5v2.75h2.75a.55.55 0 01.55.55.45.45 0 01-.55.45h-2.75v1.5H7.5v1.5h9V7.5H8.5v10.5c0 1.65 1.35 3 3 3 1.1 0 2-.6 2.4-1.5H15c-.5 2-2.3 3.58-3 3.58z",
  "/projects": "M3.75 3A1.75 1.75 0 002 4.75v14.5c0 .97.78 1.75 1.75 1.75h16.5A1.75 1.75 0 0022 19.25V4.75A1.75 1.75 0 0020.25 3H3.75zm0 1.5h16.5c.14 0 .25.11.25.25v14.5c0 .14-.11.25-.25.25H3.75a.25.25 0 01-.25-.25V4.75c0-.14.11-.25.25-.25zM6 7v1.5h4V7H6zm7 0v1.5h4V7h-4zM6 10.5V12h10.5v-1.5H6z",
  "/documents": "M12 3a1.75 1.75 0 00-1.75 1.75v7.4L8.7 11.34a1.75 1.75 0 00-2.47 2.47l4 4a1.75 1.75 0 002.47 0l4-4a1.75 1.75 0 00-2.47-2.47l-1.55 1.8V4.75A1.75 1.75 0 0012 3zm-4 14v1.25c0 .69.56 1.25 1.25 1.25h5.5c.69 0 1.25-.56 1.25-1.25V17H8z",
  "/staff-hub": "M12 12a5 5 0 100-10 5 5 0 000 10zm0 1.5c-3.35 0-8 1.68-8 5V21h16v-2.5c0-3.32-4.65-5-8-5z",
  "/claims": "M12 2a1.25 1.25 0 00-1.25 1.25V4.1a8.25 8.25 0 00-6.9 8.15c0 1.46.38 2.83 1.05 4.02l-1.04 1.03A1.25 1.25 0 002.9 19.6h2.2A10.7 10.7 0 0010.75 21.5V22a1.25 1.25 0 002.5 0v-.5c1.4-.2 2.7-.7 3.85-1.27l-1.87-1.07c-.95.5-2.08.85-3.23.85A5.75 5.75 0 017.25 12c0-2.1 1.1-3.94 2.75-4.97V5.5H8.5a1.25 1.25 0 110-2.5h3.75V2A1.25 1.25 0 0012 2zm5.25 1.3c-.5-.3-.95-.5-1.4-.7.16.62.28 1.24.35 1.87l1.05-.67v-.5zM14.5 4.8v2.1c.87.4 1.64.95 2.28 1.6l1.5-1.5a8.5 8.5 0 00-3.78-2.2z",
  "/employees": "M12 12a5 5 0 100-10 5 5 0 000 10zm7.5 8v-1.5A4.5 4.5 0 0015 14H9a4.5 4.5 0 00-4.5 4.5V20h15z",
  "/audit": "M10 2a8 8 0 105.3 14.13l4.28 4.28 1.7-1.7-4.28-4.28A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12zm.5 2v5l4 2.4-.75 1.3-4.75-2.85V6h1.5z",
  "/admin": "M12 2 3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm1 8.5V17h-2v-1h-1.5v-2H11v-3l-1.5.75-.75-1.5 2-1a1 1 0 011 1.25h.75zm2.5-.5-1.5 3h-2l1.5-3h2z",
  "/search": "M10.5 3a7.5 7.5 0 014.76 13.22l4.26 4.26-1.06 1.06-4.26-4.26A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z",
};

function NavIcon({ href }: { href: string }) {
  const key = Object.keys(icons).find(
    (k) => href === k || href.startsWith(k + "/")
  ) ?? "/dashboard";
  const d = icons[key];
  if (!d) return null;
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 22 22" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function SidebarNav({
  links,
  userName,
  userRole,
  unreadCount,
}: {
  links: NavLink[];
  userName: string;
  userRole: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (l: NavLink) =>
    l.match.some((m) => pathname === m || pathname.startsWith(m + "/"));

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            isActive(l)
              ? "bg-primary text-primary-foreground"
              : "text-zinc-700 hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <NavIcon href={l.href} />
          <span className="flex-1">{l.label}</span>
          {l.href === "/search" && unreadCount > 0 ? null : null}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">PP</span>
          <span>Prec Pearl</span>
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-border p-2 text-foreground"
          aria-label="Toggle navigation"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            {nav}
            <div className="border-t border-border p-4">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-primary text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v3H3zM3 10h10v2H3zM3 14h18v3H3zM13 14h8v3h-8z"/></svg>
          </span>
          <div>
            <p className="text-sm font-bold text-primary">Prec Pearl</p>
            <p className="text-[11px] text-muted-foreground">Internal Operations</p>
          </div>
        </div>
        {nav}
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {userRole.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>
      </aside>
    </>
  );
}
