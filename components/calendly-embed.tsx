"use client";

import { useEffect, useRef } from "react";

// Calendly Inline Widget (embed iframe in-page)
export function CalendlyEmbed({ url, prefill }: { url: string; prefill?: { name?: string; email?: string } }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const full = new URL(url);
    if (prefill?.name) full.searchParams.set("name", prefill.name);
    if (prefill?.email) full.searchParams.set("email", prefill.email);
    full.searchParams.set("hide_gdpr_banner", "1");

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
    if (ref.current) ref.current.dataset.url = full.toString();

    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, [url, prefill?.name, prefill?.email]);

  return (
    <div
      ref={ref}
      className="calendly-inline-widget w-full rounded-xl border border-stone-200 bg-white"
      style={{ minWidth: 320, height: 700 }}
    />
  );
}
