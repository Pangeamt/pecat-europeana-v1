"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import locales from "@/lib/locales.json";
import { catalogFromStatic } from "@/lib/language-catalog";

// Options for the language pickers, from DAAIT's catalog (/api/languages, which
// caches it for an hour). The browser keeps the answer for the same hour, so
// opening several forms costs one request. While it loads (or if it fails) the
// pickers show the old static list, so they are never empty.
const BROWSER_TTL_MS = 60 * 60 * 1000;
let memo = null; // { at, languages }
let pending = null;

const staticCatalog = catalogFromStatic(locales);

const load = () => {
  if (memo && Date.now() - memo.at < BROWSER_TTL_MS) return Promise.resolve(memo.languages);
  if (!pending) {
    pending = fetch("/api/languages", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body) => {
        memo = { at: Date.now(), languages: body.languages };
        return body.languages;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
};

export function useLanguageOptions() {
  const { language } = useTranslation();
  const [catalog, setCatalog] = useState(memo ? memo.languages : staticCatalog);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((languages) => {
        if (!cancelled) setCatalog(languages);
      })
      .catch(() => {
        /* keep the static list */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return catalog.map((entry) => ({
    value: entry.code,
    label: entry.names?.[language] || entry.name,
  }));
}
