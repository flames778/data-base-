"use client";

import { useState } from "react";
import Link from "next/link";

interface N {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationsBell({
  initialCount,
  notifications,
}: {
  initialCount: number;
  notifications: N[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md border border-border bg-white p-2 text-foreground hover:bg-zinc-50"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.8 23.8 0 005.454-1.31A8.97 8.97 0 0118 9.75v-.7A6 6 0 006 9v.75a8.97 8.97 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {initialCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
            {initialCount > 99 ? "99+" : initialCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <a href="/notifications" className="text-xs text-primary hover:underline">
                View all
              </a>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No notifications.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((n) => (
                    <li key={n.id} className={n.read ? "" : "bg-accent/40"}>
                      <Link
                        href={n.link ?? "/notifications"}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 hover:bg-zinc-50"
                      >
                        <p className="text-sm font-medium leading-snug">
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.message}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
