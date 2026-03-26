"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Link, Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { uploadImageToGitHub } from "@/app/actions/upload-image";

type Tab = "url" | "upload";
type UploadStatus = "idle" | "uploading" | "success" | "error";

const UPLOAD_STEPS = [
  "Creating branch…",
  "Uploading file…",
  "Creating pull request…",
  "Merging PR…",
  "Cleaning up…",
] as const;

function sanitize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ImageUploader({
  defaultUrl,
  projectName,
  onValueChange,
}: {
  defaultUrl?: string;
  projectName?: string;
  onValueChange: (url: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("url");
  const [urlValue, setUrlValue] = useState(defaultUrl ?? "");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [folderName, setFolderName] = useState(() =>
    projectName ? sanitize(projectName) : "",
  );
  const [fileName, setFileName] = useState("");

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setStatus("idle");
    setErrorMsg("");
    setResultUrl("");

    if (selected) {
      setPreview(URL.createObjectURL(selected));
      const nameWithoutExt = selected.name.replace(/\.[^.]+$/, "");
      setFileName(sanitize(nameWithoutExt));
    } else {
      setPreview(null);
      setFileName("");
    }
  }

  async function handleUpload() {
    if (!file || !folderName.trim() || !fileName.trim()) return;

    setStatus("uploading");
    setStepIndex(0);
    setErrorMsg("");

    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, UPLOAD_STEPS.length - 1));
    }, 2500);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folderName", folderName.trim());
      fd.append("fileName", fileName.trim());

      const result = await uploadImageToGitHub(fd);

      clearInterval(interval);

      if (result.success) {
        setStatus("success");
        setResultUrl(result.url);
        onValueChange(result.url);
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

  async function handleCopy() {
    await navigator.clipboard.writeText(resultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canUpload =
    status !== "uploading" &&
    file !== null &&
    folderName.trim().length > 0 &&
    fileName.trim().length > 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Image (optional)</label>

      {/* Tab switcher */}
      <div className="flex rounded-md border border-input overflow-hidden text-sm">
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
          Enter URL
        </button>
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
          Upload Image
        </button>
      </div>

      {/* URL tab */}
      {tab === "url" && (
        <div className="space-y-1">
          <Input
            type="text"
            placeholder="https://..."
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value);
              onValueChange(e.target.value);
            }}
          />
          <p className="text-xs text-muted-foreground">16:9 project snapshot.</p>
        </div>
      )}

      {/* Upload tab */}
      {tab === "upload" && (
        <div className="space-y-3">
          {/* File picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === "uploading"}
            >
              {file ? "Change file" : "Select image"}
            </Button>
            {file && (
              <span className="ml-2 text-xs text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="aspect-video w-full max-w-xs overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Folder / file name */}
          {file && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Folder name
                </label>
                <Input
                  value={folderName}
                  onChange={(e) => setFolderName(sanitize(e.target.value))}
                  placeholder="my-project"
                  disabled={status === "uploading"}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  File name
                </label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(sanitize(e.target.value))}
                  placeholder="screenshot"
                  disabled={status === "uploading"}
                />
              </div>
            </div>
          )}

          {/* Upload button */}
          {file && status !== "success" && (
            <Button
              type="button"
              size="sm"
              disabled={!canUpload}
              onClick={handleUpload}
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {UPLOAD_STEPS[stepIndex]}
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  Upload to GitHub
                </>
              )}
            </Button>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 p-2.5 text-sm overflow-hidden">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-green-600 shrink-0" />
                <p className="font-medium text-green-700 dark:text-green-400">
                  Uploaded successfully
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground break-all">
                {resultUrl}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><Check className="size-3" /> Copied</>
                  ) : (
                    <><Copy className="size-3" /> Copy URL</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setUrlValue(resultUrl);
                    onValueChange(resultUrl);
                    setTab("url");
                  }}
                >
                  <Link className="size-3" /> Use URL
                </Button>
              </div>
            </div>
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
    </div>
  );
}
