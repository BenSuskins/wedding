import { NextResponse } from "next/server";

import { requireAdminIdentity } from "@/lib/admin/session";
import { getPrismaClient } from "@/server/db";
import { exportRsvpCsv } from "@/lib/rsvp/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timestampFilename(now: Date): string {
  const iso = now.toISOString().replace(/[:]/g, "-").replace(/\..+$/, "Z");
  return `rsvps-${iso}.csv`;
}

export async function GET(): Promise<Response> {
  try {
    await requireAdminIdentity();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await exportRsvpCsv(getPrismaClient());
  if (result.isErr()) {
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }

  const filename = timestampFilename(new Date());
  return new Response(result.value, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
