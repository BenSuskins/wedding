import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
): Promise<NextResponse> {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("..")) {
    return new NextResponse(null, { status: 400 });
  }

  const fullPath = path.join(getUploadDir(), filename);

  let data: Buffer;
  try {
    data = await fs.readFile(fullPath);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";

  return new NextResponse(data.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
