"use client";

import { useEffect } from "react";

const BOT_UA =
  /(bot|crawler|spider|slurp|curl|wget|headless|preview|facebookexternalhit|whatsapp|telegram|discord|bingbot|googlebot|twitterbot|linkedinbot|embedly|pingdom|Google-InspectionTool)/i;

export default function ViewTracker({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (BOT_UA.test(navigator.userAgent)) return;

    const key = `jl_view_${locale}_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage unavailable */
    }

    fetch(`/api/v1/projects/${encodeURIComponent(slug)}/view?locale=${encodeURIComponent(locale)}`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => {
      /* ignore tracking errors */
    });
  }, [slug, locale]);

  return null;
}