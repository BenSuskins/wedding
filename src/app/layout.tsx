import type { Metadata } from "next";

import "./globals.css";
import { getSiteSetting } from "@/lib/content/site-setting";
import { getPrismaClient } from "@/server/db";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const prisma = getPrismaClient();
  const [titleResult, descResult] = await Promise.all([
    getSiteSetting(prisma, "page_title"),
    getSiteSetting(prisma, "meta_description"),
  ]);

  return {
    title: titleResult.isOk() ? titleResult.value.value.title : "Wedding",
    description: descResult.isOk()
      ? descResult.value.value.description
      : "A quiet corner of the internet for our wedding.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
