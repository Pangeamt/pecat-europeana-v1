"use client";

import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  LoadingOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { CircleCheck, Database, Dumbbell } from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Empty,
  Modal,
  Switch,
  Tag,
  Tooltip,
  message,
} from "antd";

import { updateProjectTms } from "@/services/project.services";

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

const EFFORT_BUCKETS = [
  {
    key: "notMatch",
    wordsKey: "notMatchWords",
    label: "No match",
    range: "< 50%",
    hint: "Full translation",
    bar: "from-rose-500 to-rose-400",
    ring: "ring-rose-200",
    badge: "bg-rose-100 text-rose-700",
    weight: 1,
  },
  {
    key: "mtqe50",
    wordsKey: "mtqe50Words",
    label: "50% – 74%",
    range: "Low QE",
    hint: "Heavy review",
    bar: "from-orange-500 to-amber-400",
    ring: "ring-orange-200",
    badge: "bg-orange-100 text-orange-700",
    weight: 0.82,
  },
  {
    key: "mtqe75",
    wordsKey: "mtqe75Words",
    label: "75% – 84%",
    range: "Medium QE",
    hint: "Moderate review",
    bar: "from-amber-500 to-yellow-400",
    ring: "ring-amber-200",
    badge: "bg-amber-100 text-amber-800",
    weight: 0.62,
  },
  {
    key: "mtqe85",
    wordsKey: "mtqe85Words",
    label: "85% – 94%",
    range: "High QE",
    hint: "Minor adjustments",
    bar: "from-lime-500 to-green-400",
    ring: "ring-lime-200",
    badge: "bg-lime-100 text-lime-800",
    weight: 0.4,
  },
  {
    key: "mtqe95",
    wordsKey: "mtqe95Words",
    label: "95% – 99%",
    range: "Near exact",
    hint: "Light review",
    bar: "from-emerald-500 to-teal-400",
    ring: "ring-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    weight: 0.18,
  },
  {
    key: "mtqe100",
    wordsKey: "mtqe100Words",
    label: "100%",
    range: "Exact match",
    hint: "No effort",
    bar: "from-sky-600 to-blue-500",
    ring: "ring-sky-200",
    badge: "bg-sky-100 text-sky-800",
    weight: 0.02,
  },
];

