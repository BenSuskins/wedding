import { NextResponse } from "next/server";

import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { status: "unready", reason: message },
      { status: 503 },
    );
  }
}
