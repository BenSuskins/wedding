import { spawn } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { createPrismaClient } from "@/server/db";
import { exportRsvpCsv } from "@/lib/rsvp/export";

const DEFAULT_RETENTION_DAYS = 14;

interface SnapshotConfig {
  backupDir: string;
  databaseUrl: string;
  retentionDays: number;
  now: Date;
}

function readConfig(): SnapshotConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const backupDir = process.env.BACKUP_DIR ?? "/var/backups/wedding";
  const retentionRaw = process.env.BACKUP_RETENTION_DAYS;
  const retentionDays = retentionRaw ? Number.parseInt(retentionRaw, 10) : DEFAULT_RETENTION_DAYS;
  if (!Number.isFinite(retentionDays) || retentionDays < 1) {
    throw new Error(`BACKUP_RETENTION_DAYS must be a positive integer, got ${retentionRaw}`);
  }
  return { backupDir, databaseUrl, retentionDays, now: new Date() };
}

function timestampSlug(now: Date): string {
  return now.toISOString().replace(/[:]/g, "-").replace(/\..+$/, "Z");
}

async function writeCsvSnapshot(config: SnapshotConfig, slug: string): Promise<string> {
  const prisma = createPrismaClient(config.databaseUrl);
  try {
    const result = await exportRsvpCsv(prisma);
    if (result.isErr()) {
      throw new Error(`CSV export failed: ${String(result.error.cause)}`);
    }
    const path = join(config.backupDir, `rsvps-${slug}.csv`);
    await writeFile(path, result.value, "utf8");
    return path;
  } finally {
    await prisma.$disconnect();
  }
}

function runPgDump(databaseUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("pg_dump", ["--format=custom", "--file", outputPath, databaseUrl], {
      stdio: ["ignore", "inherit", "inherit"],
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited with code ${code}`));
    });
  });
}

async function pruneOldSnapshots(config: SnapshotConfig): Promise<string[]> {
  const cutoffMs = config.now.getTime() - config.retentionDays * 24 * 60 * 60 * 1000;
  const entries = await readdir(config.backupDir, { withFileTypes: true });
  const removed: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/^(rsvps-|pgdump-).*/.test(entry.name)) continue;
    const path = join(config.backupDir, entry.name);
    const match = entry.name.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/);
    const slug = match?.[1];
    if (!slug) continue;
    const timestamp = Date.parse(slug.replace(/-(\d{2})-(\d{2})Z$/, ":$1:$2Z"));
    if (!Number.isFinite(timestamp)) continue;
    if (timestamp < cutoffMs) {
      await rm(path, { force: true });
      removed.push(path);
    }
  }
  return removed;
}

async function main(): Promise<void> {
  const config = readConfig();
  await mkdir(config.backupDir, { recursive: true });
  const slug = timestampSlug(config.now);

  const csvPath = await writeCsvSnapshot(config, slug);
  console.log(`[snapshot] wrote CSV ${csvPath}`);

  const dumpPath = join(config.backupDir, `pgdump-${slug}.dump`);
  await runPgDump(config.databaseUrl, dumpPath);
  console.log(`[snapshot] wrote pg_dump ${dumpPath}`);

  const removed = await pruneOldSnapshots(config);
  if (removed.length > 0) {
    console.log(`[snapshot] pruned ${removed.length} file(s) older than ${config.retentionDays} day(s)`);
  }
}

main().catch((error) => {
  console.error("[snapshot] failed:", error);
  process.exitCode = 1;
});