const EffortModal = ({ open, onClose, stats, requesting, totalSegments }) => {
  const effortSummary = useMemo(() => {
    const buckets = EFFORT_BUCKETS.map((bucket) => ({
      ...bucket,
      count: Number(stats[bucket.key] ?? 0),
      words: Number(stats[bucket.wordsKey] ?? 0),
    }));

    const totalWords = buckets.reduce((sum, b) => sum + b.words, 0);
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);

    // Effort index weighted by source word count per MTQE bucket:
    // E = Σ(words_i × α_i) / totalWords × 100
    const weighted =
      totalWords > 0
        ? buckets.reduce((sum, b) => sum + b.words * b.weight, 0) / totalWords
        : 0;

    const effortIndex = Math.round(weighted * 100);

    return { buckets, totalWords, totalCount, effortIndex };
  }, [stats]);

  const maxWords = Math.max(...effortSummary.buckets.map((b) => b.words), 1);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      destroyOnClose
      className="effort-modal"
      styles={{
        content: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 16,
        },
        body: { padding: 0 },
      }}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 pb-5 pt-6 text-white">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-blue-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-8 size-32 rounded-full bg-violet-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100/90">
              <Dumbbell size={14} />
              Translation effort
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Translation effort
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-300">
              Word-weighted effort by MTQE range. Lower QE scores mean more
              review work per source word.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Effort
              </div>
              <div className="mt-0.5 text-3xl font-bold tabular-nums leading-none">
                {requesting ? "—" : `${effortSummary.effortIndex}%`}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {requesting ? "…" : `${totalSegments} segments`}
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Words
              </div>
              <div className="mt-0.5 text-3xl font-bold tabular-nums leading-none">
                {requesting ? "—" : effortSummary.totalWords.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {requesting ? "…" : "source words"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 bg-slate-50 p-5">
        {effortSummary.buckets.map((bucket, index) => {
          const segPct =
            effortSummary.totalCount > 0
              ? Math.round((bucket.count / effortSummary.totalCount) * 100)
              : 0;
          const wordPct =
            effortSummary.totalWords > 0
              ? Math.round((bucket.words / effortSummary.totalWords) * 100)
              : 0;
          const barWidth = Math.round((bucket.words / maxWords) * 100);

          return (
            <div
              key={bucket.key}
              className={`group rounded-xl border border-white bg-white p-3 shadow-sm ring-1 ${bucket.ring} transition-shadow hover:shadow-md`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {bucket.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${bucket.badge}`}
                    >
                      {bucket.range}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{bucket.hint}</p>
                </div>

                <div className="shrink-0 flex gap-4 text-right">
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Segments
                    </div>
                    <div className="text-xl font-bold tabular-nums leading-none text-slate-900">
                      {requesting ? (
                        <LoadingOutlined spin className="text-base" />
                      ) : (
                        bucket.count
                      )}
                    </div>
                    {!requesting && (
                      <div className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                        {segPct}%
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Words
                    </div>
                    <div className="text-xl font-bold tabular-nums leading-none text-slate-700">
                      {requesting ? (
                        <LoadingOutlined spin className="text-base" />
                      ) : (
                        bucket.words.toLocaleString()
                      )}
                    </div>
                    {!requesting && (
                      <div className="mt-0.5 text-[11px] tabular-nums text-slate-400">
                        {wordPct}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${bucket.bar} transition-all duration-700 ease-out`}
                  style={{ width: requesting ? "0%" : `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

EffortModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stats: PropTypes.object.isRequired,
  requesting: PropTypes.bool.isRequired,
  totalSegments: PropTypes.number.isRequired,
};

const TmUpdateModal = ({ open, onClose, projectId, projectTms, onSaved }) => {
  const [updateMap, setUpdateMap] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = {};
    for (const tm of projectTms) {
      next[tm.id] = Boolean(tm.updateTm);
    }
    setUpdateMap(next);
  }, [open, projectTms]);

  const toggle = (tmId, checked) => {
    setUpdateMap((prev) => ({ ...prev, [tmId]: checked }));
  };

  const handleSave = async () => {
    if (!projectId) return;
    try {
      setSaving(true);
      const updateTmIds = Object.entries(updateMap)
        .filter(([, value]) => value)
        .map(([tmId]) => tmId);
      await updateProjectTms(projectId, updateTmIds);
      message.success("TM update settings saved");
      onSaved?.();
      onClose();
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || "Could not save TM settings",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Translation memory updates"
      okText="Save"
      onOk={handleSave}
      confirmLoading={saving}
      okButtonProps={{ disabled: projectTms.length === 0 }}
      width={480}
      centered
      destroyOnHidden
    >
      <p className="mb-4 text-sm text-slate-500">
        Choose which memories should be updated with the accepted translations
        of this document.
      </p>
      {projectTms.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="This document has no linked memories"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {projectTms.map((tm) => (
            <div
              key={tm.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
            >
              <span className="truncate text-sm font-medium text-slate-700">
                {tm.name ?? tm.id}
              </span>
              <Switch
                size="small"
                checked={Boolean(updateMap[tm.id])}
                onChange={(checked) => toggle(tm.id, checked)}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

TmUpdateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string,
  projectTms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      updateTm: PropTypes.bool,
    }),
  ),
  onSaved: PropTypes.func,
};

TmUpdateModal.defaultProps = {
  projectId: undefined,
  projectTms: [],
  onSaved: undefined,
};

const StatsTus = ({
  stats,
  percentage = 0,
  requesting,
  mode = "",
  tmThreshold = 0,
  tms = 0,
  tmNames = [],
  glossaries = 0,
  glossaryNames = [],
  totalSegments = 0,
  projectId,
  projectTms = [],
  onTmsUpdated,
}) => {
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [showTmModal, setShowTmModal] = useState(false);
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));

  return (
    <>
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
                {requesting ? (
                  <LoadingOutlined spin />
                ) : (
                  Number(stats[key] ?? 0)
                )}
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

          <Tooltip title="View translation effort">
            <Button
              type="primary"
              size="small"
              aria-label="View translation effort"
              onClick={() => setShowEffortModal(true)}
              style={{
                background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
                border: 0,
              }}
            >
              <Dumbbell size={16} />
            </Button>
          </Tooltip>

          <Tooltip title="Configure TM updates">
            <Button
              size="small"
              aria-label="Configure TM updates"
              onClick={() => setShowTmModal(true)}
            >
              <Database size={16} />
            </Button>
          </Tooltip>

          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700"
            aria-label={`Mode ${mode}`}
          >
            <span>Mode: </span>
            <span className="uppercase text-xs font-medium text-gray-400">
              {mode ? `${mode}` : "—"}
            </span>
          </span>

          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700"
            aria-label={`Threshold ${Math.round(tmThreshold * 100)}%`}
          >
            <span>Threshold: </span>
            <Tag color="blue">{tmThreshold ? `${tmThreshold}` : "—"}</Tag>
          </span>

          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700"
            aria-label={`TMS ${tms}`}
            title={
              Array.isArray(tmNames) && tmNames.length ? tmNames.join(", ") : ""
            }
          >
            <span>TMs: </span>
            <Badge count={tms} size="small" className="text-sm" color="blue" />
            {Array.isArray(tmNames) && tmNames.length > 0 ? (
              <span className="max-w-60 truncate text-[11px] text-gray-500">
                {tmNames.join(", ")}
              </span>
            ) : null}
          </span>

          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700"
            aria-label={`Glossaries ${glossaries}`}
            title={
              Array.isArray(glossaryNames) && glossaryNames.length
                ? glossaryNames.join(", ")
                : ""
            }
          >
            <span>Glossaries: </span>
            <Badge
              count={glossaries}
              size="small"
              className="text-sm"
              color="green"
            />
            {Array.isArray(glossaryNames) && glossaryNames.length > 0 ? (
              <span className="max-w-60 truncate text-[11px] text-gray-500">
                {glossaryNames.join(", ")}
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <EffortModal
        open={showEffortModal}
        onClose={() => setShowEffortModal(false)}
        stats={stats}
        requesting={requesting}
        totalSegments={totalSegments}
      />

      <TmUpdateModal
        open={showTmModal}
        onClose={() => setShowTmModal(false)}
        projectId={projectId}
        projectTms={projectTms}
        onSaved={onTmsUpdated}
      />
    </>
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
    notMatch: PropTypes.number,
    mtqe50: PropTypes.number,
    mtqe75: PropTypes.number,
    mtqe85: PropTypes.number,
    mtqe95: PropTypes.number,
    mtqe100: PropTypes.number,
  }).isRequired,
  percentage: PropTypes.number,
  requesting: PropTypes.bool.isRequired,
  mode: PropTypes.string,
  tmThreshold: PropTypes.number,
  tms: PropTypes.number,
  tmNames: PropTypes.arrayOf(PropTypes.string),
  glossaries: PropTypes.number,
  glossaryNames: PropTypes.arrayOf(PropTypes.string),
  totalSegments: PropTypes.number,
  projectId: PropTypes.string,
  projectTms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      updateTm: PropTypes.bool,
    }),
  ),
  onTmsUpdated: PropTypes.func,
};

export default StatsTus;
