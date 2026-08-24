"use client";
import { Tag } from "antd";
import { useTranslation } from "@/components/i18n/LanguageProvider";

// DAAIT build status of a TM/glossary (modules/memory/status.js). Only a
// SUCCESS asset is selectable in profiles and document uploads.
const STATUS_COLORS = {
  NOT_STARTED: "default",
  SCHEDULED: "gold",
  IN_PROGRESS: "processing",
  REBUILDING: "processing",
  SUCCESS: "success",
  FAILED: "error",
};

const MemoryStatusTag = ({ status }) => {
  const { t } = useTranslation();
  if (!status) return <span className="text-slate-400">-</span>;

  const key = `memoryStatus.${status}`;
  const label = t(key);
  return (
    <Tag color={STATUS_COLORS[status] ?? "default"} className="rounded-full">
      {label === key ? status : label}
    </Tag>
  );
};

export default MemoryStatusTag;
