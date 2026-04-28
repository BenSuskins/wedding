"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminIdentity } from "@/lib/admin/session";
import { upsertContentBlock } from "@/lib/content/content-block";
import { getPrismaClient } from "@/server/db";

export interface SaveContentBlockState {
  error?: string;
  issues?: ReadonlyArray<{ path: string; message: string }>;
}

export async function saveContentBlock(
  _previous: SaveContentBlockState,
  formData: FormData,
): Promise<SaveContentBlockState> {
  const admin = await requireAdminIdentity();
  const key = String(formData.get("key") ?? "").trim();
  const locale = String(formData.get("locale") ?? "").trim();
  const title = String(formData.get("title") ?? "");
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");

  const result = await upsertContentBlock(getPrismaClient(), {
    key,
    locale,
    title,
    bodyMarkdown,
    updatedByAdmin: admin.label,
  });

  if (result.isErr()) {
    if (result.error.kind === "validation") {
      return { error: "Please fix the highlighted fields.", issues: result.error.issues };
    }
    return { error: `Save failed: ${result.error.kind}` };
  }

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${key}/${locale}`);
  revalidatePath("/");
  redirect("/admin/content");
}
