"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Media } from "@/lib/types";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

interface Props {
  images: Media[];
}

export default function ProjectLightbox({ images }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const wheelLock = useRef(0);

  const open = (i: number) => setActive(i);
  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(() => setActive((a) => (a === null ? a : (a - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setActive((a) => (a === null ? a : (a + 1) % images.length)), [images.length]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, prev, next]);

  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - wheelLock.current < 350) return;
    wheelLock.current = now;
    if (e.deltaY > 0) next();
    else if (e.deltaY < 0) prev();
  };

  const current = active !== null ? images[active] : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 relative aspect-video rounded-jumbo overflow-hidden border border-line shadow-xl">
          <button
            type="button"
            onClick={() => open(0)}
            className="block w-full h-full cursor-zoom-in"
            aria-label={`Open ${images[0].alt_text ?? "project image"} in lightbox`}
          >
            <Image className="w-full h-full object-cover" src={images[0].url ?? ""} alt={images[0].alt_text ?? "JosephLab project image"} width={1280} height={720} sizes="(max-width: 768px) 100vw, 66vw" />
          </button>
        </div>
        <div className="md:col-span-4 grid grid-rows-2 gap-6">
          {images.slice(1, 3).map((image, i) => (
            <div key={image.id ?? i} className="relative rounded-jumbo overflow-hidden border border-line shadow-lg">
              <button
                type="button"
                onClick={() => open(i + 1)}
                className="block w-full h-full cursor-zoom-in"
                aria-label={`Open ${image.alt_text ?? "project image"} in lightbox`}
              >
                <Image className="w-full h-full object-cover" src={image.url ?? ""} alt={image.alt_text ?? "JosephLab project image"} width={640} height={640} sizes="(max-width: 768px) 100vw, 33vw" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project image lightbox"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-8"
          onClick={close}
          onWheel={onWheel}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close lightbox"
          >
            <FaTimes />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Previous image"
          >
            <FaChevronLeft />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Next image"
          >
            <FaChevronRight />
          </button>

          <Image
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            src={current.url ?? ""}
            alt={current.alt_text ?? "JosephLab project image"}
            width={1920}
            height={1080}
            sizes="100vw"
          />

          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 font-mono text-sm">
            {active! + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
