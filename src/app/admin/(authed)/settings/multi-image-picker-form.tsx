"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";

import type { SiteSettingKey } from "@/lib/content/site-setting";
import type { ImageAssetRecord } from "@/lib/content/image-asset";

import { saveSettingAction, type SettingsFormState } from "./actions";

export interface MultiImagePickerFormProps {
  settingKey: SiteSettingKey;
  label: string;
  description?: string;
  currentPaths: string[];
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
  return `/api/images/${diskPath}`;
}

export function MultiImagePickerForm({
  settingKey,
  label,
  description,
  currentPaths,
  initialAssets,
  updatedAt,
}: MultiImagePickerFormProps) {
  const [selectedPaths, setSelectedPaths] = useState(currentPaths);
  const [assets, setAssets] = useState(initialAssets);
  const [manualPath, setManualPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(saveSettingAction, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const justSaved = state.updatedKey === settingKey;

  function togglePath(path: string) {
    setSelectedPaths((previous) =>
      previous.includes(path)
        ? previous.filter((existing) => existing !== path)
        : [...previous, path],
    );
  }

  function addManualPath() {
    const trimmed = manualPath.trim();
    if (!trimmed) return;
    setSelectedPaths((previous) =>
      previous.includes(trimmed) ? previous : [...previous, trimmed],
    );
    setManualPath("");
  }

  async function handleDelete(asset: ImageAssetRecord) {
    const res = await fetch(`/api/admin/images/${asset.id}`, { method: "DELETE" });
    if (res.ok) {
      setAssets((previous) => previous.filter((a) => a.id !== asset.id));
      setSelectedPaths((previous) =>
        previous.filter((path) => path !== webPath(asset.diskPath)),
      );
    }
  }

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
      setAssets((previous) => [
        {
          id: uploaded.id,
          filename: uploaded.filename,
          diskPath: uploaded.diskPath,
          mime: uploaded.mime,
          bytes: uploaded.bytes,
          createdAt: new Date(),
        },
        ...previous,
      ]);
      setSelectedPaths((previous) =>
        previous.includes(uploaded.path) ? previous : [...previous, uploaded.path],
      );
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
      {selectedPaths.map((path) => (
        <input key={path} type="hidden" name={settingKey} value={path} />
      ))}

      <div className="mb-1 block text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        {label}
      </div>
      {description && (
        <p className="mb-3 text-sm text-[color:var(--color-muted)]">{description}</p>
      )}

      {selectedPaths.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedPaths.map((path) => (
            <div
              key={path}
              className="group relative h-32 w-48 overflow-hidden rounded border border-[color:var(--color-ink)]/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={path} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => togglePath(path)}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-sm text-white"
                title="Remove from slideshow"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 flex h-32 w-48 items-center justify-center rounded border border-dashed border-[color:var(--color-ink)]/20 text-sm text-[color:var(--color-muted)]">
          No images selected
        </div>
      )}

      {assets.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
            Library — click to add or remove
          </p>
          <div className="flex flex-wrap gap-2">
            {assets.map((asset) => {
              const url = webPath(asset.diskPath);
              const isActive = selectedPaths.includes(url);
              return (
                <div key={asset.id} className="group relative h-16 w-16">
                  <button
                    type="button"
                    onClick={() => togglePath(url)}
                    className={`h-full w-full overflow-hidden rounded border-2 transition-colors ${
                      isActive
                        ? "border-[color:var(--color-cornflower)]"
                        : "border-transparent hover:border-[color:var(--color-ink)]/30"
                    }`}
                    title={asset.filename}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={asset.filename} className="h-full w-full object-cover" />
                  </button>
                  {isActive && (
                    <span className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-[color:var(--color-cornflower)] px-1 text-xs text-white">
                      ✓
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(asset)}
                    className="absolute right-0.5 top-0.5 hidden rounded bg-black/60 px-1 text-xs text-white group-hover:block"
                    title="Delete image"
                  >
                    ×
                  </button>
                </div>
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
          value={manualPath}
          onChange={(e) => setManualPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addManualPath();
            }
          }}
          placeholder="or enter path / URL"
          className="min-w-0 flex-1 rounded border border-[color:var(--color-ink)]/20 bg-white px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={addManualPath}
          className="shrink-0 rounded border border-[color:var(--color-ink)]/30 px-3 py-1.5 text-sm hover:bg-[color:var(--color-ink)]/5"
        >
          Add
        </button>
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
