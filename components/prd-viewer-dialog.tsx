"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  detectPrdUrlType,
  toGoogleDriveEmbedUrl,
  type PrdUrlType,
} from "@/lib/prd-utils";
import { fetchMarkdownContent } from "@/app/actions/fetch-markdown";

interface PRDViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  projectName: string;
}

export function PRDViewerDialog({
  open,
  onOpenChange,
  url,
  projectName,
}: PRDViewerDialogProps) {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const urlType: PrdUrlType = detectPrdUrlType(url);

  const loadMarkdown = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMarkdown(null);
    const result = await fetchMarkdownContent(url);
    if (result.success) {
      setMarkdown(result.content);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [url]);

  useEffect(() => {
    if (open && urlType === "github-md") {
      loadMarkdown();
    }
    if (!open) {
      setMarkdown(null);
      setError(null);
    }
  }, [open, urlType, loadMarkdown]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle>{projectName} — PRD</DialogTitle>
              <DialogDescription className="sr-only">
                Product Requirements Document viewer
              </DialogDescription>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Open in new tab
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {urlType === "github-md" && (
            <div className="p-6">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {error && (
                <div className="text-destructive text-sm py-8 text-center">
                  {error}
                </div>
              )}
              {markdown && (
                <article className="prose prose-neutral dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdown}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          )}

          {urlType === "google-drive-pdf" && (
            <iframe
              src={toGoogleDriveEmbedUrl(url)}
              className="w-full h-full min-h-[70vh] border-0"
              allow="autoplay"
              title={`${projectName} PRD`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
