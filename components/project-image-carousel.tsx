"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Auto-advance cadence; tweak here to change the slide speed.
const SLIDE_INTERVAL_MS = 1000;

export function ProjectImageCarousel({
  imageUrls,
  projectName,
}: {
  imageUrls: string[];
  projectName: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const count = imageUrls.length;
  const hasMultiple = count > 1;
  const current = count ? index % count : 0;

  // Auto-slide every second, paused on hover or while the lightbox is open.
  useEffect(() => {
    if (!hasMultiple || paused || lightboxOpen) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasMultiple, paused, lightboxOpen, count]);

  if (count === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        No image
      </div>
    );
  }

  function go(delta: number) {
    setIndex((i) => (i + delta + count) % count);
  }

  return (
    <>
      <div
        className="relative w-full h-full group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          type="button"
          className="block w-full h-full cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          aria-label={`View full image for ${projectName}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrls[current]}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view image
            </span>
          </div>
        </button>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous image"
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next image"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1.5">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    i === current ? "bg-white" : "bg-white/50 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-[90vw] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>{projectName}</DialogTitle>
            <DialogDescription>Full size project image</DialogDescription>
          </DialogHeader>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[current]}
              alt={projectName}
              className="w-full h-auto rounded-md"
            />
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
                  {imageUrls.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={cn(
                        "size-2 rounded-full transition-colors",
                        i === current ? "bg-white" : "bg-white/50 hover:bg-white/80",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
