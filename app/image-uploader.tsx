"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Link,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { uploadImagesToGitHub } from "@/app/actions/upload-image";

type Tab = "upload" | "url";
type UploadStatus = "idle" | "uploading" | "error";

// Keep in sync with the server limits in app/actions/upload-image.ts.
const MAX_IMAGES = 5; // max images in a project gallery
const MAX_TOTAL_UPLOAD_SIZE = 5.9 * 1024 * 1024; // 5.9 MB per upload batch

// Fake stepped progress: the single upload request is opaque and slow.
const UPLOAD_STEPS = [
  "Uploading images…",
  "Creating commit…",
  "Opening PR…",
  "Merging…",
] as const;

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sanitize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type PendingFile = { file: File; preview: string };

export function ImageUploader({
  defaultUrls,
  projectName,
  onValuesChange,
}: {
  defaultUrls?: string[];
  projectName?: string;
  onValuesChange: (urls: string[]) => void;
}) {
  const [tab, setTab] = useState<Tab>("upload");
  const [images, setImagesState] = useState<string[]>(defaultUrls ?? []);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [folderName, setFolderName] = useState(() =>
    projectName ? sanitize(projectName) : "",
  );

  const [urlValue, setUrlValue] = useState("");

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  // Validation message for the 5-image cap / 5.9 MB batch limit.
  const [limitMsg, setLimitMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPendingSize = pendingFiles.reduce((sum, p) => sum + p.file.size, 0);
  const overSizeLimit = totalPendingSize > MAX_TOTAL_UPLOAD_SIZE;
  // Slots left in the gallery once the current pending batch is added.
  const slotsLeft = MAX_IMAGES - images.length - pendingFiles.length;

  // Single source of truth: update state and notify the parent together.
  function setImages(next: string[]) {
    setImagesState(next);
    onValuesChange(next);
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  function moveImage(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    // Allow selecting the same file again after removal.
    e.target.value = "";
    setStatus("idle");
    setErrorMsg("");
    setLimitMsg("");

    if (selected.length === 0) return;

    const available = MAX_IMAGES - images.length - pendingFiles.length;
    if (available <= 0) {
      setLimitMsg(`You can have at most ${MAX_IMAGES} images. Remove some first.`);
      return;
    }

    const accepted = selected.slice(0, available);
    if (accepted.length < selected.length) {
      setLimitMsg(
        `Only added ${accepted.length} of ${selected.length} — a project can have at most ${MAX_IMAGES} images.`,
      );
    }

    setPendingFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removePendingFile(index: number) {
    setLimitMsg("");
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleUpload() {
    if (!canUpload) return;

    setStatus("uploading");
    setStepIndex(0);
    setErrorMsg("");

    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, UPLOAD_STEPS.length - 1));
    }, 2500);

    try {
      // All files go in ONE request; the < 5.9 MB batch cap keeps it under the
      // platform's 6 MB Server Action body limit. The server commits them in a
      // single push and returns one raw URL per file.
      const fd = new FormData();
      fd.append("folderName", folderName.trim());
      for (const { file } of pendingFiles) fd.append("files", file);

      const result = await uploadImagesToGitHub(fd);
      clearInterval(interval);

      if (result.success) {
        setImages([...images, ...result.urls]);
        for (const { preview } of pendingFiles) URL.revokeObjectURL(preview);
        setPendingFiles([]);
        setStatus("idle");
      } else {
        setStatus("error");
        setErrorMsg(result.error);
      }
    } catch {
      clearInterval(interval);
      setStatus("error");
      setErrorMsg("Upload failed unexpectedly.");
    }
  }

  function handleAddUrl() {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    if (images.length >= MAX_IMAGES) {
      setLimitMsg(`You can have at most ${MAX_IMAGES} images. Remove some first.`);
      return;
    }
    setImages([...images, trimmed]);
    setUrlValue("");
    setLimitMsg("");
  }

  const galleryFull = images.length >= MAX_IMAGES;
  const canUpload =
    status !== "uploading" &&
    pendingFiles.length > 0 &&
    folderName.trim().length > 0 &&
    !overSizeLimit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">Images (optional)</label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      {/* Current gallery */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="group relative aspect-video w-24 overflow-hidden rounded-md border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Remove image"
                className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
              >
                <X className="size-3" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveImage(i, -1)}
                  disabled={i === 0}
                  aria-label="Move image left"
                  className="p-0.5 text-white disabled:opacity-30"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="Move image right"
                  className="p-0.5 text-white disabled:opacity-30"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex rounded-md border border-input overflow-hidden text-sm">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 transition-colors ${
            tab === "upload"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-accent"
          }`}
          onClick={() => setTab("upload")}
        >
          <Upload className="size-3.5" />
          Upload Images
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 transition-colors ${
            tab === "url"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-accent"
          }`}
          onClick={() => setTab("url")}
        >
          <Link className="size-3.5" />
          Add URL
        </button>
      </div>

      {/* Cap / size limit notice (shared by both tabs) */}
      {limitMsg && (
        <p className="text-xs text-destructive">{limitMsg}</p>
      )}

      {/* Upload tab */}
      {tab === "upload" && (
        <div className="space-y-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === "uploading" || slotsLeft <= 0}
            >
              Select images
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              Up to {MAX_IMAGES} images, under 5.9 MB total per upload.
            </p>
          </div>

          {/* Pending file previews */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map(({ file, preview }, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="group relative aspect-video w-24 overflow-hidden rounded-md border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePendingFile(i)}
                    aria-label="Remove pending image"
                    disabled={status === "uploading"}
                    className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Folder name + batch total size */}
          {pendingFiles.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Folder name
                </label>
                <span
                  className={
                    overSizeLimit ? "text-xs text-destructive" : "text-xs text-muted-foreground"
                  }
                >
                  {formatMb(totalPendingSize)} / 5.9 MB
                </span>
              </div>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(sanitize(e.target.value))}
                placeholder="my-project"
                disabled={status === "uploading"}
              />
            </div>
          )}

          {/* Over-limit warning */}
          {overSizeLimit && (
            <p className="text-xs text-destructive">
              Total image size must be under 5.9 MB. Remove a file or upload smaller images.
            </p>
          )}

          {/* Upload button */}
          {pendingFiles.length > 0 && (
            <Button type="button" size="sm" disabled={!canUpload} onClick={handleUpload}>
              {status === "uploading" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {UPLOAD_STEPS[stepIndex]}
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  Upload {pendingFiles.length} image
                  {pendingFiles.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-sm">
              <AlertCircle className="size-4 mt-0.5 text-destructive shrink-0" />
              <p className="text-destructive">{errorMsg}</p>
            </div>
          )}
        </div>
      )}

      {/* URL tab */}
      {tab === "url" && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="https://..."
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUrl}
              disabled={galleryFull}
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste an image URL and click Add. First image is the cover.
          </p>
        </div>
      )}
    </div>
  );
}
