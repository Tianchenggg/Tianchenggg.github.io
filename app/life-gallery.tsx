"use client";

/* eslint-disable @next/next/no-img-element -- Pre-generated responsive WebP assets support static hosting without an image server. */

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { lifePhotoRows, lifePhotos } from "./life-photos";

type Language = "en" | "zh";

const galleryCopy = {
  en: {
    gallery: "Life in photographs",
    viewer: "Photo viewer",
    close: "Close photo viewer",
    previous: "Previous photo",
    next: "Next photo",
    view: (number: number, title: string, alt: string) => `View photo ${number}: ${title}. ${alt}`,
    count: (number: number, total: number) => `Photo ${number} of ${total}`,
  },
  zh: {
    gallery: "生活影像",
    viewer: "照片查看器",
    close: "关闭照片查看器",
    previous: "上一张照片",
    next: "下一张照片",
    view: (number: number, title: string, alt: string) => `查看第 ${number} 张照片：${title}。${alt}`,
    count: (number: number, total: number) => `第 ${number} 张，共 ${total} 张照片`,
  },
} as const;

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false">
      <path
        d={direction === "previous" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LifeGallery({ language }: { language: Language }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = activeIndex !== null;
  const activePhoto = activeIndex === null ? null : lifePhotos[activeIndex];
  const copy = galleryCopy[language];

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const body = dialog.ownerDocument.body;
    const view = dialog.ownerDocument.defaultView;
    const opener = openerRef.current;
    // Capture longhands too: setting overflow can otherwise lose an existing
    // overflow-x / overflow-y declaration when the lightbox is dismissed.
    const lockedProperties = ["overflow", "overflow-x", "overflow-y", "padding-right"];
    const previousStyles = lockedProperties.map((property) => ({
      property,
      value: body.style.getPropertyValue(property),
      priority: body.style.getPropertyPriority(property),
    }));
    const scrollbarWidth = view
      ? Math.max(0, view.innerWidth - dialog.ownerDocument.documentElement.clientWidth)
      : 0;

    if (scrollbarWidth > 0 && view) {
      const paddingRight = Number.parseFloat(view.getComputedStyle(body).paddingRight) || 0;
      body.style.setProperty("padding-right", `${paddingRight + scrollbarWidth}px`);
    }
    body.style.setProperty("overflow", "hidden");
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      lockedProperties.forEach((property) => body.style.removeProperty(property));
      previousStyles.forEach(({ property, value, priority }) => {
        if (value) body.style.setProperty(property, value, priority);
      });
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  function movePhoto(direction: -1 | 1) {
    setActiveIndex((index) => index === null
      ? null
      : (index + direction + lifePhotos.length) % lifePhotos.length);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  return (
    <>
      <div className="life-gallery" role="group" aria-label={copy.gallery}>
        {lifePhotoRows.map((row) => {
          const rowPhotos = row.map((id) => lifePhotos.find((photo) => photo.id === id)!);
          const rowRatio = rowPhotos.reduce((sum, photo) => sum + photo.width / photo.height, 0);

          return (
            <div className="life-row" key={row[0]}>
              {rowPhotos.map((photo) => {
                const index = lifePhotos.indexOf(photo);
                const landscape = photo.width > photo.height;
                const ratio = photo.width / photo.height;
                const share = ratio / rowRatio;

                return (
                  <button
                    type="button"
                    className={`life-photo life-photo--${landscape ? "landscape" : "portrait"}`}
                    style={{ "--photo-ratio": ratio, aspectRatio: `${photo.width} / ${photo.height}` } as CSSProperties}
                    key={photo.id}
                    aria-label={copy.view(index + 1, photo.title[language], photo.alt[language])}
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      openerRef.current = event.currentTarget;
                      setActiveIndex(index);
                    }}
                  >
                    <img
                      src={`/life/${photo.id}-960.webp`}
                      srcSet={`/life/${photo.id}-480.webp 480w, /life/${photo.id}-960.webp 960w, /life/${photo.id}.webp ${photo.width}w`}
                      sizes={`(max-width: 700px) ${landscape ? "calc(100vw - 36px)" : "calc(50vw - 24px)"}, (max-width: 1160px) ${Math.ceil(share * 100)}vw, ${Math.ceil(share * 1080)}px`}
                      alt={photo.alt[language]}
                      width={photo.width}
                      height={photo.height}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="life-photo-caption" aria-hidden="true">
                      <span className="life-photo-title">{photo.title[language]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        className="life-lightbox"
        aria-label={copy.viewer}
        onCancel={(event) => {
          event.preventDefault();
          setActiveIndex(null);
        }}
        onClose={(event) => {
          // A queued close event from Strict Mode cleanup must not close a
          // dialog that has since been opened again.
          if (!event.currentTarget.open) setActiveIndex(null);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setActiveIndex(null);
        }}
        onKeyDown={handleKeyDown}
      >
        {activePhoto && activeIndex !== null && (
          <div
            className="life-lightbox-inner"
            onClick={(event) => {
              if (event.target === event.currentTarget) setActiveIndex(null);
            }}
          >
            <div className="life-lightbox-toolbar">
              <p className="life-lightbox-counter" aria-live="polite" aria-atomic="true">
                <span aria-hidden="true">{String(activeIndex + 1).padStart(2, "0")} / {String(lifePhotos.length).padStart(2, "0")}</span>
                <span className="sr-only">{copy.count(activeIndex + 1, lifePhotos.length)}</span>
              </p>
              <p className="life-lightbox-title">{activePhoto.title[language]}</p>
              <button
                ref={closeRef}
                className="life-lightbox-close"
                type="button"
                aria-label={copy.close}
                onClick={() => setActiveIndex(null)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div
              className="life-lightbox-stage"
              onClick={(event) => {
                if (event.target === event.currentTarget) setActiveIndex(null);
              }}
            >
              <button
                className="life-lightbox-nav life-lightbox-prev"
                type="button"
                aria-label={copy.previous}
                onClick={() => movePhoto(-1)}
              >
                <ArrowIcon direction="previous" />
              </button>
              <img
                className="life-lightbox-image"
                src={`/life/${activePhoto.id}.webp`}
                alt={activePhoto.alt[language]}
                width={activePhoto.width}
                height={activePhoto.height}
                decoding="async"
              />
              <button
                className="life-lightbox-nav life-lightbox-next"
                type="button"
                aria-label={copy.next}
                onClick={() => movePhoto(1)}
              >
                <ArrowIcon direction="next" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
