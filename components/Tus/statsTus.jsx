"use client";

import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  LoadingOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { CircleCheck } from "lucide-react";
import PropTypes from "prop-types";

const METRICS = [
  {
    key: "originalAccepted",
    label: "Accepted",
    icon: CircleCheck,
    colorClass:
      "text-emerald-600 bg-emerald-50 border-emerald-200 bg-emerald-50",
  },
  {
    key: "edited",
    label: "Edited",
    icon: EditOutlined,
    colorClass: "text-blue-600 bg-blue-50 border-blue-200 blue-50",
  },
  {
    key: "notReviewed",
    label: "Not reviewed",
    icon: ClockCircleOutlined,
    colorClass: "text-amber-800 border-amber-600 bg-amber-50",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: CloseCircleOutlined,
    colorClass: "text-rose-800 border-rose-600 bg-rose-50",
  },
];

const StatsTus = ({
  stats,
  percentage,
  requesting,
  mode,
  tmThreshold,
  tms,
}) => {
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));

  return (
    <div className="tus-stats mb-2 px-2 py-1.5 ">
      <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {METRICS.map(({ key, label, icon: Icon, colorClass }) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium ${colorClass}`}
          >
            <Icon size={16} className="text-sm" />
            <span>{label}</span>
            <span className="font-bold tabular-nums">
              {requesting ? <LoadingOutlined spin /> : Number(stats[key] ?? 0)}
            </span>
          </span>
        ))}

        <span
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700"
          role="status"
          aria-label={
            requesting ? "Loading progress" : `Reviewed ${pct} percent`
          }
        >
          <PieChartOutlined className="text-sm" />
          <span>Reviewed</span>
          <span className="font-bold tabular-nums">
            {requesting ? "—" : `${pct}%`}
          </span>
          <span
            className="relative inline-block h-1 w-16 shrink-0 overflow-hidden rounded-full bg-violet-200/70"
            role="progressbar"
            aria-valuenow={requesting ? undefined : pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Review progress"
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-violet-600 transition-[width] duration-500 ease-out"
              style={{ width: requesting ? "0%" : `${pct}%` }}
            />
          </span>
        </span>

        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700"
          role="mode"
          aria-label={`Mode ${mode}`}
        >
          <span>Mode: </span>
          <span className="uppercase text-xs font-medium text-gray-400">
            {mode ? `${mode}` : "—"}
          </span>
        </span>

        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700"
          role="tmThreshold"
          aria-label={`TM Threshold ${Math.round(tmThreshold * 100)}%`}
        >
          <span>TM Threshold: </span>
          <span className="font-bold tabular-nums">
            {tmThreshold ? `${tmThreshold}` : "—"}
          </span>
        </span>

        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700"
          role="tms"
          aria-label={`TMS ${tms}`}
        >
          <span>TMS: </span>
          <span className="font-bold tabular-nums">{tms ? `${tms}` : "—"}</span>
        </span>
      </div>
    </div>
  );
};

StatsTus.propTypes = {
  stats: PropTypes.shape({
    edited: PropTypes.number,
    originalAccepted: PropTypes.number,
    notReviewed: PropTypes.number,
    rejected: PropTypes.number,
    translated_mt: PropTypes.number,
    porcent: PropTypes.number,
  }).isRequired,
  percentage: PropTypes.number,
  requesting: PropTypes.bool.isRequired,
  mode: PropTypes.string.isRequired,
  tmThreshold: PropTypes.number.isRequired,
  tms: PropTypes.number.isRequired,
};

StatsTus.defaultProps = {
  percentage: 0,
};

export default StatsTus;
