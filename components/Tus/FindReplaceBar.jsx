"use client";
// Find and replace bar of the segment editor (Ctrl+H, as in Trados).
// Presentation only: what to search, what is found and the actions come from
// components/Tus/list.jsx; the text rules live in lib/find-replace.js.
import { Button, Checkbox, Input, Tooltip } from "antd";
import { ChevronDown, ChevronUp, Replace, ReplaceAll, X } from "lucide-react";

import { useTranslation } from "@/components/i18n/LanguageProvider";

export default function FindReplaceBar({
  find,
  onChange,
  onClose,
  onStep,
  onReplaceHere,
  onReplaceAll,
  hits,
  matches,
  replaceable,
  canReplace,
  canReplaceHere,
  busy,
  inputRef,
}) {
  const { t } = useTranslation();
  const locked = hits - replaceable;

  const onFindKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onStep(event.shiftKey ? -1 : 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="find-replace-bar mb-2 flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5"
      role="search"
      aria-label={t("tus.find.title")}
    >
      <Input
        ref={inputRef}
        size="small"
        allowClear
        style={{ width: 220 }}
        aria-label={t("tus.find.findPlaceholder")}
        placeholder={t("tus.find.findPlaceholder")}
        value={find.query}
        onChange={(event) => onChange({ query: event.target.value })}
        onKeyDown={onFindKeyDown}
      />
      <Input
        size="small"
        allowClear
        style={{ width: 220 }}
        aria-label={t("tus.find.replacePlaceholder")}
        placeholder={t("tus.find.replacePlaceholder")}
        value={find.replacement}
        onChange={(event) => onChange({ replacement: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      />
      <Checkbox
        checked={find.matchCase}
        onChange={(event) => onChange({ matchCase: event.target.checked })}
      >
        <span className="text-xs">{t("tus.find.matchCase")}</span>
      </Checkbox>
      <span className="text-xs tabular-nums text-slate-600" role="status" aria-live="polite">
        {find.query
          ? hits
            ? `${t("tus.find.count", { segments: hits, matches })}${
                locked > 0 ? ` · ${t("tus.find.locked", { count: locked })}` : ""
              }`
            : t("tus.find.none")
          : ""}
      </span>
      <span className="inline-flex items-center">
        <Tooltip title={`${t("tus.find.prev")} (Shift+Enter)`}>
          <Button
            size="small"
            type="text"
            aria-label={t("tus.find.prev")}
            icon={<ChevronUp size={15} />}
            disabled={!hits}
            onClick={() => onStep(-1)}
          />
        </Tooltip>
        <Tooltip title={`${t("tus.find.next")} (Enter)`}>
          <Button
            size="small"
            type="text"
            aria-label={t("tus.find.next")}
            icon={<ChevronDown size={15} />}
            disabled={!hits}
            onClick={() => onStep(1)}
          />
        </Tooltip>
      </span>
      {canReplace ? (
        <>
          <Tooltip title={t("tus.find.replaceHereTooltip")}>
            <Button
              size="small"
              icon={<Replace size={14} />}
              disabled={!canReplaceHere || busy}
              onClick={onReplaceHere}
            >
              {t("tus.find.replaceHere")}
            </Button>
          </Tooltip>
          <Tooltip title={t("tus.find.replaceAllTooltip")}>
            <Button
              size="small"
              type="primary"
              icon={<ReplaceAll size={14} />}
              disabled={!replaceable || busy}
              onClick={onReplaceAll}
            >
              {t("tus.find.replaceAll")}{" "}
              <span className="font-bold tabular-nums">{replaceable}</span>
            </Button>
          </Tooltip>
        </>
      ) : null}
      <Tooltip title={`${t("tus.find.close")} (Esc)`}>
        <Button
          size="small"
          type="text"
          className="ml-auto"
          aria-label={t("tus.find.close")}
          icon={<X size={15} />}
          onClick={onClose}
        />
      </Tooltip>
    </div>
  );
}
