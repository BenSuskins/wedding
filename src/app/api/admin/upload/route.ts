import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getPrismaClient } from "@/server/db";
import { auth } from "@/server/auth";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
]);

function sanitiseBasename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "upload";
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File must be under ${MAX_BYTES / 1024 / 1024} MB` },
      { status: 400 },
    );
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : "jpg";
  const rawBase = path.basename(file.name, `.${rawExt}`);
  const safeBase = sanitiseBasename(rawBase);
  const uniquePrefix = crypto.randomUUID().slice(0, 8);
  const filename = `${uniquePrefix}-${safeBase}.${ext}`;

  const imagesDir = path.join(process.cwd(), "public", "images");
  await fs.mkdir(imagesDir, { recursive: true });

  const diskPath = `images/${filename}`;
  const fullPath = path.join(process.cwd(), "public", diskPath);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  const prisma = getPrismaClient();
  const asset = await prisma.imageAsset.create({
    data: {
      filename: file.name,
      diskPath,
      mime: file.type,
      bytes: file.size,
      uploadedBy: session.user.adminUserId,
    },
  });

  return NextResponse.json({
    id: asset.id,
    path: `/${diskPath}`,
    filename: asset.filename,
    diskPath: asset.diskPath,
    mime: asset.mime,
    bytes: asset.bytes,
  });
}
