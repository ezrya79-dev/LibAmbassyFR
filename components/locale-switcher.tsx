"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "ع" },
];

export function LocaleSwitcher({ current }: { current: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="flex overflow-hidden rounded-lg border border-stone-200">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setLocale(l.code);
              router.refresh();
            })
          }
          className={`inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm font-medium sm:min-h-9 sm:min-w-9 sm:text-xs ${
            current === l.code ? "bg-[var(--brand)] text-white" : "bg-white hover:bg-stone-100"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
