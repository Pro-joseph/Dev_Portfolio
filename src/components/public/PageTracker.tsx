"use client";

import { useEffect } from "react";
import { isBot } from "@/lib/bots";

export default function PageTracker({ locale }: { locale: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isBot(navigator.userAgent)) return;

    const path = window.location.pathname;
    const key = `jl_page_${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable */
    }

    fetch("/api/v1/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ path, locale }),
    }).catch(() => {
      /* ignore tracking errors */
    });
  }, [locale]);

  return null;
}