"use client";

import Link from "next/link";
import { useState } from "react";

import type { InviteStatus } from "@/lib/invite/invite";

type SortColumn = "names" | "guestCount" | "status" | "events";
type SortDirection = "asc" | "desc";

const STATUS_ORDER: Record<InviteStatus, number> = {
  not_sent: 0,
  awaiting: 1,
  responded: 2,
  declined: 3,
};

const statusBadge: Record<InviteStatus, { label: string; className: string }> = {
  not_sent: {
    label: "Not sent",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  awaiting: {
    label: "Awaiting",
    className: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  },
  responded: {
    label: "Responded",
    className: "bg-green-50 text-green-800 border border-green-200",
  },
  declined: {
    label: "Declined",
    className: "bg-red-50 text-red-800 border border-red-200",
  },
};

export type InviteRow = {
  id: string;
  guestNames: string[];
  activeGuestCount: number;
  eventTitles: string[];
  status: InviteStatus;
};

function SortIndicator({ column, sortColumn, sortDirection }: { column: SortColumn; sortColumn: SortColumn; sortDirection: SortDirection }) {
  if (column !== sortColumn) {
    return <span className="ml-1 opacity-30">↕</span>;
  }
  return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
}

function sortInvites(invites: InviteRow[], column: SortColumn, direction: SortDirection): InviteRow[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...invites].sort((a, b) => {
    switch (column) {
      case "names":
        return multiplier * a.guestNames.join(", ").localeCompare(b.guestNames.join(", "));
      case "guestCount":
        return multiplier * (a.activeGuestCount - b.activeGuestCount);
      case "status":
        return multiplier * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      case "events":
        return multiplier * a.eventTitles.join(", ").localeCompare(b.eventTitles.join(", "));
    }
  });
}

export function SortableInvitesTable({ invites }: { invites: InviteRow[] }) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("names");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const sorted = sortInvites(invites, sortColumn, sortDirection);

  const thClass = "py-2 cursor-pointer select-none hover:text-[color:var(--color-ink)] transition-colors";

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead className="border-b border-[color:var(--color-ink)]/10 uppercase tracking-[0.2em] text-xs text-[color:var(--color-muted)]">
          <tr>
            <th className={thClass} onClick={() => handleSort("names")}>
              Names <SortIndicator column="names" sortColumn={sortColumn} sortDirection={sortDirection} />
            </th>
            <th className={`${thClass} w-20`} onClick={() => handleSort("guestCount")}>
              # Guests <SortIndicator column="guestCount" sortColumn={sortColumn} sortDirection={sortDirection} />
            </th>
            <th className={thClass} onClick={() => handleSort("events")}>
              Events <SortIndicator column="events" sortColumn={sortColumn} sortDirection={sortDirection} />
            </th>
            <th className={`${thClass} w-28`} onClick={() => handleSort("status")}>
              Status <SortIndicator column="status" sortColumn={sortColumn} sortDirection={sortDirection} />
            </th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--color-ink)]/10">
          {sorted.map((invite) => {
            const badge = statusBadge[invite.status];
            return (
              <tr key={invite.id}>
                <td className="py-3 font-serif">{invite.guestNames.join(", ")}</td>
                <td className="py-3">{invite.activeGuestCount}</td>
                <td className="py-3">{invite.eventTitles.join(", ")}</td>
                <td className="py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/invites/${invite.id}`}
                    className="rounded border border-[color:var(--color-ink)]/20 px-3 py-1 text-sm hover:bg-[color:var(--color-ink)]/5"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
