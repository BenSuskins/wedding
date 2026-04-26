"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";

import type { SiteSettingKey } from "@/lib/content/site-setting";
import type { ImageAssetRecord } from "@/lib/content/image-asset";

import { saveSettingAction, type SettingsFormState } from "./actions";

export interface ImagePickerFormProps {
  settingKey: SiteSettingKey;
  label: string;
  currentPath: string;
  initialAssets: ImageAssetRecord[];
  updatedAt: Date | null;
}

type UploadedAsset = {
  id: string;
  path: string;
  filename: string;
  diskPath: string;
  mime: string;
  bytes: number;
};

const initialState: SettingsFormState = {};

function webPath(diskPath: string): string {
  // "images/foo.jpg" → "/images/foo.jpg"
  return `/${diskPath}`;
}

export function ImagePickerForm({
  settingKey,
  label,
  currentPath,
  initialAssets,
  updatedAt,
}: ImagePickerFormProps) {
  const [selected, setSelected] = useState(currentPath);
  const [assets, setAssets] = useState(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(saveSettingAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const justSaved = state.updatedKey === settingKey;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json() as Partial<UploadedAsset & { error?: string }>;
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }
      const uploaded = data as UploadedAsset;
      setAssets((prev) => [
        {
          id: uploaded.id,
          filename: uploaded.filename,
          diskPath: uploaded.diskPath,
          mime: uploaded.mime,
          bytes: uploaded.bytes,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setSelected(uploaded.path);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="rounded border border-[color:var(--color-ink)]/10 p-5">
      <input type="hidden" name="key" value={settingKey} />

      <div className="mb-3 block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        {label}
      </div>

      {selected ? (
        <div className="mb-3 relative h-32 w-48 overflow-hidden rounded border border-[color:var(--color-ink)]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mb-3 flex h-32 w-48 items-center justify-center rounded border border-dashed border-[color:var(--color-ink)]/20 text-sm text-[color:var(--color-muted)]">
          No image set
        </div>
      )}

      {assets.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
            Library
          </p>
          <div className="flex flex-wrap gap-2">
            {assets.map((asset) => {
              const url = webPath(asset.diskPath);
              const isActive = selected === url;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelected(url)}
                  className={`relative h-16 w-16 overflow-hidden rounded border-2 transition-colors ${
                    isActive
                      ? "border-[color:var(--color-cornflower)]"
                      : "border-transparent hover:border-[color:var(--color-ink)]/30"
                  }`}
                  title={asset.filename}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={asset.filename} className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-3 flex gap-3 items-center">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          ref={fileInputRef}
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded border border-[color:var(--color-ink)]/30 px-3 py-1.5 text-sm hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        <input
          name={settingKey}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="or enter path / URL"
          className="min-w-0 flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-1.5 text-sm"
        />
      </div>

      {uploadError && <p className="mb-3 text-sm text-red-700">{uploadError}</p>}

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-[color:var(--color-muted)]">
          {updatedAt ? `Last updated ${updatedAt.toLocaleString("en-GB")}` : "Never set"}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded border border-[color:var(--color-ink)]/30 px-4 py-1.5 uppercase tracking-[0.2em] hover:bg-[color:var(--color-ink)]/5 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {justSaved ? <p className="mt-2 text-xs text-green-700">Saved.</p> : null}
      {state.error &&
      (state.issues?.some((issue) => issue.path.includes(settingKey)) || !state.updatedKey) ? (
        <div className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          {state.error}
        </div>
      ) : null}
    </form>
  );
}
