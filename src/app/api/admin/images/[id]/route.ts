import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getPrismaClient } from "@/server/db";
import { auth } from "@/server/auth";

export const runtime = "nodejs";

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const prisma = getPrismaClient();
  const asset = await prisma.imageAsset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.imageAsset.delete({ where: { id } });

  const fullPath = path.join(getUploadDir(), asset.diskPath);
  await fs.rm(fullPath, { force: true });

  return new NextResponse(null, { status: 204 });
}
