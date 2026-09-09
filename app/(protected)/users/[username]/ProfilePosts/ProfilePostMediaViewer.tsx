"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Play,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState, type PointerEvent } from "react";

type ProfilePostMedia = {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  width: number | null;
  height: number | null;
};

type ProfilePostMediaViewerProps = {
  media: ProfilePostMedia[];
};

export default function ProfilePostMediaViewer({
  media,
}: ProfilePostMediaViewerProps) {
  const [open, setOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [{ zoom, x, y }, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const dragStart = useRef<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const activeMedia = media[activeIndex];
  const previewMedia = media[previewIndex];
  const isImage = activeMedia?.type === "IMAGE";
  const hasMultiple = media.length > 1;
  const previewRatio = Math.min(16 / 9, Math.max(0.6,
    (media[0]?.width || 4) / (media[0]?.height || 3),
  ));

  const resetView = () => {
    setView({ zoom: 1, x: 0, y: 0 });
    dragStart.current = null;
  };

  const changeZoom = useCallback((delta: number) => {
    dragStart.current = null;
    setView((current) => {
      const nextZoom = Math.min(3, Math.max(1, current.zoom + delta));
      return nextZoom === 1
        ? { zoom: 1, x: 0, y: 0 }
        : { ...current, zoom: nextZoom };
    });
  }, []);

  // A native non-passive listener can prevent scrolling and browser zoom.
  const attachViewport = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isImage || event.deltaY === 0) return;

        const unit = event.deltaMode === 1 ? 16
          : event.deltaMode === 2 ? node.clientHeight : 1;
        const delta = event.deltaY * unit;
        changeZoom(-Math.sign(delta) * Math.min(Math.abs(delta) * 0.003, 0.25));
      };

      node.addEventListener("wheel", handleWheel, { passive: false });
      return () => node.removeEventListener("wheel", handleWheel);
    },
    [isImage, changeZoom],
  );

  const openMedia = (index: number) => {
    setActiveIndex(index);
    resetView();
    setOpen(true);
  };

  const showPrevious = () => {
    resetView();
    setActiveIndex((current) =>
      current === 0 ? media.length - 1 : current - 1,
    );
  };

  const showNext = () => {
    resetView();
    setActiveIndex((current) =>
      current === media.length - 1 ? 0 : current + 1,
    );
  };

  const handleMediaPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isImage || zoom === 1 || event.button !== 0 || !event.isPrimary) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStart.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: x,
      panY: y,
    };
  };

  const handleMediaPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStart.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const nextX = drag.panX + event.clientX - drag.pointerX;
    const nextY = drag.panY + event.clientY - drag.pointerY;
    setView((current) => ({ ...current, x: nextX, y: nextY }));
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current?.pointerId !== event.pointerId) return;
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (media.length === 0 || !activeMedia || !previewMedia) {
    return null;
  }

  return (
    <>
      <div
        role="region"
        aria-label="Post attachments"
        aria-roledescription="carousel"
        className="relative mt-3 overflow-hidden rounded-lg bg-black/40"
        style={{
          width: `min(100%, ${Math.min(520, 420 * previewRatio)}px)`,
          aspectRatio: previewRatio,
        }}
      >
        <button
          type="button"
          aria-label={`Open attachment ${previewIndex + 1} of ${media.length}`}
          onClick={() => openMedia(previewIndex)}
          className="absolute inset-0 flex size-full cursor-pointer items-center justify-center"
        >
          {previewMedia.type === "IMAGE" ? (
            <Image
              src={previewMedia.url}
              alt=""
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <>
              <video
                key={previewMedia.id}
                src={previewMedia.url}
                className="size-full object-contain"
                preload="metadata"
                playsInline
                muted
              />
              <span className="pointer-events-none absolute flex size-12 items-center justify-center rounded-full bg-black/60 text-white">
                <Play className="size-6" />
              </span>
            </>
          )}
        </button>
        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous attachment"
              onClick={() => setPreviewIndex((current) => (current - 1 + media.length) % media.length)}
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next attachment"
              onClick={() => setPreviewIndex((current) => (current + 1) % media.length)}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center rounded-full bg-black/55 px-1">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show attachment ${index + 1}`}
                  aria-current={index === previewIndex ? "true" : undefined}
                  onClick={() => setPreviewIndex(index)}
                  className="flex size-6 cursor-pointer items-center justify-center"
                >
                  <span className={`size-1.5 rounded-full ${index === previewIndex ? "bg-white" : "bg-white/40"}`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          onWheel={(event) => event.stopPropagation()}
          className="max-h-[84vh] w-[min(92vw,920px)] max-w-[920px] gap-0 overflow-hidden border-white/10 bg-black/95 p-0 text-white sm:max-w-[920px]"
        >
          <DialogTitle className="sr-only">Post media viewer</DialogTitle>

          <div className="relative flex max-h-[84vh] flex-col overflow-hidden">
            <div className="absolute right-3 top-3 z-40 flex items-center gap-2">
              {activeMedia.type === "IMAGE" && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom out"
                    title="Zoom out"
                    disabled={zoom === 1}
                    onClick={() => changeZoom(-0.25)}
                    className="bg-black/50 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Minus className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={zoom === 1}
                    aria-label="Reset zoom"
                    title="Reset zoom"
                    onClick={resetView}
                    className="bg-black/50 text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-40"
                  >
                    <Maximize2 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom in"
                    title="Zoom in"
                    disabled={zoom === 3}
                    onClick={() => changeZoom(0.25)}
                    className="bg-black/50 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Plus className="size-4" />
                  </Button>
                </>
              )}
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close media viewer"
                  title="Close"
                  className="bg-black/50 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" />
                </Button>
              </DialogClose>
            </div>

            {hasMultiple && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={showPrevious}
                  aria-label="Previous media"
                  className="absolute left-3 top-1/2 z-40 size-10 -translate-y-1/2 rounded-full bg-black/50 text-white/70 hover:bg-white/10 hover:text-white active:translate-y-[-50%]"
                >
                  <ChevronLeft className="size-5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={showNext}
                  aria-label="Next media"
                  className="absolute right-3 top-1/2 z-40 size-10 -translate-y-1/2 rounded-full bg-black/50 text-white/70 hover:bg-white/10 hover:text-white active:translate-y-[-50%]"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </>
            )}

            <div
              ref={attachViewport}
              onPointerDown={handleMediaPointerDown}
              onPointerMove={handleMediaPointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onLostPointerCapture={stopDragging}
              className="relative z-0 flex h-[min(72vh,680px)] min-h-0 cursor-default items-center justify-center overflow-hidden overscroll-none p-4"
              style={{ touchAction: activeMedia.type === "IMAGE" ? "none" : "auto" }}
            >
              {activeMedia.type === "IMAGE" ? (
                <Image
                  src={activeMedia.url}
                  alt=""
                  width={activeMedia.width ?? 1200}
                  height={activeMedia.height ?? 900}
                  draggable={false}
                  className="pointer-events-none h-auto max-h-full w-auto max-w-full select-none object-contain will-change-transform"
                  style={{
                    transform: `translate3d(${x}px, ${y}px, 0) scale(${zoom})`,
                  }}
                  unoptimized
                />
              ) : (
                <video
                  src={activeMedia.url}
                  className="max-h-full max-w-full object-contain"
                  controls
                  autoPlay
                />
              )}
            </div>

            {hasMultiple && (
              <div className="border-t border-white/10 px-4 py-3 text-center text-xs text-white/45">
                {activeIndex + 1} / {media.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
