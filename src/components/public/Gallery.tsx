"use client";

import { useCallback, useEffect, useState } from "react";
import { Media } from "@/lib/types";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

const SPANS = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-1 md:row-span-1",
];

export default function Gallery({ images }: { images: Media[] }) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const prev = useCallback(
    () => setActive((a) => (a === null ? a : (a - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setActive((a) => (a === null ? a : (a + 1) % images.length)),
    [images.length]
  );

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

  const current = active !== null ? images[active] : null;

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 md:h-[800px]">
        {images.map((image, i) => (
          <button
            key={image.id ?? i}
            type="button"
            onClick={() => setActive(i)}
            className={`${SPANS[i % SPANS.length]} relative rounded-jumbo overflow-hidden group text-left cursor-zoom-in`}
          >
            <Image
              className="w-full h-full min-h-64 object-cover transition-transform duration-700 group-hover:scale-110"
              src={image.url ?? ""}
              alt={image.alt_text ?? "JosephLab systems gallery"}
              width={640}
              height={800}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
          </button>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project image lightbox"
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-8"
          onClick={close}
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
            alt={current.alt_text ?? "JosephLab systems gallery"}
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