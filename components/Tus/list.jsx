"use client";
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Input,
  message,
  Modal,
  Select,
  Slider,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import axios from "axios";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, CircleCheck, CircleX, CheckCheck, Download, FileDown, Filter, Info, LoaderCircle, LockIcon, Redo2, Save, Undo2, Search, UnlockIcon } from "lucide-react";
import { useParams } from "next/navigation";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Highlighter from "react-highlight-words";
import { useHotkeys } from "react-hotkeys-hook";
import XMLViewer from "react-xml-viewer";

import GlossaryTool from "@/components/Tus/glossaryTool";
import StatsTus from "@/components/Tus/statsTus";
import SuggestionTool from "@/components/Tus/suggestionTool";
import TmTool from "@/components/Tus/tmTool";
import {
  getDocument as getProject,
  getDocumentConfigByShareToken,
} from "@/services/document.services";
import {
  appendTu,
  appendTuByShareToken,
  confirmTu,
  confirmTuByShareToken,
  confirmTusBulk,
  confirmTusBulkByShareToken,
  evaluateTu,
  evaluateTuByShareToken,
  getTus,
  getTusByShareToken,
} from "@/services/tus.services";
import { userStore } from "@/store";
import { getTextDirection } from "@/lib/locale-direction";
import CustomTextArea from "../../components/CustomTextArea";
import TagEditor from "@/components/TagEditor";
import {
  TagText,
  hasInlineTags,
  stripInlineTags,
} from "@/components/shared/inline-tags";
import { computeEffort } from "@/lib/effort";
import {
  completionOf,
  confirmableRows,
  nextPendingIndex,
} from "@/lib/document-completion";
import { chunksOf } from "@/lib/bulk-confirm";
import { useProcessedDownload } from "@/components/Documents/useProcessedDownload";
import { getDocumentOriginalLink } from "@/services/document.services";
import {
  actionEntry,
  emptyActionHistory,
  recordAction,
  recordText,
  redoAction,
  redoText,
  undoAction,
  undoText,
} from "@/lib/edit-history";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import {
  STATUS_FILTER_VALUES,
  matchesStatusSelection,
  segmentNumberOf,
  segmentOrigin,
  segmentState,
} from "@/lib/segment-status";
import SegmentStatusIcon from "./SegmentStatusIcon";
import SegmentHistory from "./SegmentHistory";
import { tagIssue } from "@/modules/documents/tag-check";
import { isSpliceFormat } from "@/lib/utils";

const stripHTML = (html) => {
  let temporalDiv = document.createElement("div");
  temporalDiv.innerHTML = html;
  return temporalDiv.textContent || temporalDiv.innerText || "";
};

// Shared color bands for both QE columns (scores 0-1).
const qeBandColor = (score) =>
  score === null
    ? "default"
    : score >= 0.85
      ? "green"
      : score >= 0.65
        ? "gold"
        : "red";

// Column filters and sorters as plain functions: the table uses them, and so
// does the "visible list" (navigation and the filter-bar counters), which
// must show exactly the rows the table shows.

const matchesTextFilter = (dataIndex, value, record) => {
  const fieldValue =
    dataIndex === "reviewLiteral"
      ? record.reviewLiteral || record.translatedLiteral
      : record[dataIndex];
  if (!fieldValue) return false;
  // Tags are chips, not text: "Hello world" must match "Hello <g1>world</g1>".
  return stripInlineTags(fieldValue.toString())
    .toLowerCase()
    .includes(value.toString().toLowerCase());
};

// Lock column filter: "locked" / "open".
const matchesLockFilter = (value, record) =>
  value === "locked" ? Boolean(record.block) : !record.block;

// Each takes the column's WHOLE selection: most columns pass when any of
// their values matches; the status column reads its selection as two groups
// (situation and origin, see matchesStatusSelection).
const anyOf = (match) => (values, record) =>
  values.some((value) => match(value, record));

const COLUMN_FILTERS = {
  status: (values, record) => matchesStatusSelection(values, record),
  block: anyOf(matchesLockFilter),
  srcLiteral: anyOf((value, record) => matchesTextFilter("srcLiteral", value, record)),
  reviewLiteral: anyOf((value, record) =>
    matchesTextFilter("reviewLiteral", value, record),
  ),
};

const COLUMN_SORTERS = {
  mtqeV2Score: (a, b) => (a.mtqeV2Score ?? -1) - (b.mtqeV2Score ?? -1),
};

const isConfirmed = (doc) =>
  doc?.Status === "ACCEPTED" || doc?.Status === "EDITED";

// Whether the caret sits on the first ("up") or last ("down") visual line of
// the editor: only then do the plain arrow keys leave the segment.
const caretOnEdgeLine = (container, direction) => {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      return false;
    }
    const all = document.createRange();
    all.selectNodeContents(container);
    const lines = [...all.getClientRects()].filter((rect) => rect.height > 0);
    if (lines.length === 0) return true;
    const caret =
      selection.getRangeAt(0).getClientRects()[0] ??
      (selection.anchorNode?.nodeType === 1
        ? selection.anchorNode
        : selection.anchorNode?.parentElement
      )?.getBoundingClientRect();
    if (!caret) return true;
    const half = (caret.height || 16) / 2;
    return direction === "down"
      ? caret.bottom >= Math.max(...lines.map((rect) => rect.bottom)) - half
      : caret.top <= Math.min(...lines.map((rect) => rect.top)) + half;
  } catch {
    return false;
  }
};

const EMPTY_STATS = {
  notReviewed: 0,
  rejected: 0,
  originalAccepted: 0,
  edited: 0,
  translated_mt: 0,
  porcent: 0,
  notMatch: 0,
  mtqe100: 0,
  mtqe95: 0,
  mtqe85: 0,
  mtqe75: 0,
  mtqe50: 0,
  notMatchWords: 0,
  mtqe50Words: 0,
  mtqe75Words: 0,
  mtqe85Words: 0,
  mtqe95Words: 0,
  mtqe100Words: 0,
};

// Pass `shareToken` to render the standalone, no-login "share as translator"
// editor (app/share/tu/[token]/page.jsx): every network call is routed
// through the token-authenticated /api/share/tu/[token]/* endpoints instead
// of the session-authenticated ones, and the document id is never taken
// from the URL (there is none) — it comes back from the config fetch.
// Where the active segment sits after a keyboard move: a little above the
// middle of the list, so the reviewer keeps looking at the same spot and sees
// a couple of segments above it and the rest below.
const ACTIVE_ROW_ANCHOR = 0.4;

const TusList = ({ shareToken } = {}) => {
  const { t } = useTranslation();
  const { projectId: routeProjectId } = useParams();
  const projectId = shareToken ? null : routeProjectId;
  const [data, setData] = useState([]);
  const [projectConfig, setProjectConfig] = useState(null);

  // QE score filter: one rule over the QE v2 score [op+slider] — applied
  // only when the user confirms it ("Apply"). Clear resets the control to the
  // top (<= 1.00) and shows every segment. The filtered list is the working
  // list: confirm on a segment advances to the next row within it.
  const NEUTRAL_RULE = { op: "<=", value: 1 };
  const [v2Rule, setV2Rule] = useState(NEUTRAL_RULE);
  // Snapshot of the rule at the moment "Apply" was pressed (null = off).
  const [appliedScoreFilter, setAppliedScoreFilter] = useState(null);

  const [selectedRow, setSelectedRow] = useState(null);
  // Text typed in the editor and NOT saved yet: { [tuId]: text }. There is no
  // autosave; the Save button (or Ctrl+S) persists every draft. Kept per
  // segment, so moving to another row never loses what was typed, and mirrored
  // in a ref for the callbacks (hotkeys, beforeunload) that outlive a render.
  const [drafts, setDrafts] = useState({});
  const draftsRef = useRef({});
  const [savingDrafts, setSavingDrafts] = useState(false);
  // Suggestion / TMs / Glossaries panel above the grid: COLLAPSED by default
  // (it took a third of the screen even when empty); the choice is remembered.
  const TOP_PANEL_KEY = "pecat.tus.topPanelOpen";
  const [topPanelOpen, setTopPanelOpen] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(TOP_PANEL_KEY) === "1") setTopPanelOpen(true);
    } catch {
      // storage blocked: stay collapsed
    }
  }, []);
  const toggleTopPanel = () => {
    setTopPanelOpen((open) => {
      try {
        window.localStorage.setItem(TOP_PANEL_KEY, open ? "0" : "1");
      } catch {
        // storage blocked: the toggle still works for this visit
      }
      return !open;
    });
  };
  const [saveFailed, setSaveFailed] = useState(false);
  // "Confirm everything in the filter": { done, total } while it runs.
  const [bulkProgress, setBulkProgress] = useState(null);
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const downloadProcessed = useProcessedDownload(baseURL);
  const [downloading, setDownloading] = useState(false);
  // Undo / redo (lib/edit-history.js), kept for the session: what was typed
  // in each segment ({ [tuId]: history }) and the saved actions. Refs, because
  // the key handlers outlive a render; the tick re-renders the two buttons.
  const textHistoryRef = useRef({});
  const actionHistoryRef = useRef(emptyActionHistory());
  const undoBusyRef = useRef(false);
  const [, setHistoryTick] = useState(0);
  const touchHistory = () => setHistoryTick((tick) => tick + 1);
  // Bumped when an LLM suggestion is applied so the target editor remounts
  // with the new reviewLiteral (Quill/TagEditor only read the initial value).
  const [editorRefreshKey, setEditorRefreshKey] = useState(0);
  // Live draft evaluation: when the reviewer pauses typing, the draft is
  // re-scored (QE v2) and re-reviewed (LLM). Ephemeral — nothing persists
  // until the segment is confirmed.
  const [liveEval, setLiveEval] = useState(null);
  const liveEvalTimerRef = useRef(null);
  const liveEvalSeqRef = useRef(0);

  const [open, setOpen] = useState(false);
  const userSt = userStore();
  const { user } = userSt;
  const [messageApi, contextHolder] = message.useMessage();
  const tblRef = React.useRef(null);

  const [requesting, setRequesting] = useState(true);

  const [xmlData, setXmlData] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  // Column filters and sort the table currently applies (from its onChange).
  // AntD applies them internally at render time, so they are replayed over
  // `data` (see orderedData) for navigation and the counters to follow what
  // the reviewer actually sees.
  const [tableView, setTableView] = useState({ filters: {}, sorter: null });
  // Segments with a request in flight: { [tuId]: "status" | "lock" }. Only
  // that row shows a spinner and turns read-only; every other row stays
  // editable. Mirrored in a ref so a second Ctrl+Enter is ignored at once.
  const [pending, setPending] = useState({});
  const pendingRef = useRef({});
  const beginPending = (tuId, kind) => {
    if (pendingRef.current[tuId]) return false;
    pendingRef.current = { ...pendingRef.current, [tuId]: kind };
    setPending(pendingRef.current);
    return true;
  };
  const endPending = (tuId) => {
    const next = { ...pendingRef.current };
    delete next[tuId];
    pendingRef.current = next;
    setPending(next);
  };
  const [xmlRequesting, setXmlRequesting] = useState(null);
  // A keyboard move (confirm, arrows) asks for the list to follow: the id of
  // the segment to bring to the anchor, and whether it was a long jump (page
  // change) that is placed at once and flashed instead of scrolled.
  const navIntentRef = useRef(null);
  // Row that briefly lights up on arrival when the list did not scroll to it.
  const [arrivedId, setArrivedId] = useState(null);
  // Short, self-clearing line in the filter bar telling what a move skipped
  // ("104 -> 110 - 5 locked skipped", "Page 3 of 78", "nothing left").
  const [navNotice, setNavNotice] = useState(null);
  const navNoticeTimerRef = useRef(null);
  const announce = (text) => {
    if (navNoticeTimerRef.current) clearTimeout(navNoticeTimerRef.current);
    setNavNotice(text);
    navNoticeTimerRef.current = setTimeout(() => setNavNotice(null), 2600);
  };
  useEffect(
    () => () => {
      if (navNoticeTimerRef.current) clearTimeout(navNoticeTimerRef.current);
    },
    [],
  );

  const isSegmentBlocked = (doc) => Boolean(doc?.block);

  // Manual segment lock/unlock is a management action: session ADMIN/SUPER
  // only, never the anonymous share-link translator (also enforced server-side).
  const canToggleLock =
    !shareToken && ["ADMIN", "SUPER"].includes(user?.role);

  // Brings the segment of a keyboard move to its anchor in the list. One
  // short smooth scroll when it is near; a long way (or another page) is
  // placed at once and the row flashes, because a long travel is what makes
  // the list hard to follow. Runs after the row has rendered (the selected
  // row grows: it holds the editor), and puts the caret in its editor.
  useEffect(() => {
    const intent = navIntentRef.current;
    if (!intent || intent.id !== selectedRow?.id) return undefined;
    let attempts = 0;
    let frame = null;
    let flashTimer = null;
    const place = () => {
      const root = tblRef.current?.nativeElement ?? document;
      const body = root.querySelector(".ant-table-body");
      const row = body?.querySelector(
        `tr[data-row-key="${window.CSS?.escape ? CSS.escape(intent.id) : intent.id}"]`,
      );
      if (!body || !row) {
        // The page has not rendered that row yet (page change).
        attempts += 1;
        if (attempts < 30) frame = requestAnimationFrame(place);
        return;
      }
      navIntentRef.current = null;
      const bodyRect = body.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const anchor = Math.max(
        8,
        body.clientHeight * ACTIVE_ROW_ANCHOR - rowRect.height / 2,
      );
      const top = Math.max(0, body.scrollTop + (rowRect.top - bodyRect.top) - anchor);
      const distance = Math.abs(top - body.scrollTop);
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const smooth = !intent.jump && !reduced && distance <= body.clientHeight;
      if (distance > 4) body.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
      if (!smooth || distance <= 4) {
        setArrivedId(intent.id);
        flashTimer = setTimeout(() => setArrivedId(null), 700);
      }
      // Ready to type: the caret goes to the segment's editor without the
      // browser scrolling on its own.
      row.querySelector(".tag-editor, .ql-editor")?.focus({ preventScroll: true });
    };
    frame = requestAnimationFrame(place);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (flashTimer) {
        clearTimeout(flashTimer);
        setArrivedId(null);
      }
    };
  }, [selectedRow?.id, page, pageSize]);

  useEffect(() => {
    const get = async () => {
      try {
        setRequesting(true);
        const response = shareToken
          ? await getTusByShareToken(shareToken)
          : await getTus(projectId);
        const docs = response.data.docs || [];
        setData(docs);
        setSelectedRow((prev) => prev || docs[0] || null);
        setRequesting(false);
      } catch (error) {
        console.error(error);
        messageApi.error(
          error?.response?.data?.error?.message || "Project is not ready yet",
        );
        setData([]);
        setSelectedRow(null);
        setRequesting(false);
      }
    };
    if (shareToken || projectId) get();
  }, [shareToken, projectId, messageApi]);

  const getProjectConfig = useCallback(async () => {
    try {
      const response = shareToken
        ? await getDocumentConfigByShareToken(shareToken)
        : await getProject(projectId);
      setProjectConfig(response.data);
    } catch (error) {
      console.error(error);
      messageApi.error(
        error?.response?.data?.error?.message || "Error getting project config",
      );
      setProjectConfig(null);
    }
  }, [shareToken, projectId, messageApi]);

  useEffect(() => {
    const run = async () => {
      await getProjectConfig();
    };
    run();
  }, [getProjectConfig]);

  // While QE v2 is still scoring the document in the background
  // (pipelineStats.stage === "SCORING"), pull the scores every 5 s and merge
  // ONLY mtqeV2Score into the grid: selection, unsaved drafts, page and sort
  // order are never touched. The project config is read FIRST and the
  // segments after it, so the tick that sees "DONE" already carries the last
  // scores. Rows with an unsaved draft keep their live score.
  const scoring = projectConfig?.pipelineStats?.stage === "SCORING";
  useEffect(() => {
    if (!scoring) return undefined;
    let cancelled = false;
    const tick = async () => {
      try {
        const configResponse = shareToken
          ? await getDocumentConfigByShareToken(shareToken)
          : await getProject(projectId);
        const tusResponse = shareToken
          ? await getTusByShareToken(shareToken)
          : await getTus(projectId);
        if (cancelled) return;
        const scores = new Map(
          (tusResponse.data.docs || []).map((doc) => [doc.id, doc.mtqeV2Score]),
        );
        const fresh = (row) => {
          const score = scores.get(row.id);
          return typeof score === "number" &&
            score !== row.mtqeV2Score &&
            draftsRef.current[row.id] == null
            ? { ...row, mtqeV2Score: score }
            : row;
        };
        setData((prev) => prev.map(fresh));
        setSelectedRow((prev) => (prev ? fresh(prev) : prev));
        setProjectConfig(configResponse.data);
      } catch (error) {
        // Quiet: the next tick retries; the grid keeps what it has.
        console.warn("QE v2 refresh failed", error?.message);
      }
    };
    const timer = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [scoring, shareToken, projectId]);

  const stats = (() => {
    if (requesting || data.length === 0) return EMPTY_STATS;

    const newStats = { ...EMPTY_STATS };
    let totalStats = 0;

    data.forEach((doc) => {
      if (doc.Status === "NOT_REVIEWED" || doc.Status === "TRANSLATED_MT") {
        newStats.notReviewed += 1;
      } else if (doc.Status === "REJECTED") {
        newStats.rejected += 1;
        totalStats += 1;
      } else if (doc.Status === "ACCEPTED") {
        newStats.originalAccepted += 1;
        totalStats += 1;
      } else if (doc.Status === "EDITED") {
        newStats.edited += 1;
        totalStats += 1;
      }

      const mtqe = doc.mtqeV2Score;
      // Placeholders (<x1/>) are not words.
      const srcWords = doc.srcLiteral
        ? stripInlineTags(doc.srcLiteral).split(/\s+/).filter(Boolean).length
        : 0;
      if (mtqe == null || mtqe < 0.5) {
        newStats.notMatch += 1;
        newStats.notMatchWords += srcWords;
      } else if (mtqe >= 0.5 && mtqe < 0.75) {
        newStats.mtqe50 += 1;
        newStats.mtqe50Words += srcWords;
      } else if (mtqe >= 0.75 && mtqe < 0.85) {
        newStats.mtqe75 += 1;
        newStats.mtqe75Words += srcWords;
      } else if (mtqe >= 0.85 && mtqe < 0.95) {
        newStats.mtqe85 += 1;
        newStats.mtqe85Words += srcWords;
      } else if (mtqe >= 0.95 && mtqe < 1) {
        newStats.mtqe95 += 1;
        newStats.mtqe95Words += srcWords;
      } else if (mtqe === 1) {
        newStats.mtqe100 += 1;
        newStats.mtqe100Words += srcWords;
      }
    });

    newStats.porcent = parseFloat(
      ((100 * totalStats) / data.length).toFixed(2),
    );
    return newStats;
  })();

  // ----- Submission locks -------------------------------------------------
  // The share link IS the translator; in session mode roles come from the
  // document's assignments. PM = ADMIN/SUPER, never locked out.
  const translatorSubmitted = Boolean(projectConfig?.translatorSubmittedAt);
  const reviewerSubmitted = Boolean(projectConfig?.reviewerSubmittedAt);

  // SDLXLIFF targets must carry the source's tags in the SOURCE'S ORDER (the
  // export writes nothing else); other formats only need the same set.
  const orderedTags = isSpliceFormat(projectConfig?.extension);
  // Translated segments whose tags do not match: they cannot be approved and
  // the export will not write them, so the reviewer is told up front.
  const tagIssueCount = useMemo(
    () =>
      data.filter((row) => {
        const target = row.reviewLiteral || row.translatedLiteral;
        return (
          row.visible !== false &&
          !row.block &&
          target &&
          hasInlineTags(row.srcLiteral) &&
          !tagIssue(row.srcLiteral, target, { ordered: orderedTags }).ok
        );
      }).length,
    [data, orderedTags],
  );
  const isPm = !shareToken && ["ADMIN", "SUPER"].includes(user?.role);
  const isTranslator = shareToken
    ? true
    : Boolean(
        projectConfig?.translatorId && projectConfig.translatorId === user?.id,
      );
  const isReviewer =
    !shareToken &&
    Boolean(projectConfig?.reviewerId && projectConfig.reviewerId === user?.id);
  // Locked when every role the viewer holds was submitted (mirrors the
  // backend rule in modules/tus/service.js — the server enforces it anyway).
  const editingLocked = shareToken
    ? translatorSubmitted
    : !isPm &&
      (isTranslator || isReviewer) &&
      !(
        (isTranslator && !translatorSubmitted) ||
        (isReviewer && !reviewerSubmitted)
      );

  // ----- QE score filter --------------------------------------------------
  // A rule left at its resting position (<= 1.00) matches everything, so it
  // is treated as inactive — segments without that score are not excluded.
  const isNeutralRule = (rule) => rule.op === "<=" && rule.value >= 1;
  const scoreFilterActive = appliedScoreFilter !== null;

  const tableData = useMemo(() => {
    if (!appliedScoreFilter) return data;

    const evalRule = (record, { op, value }) => {
      const score = record?.mtqeV2Score;
      if (typeof score !== "number") return false;
      switch (op) {
        case "=":
          // "equal" at display precision (scores render with 2 decimals)
          return Math.abs(score - value) < 0.005;
        case ">=":
          return score >= value;
        case "<=":
          return score <= value;
        case "<":
          return score < value;
        case ">":
          return score > value;
        default:
          return true;
      }
    };

    return data.filter((record) => evalRule(record, appliedScoreFilter));
  }, [data, appliedScoreFilter]);

  // Effort model (lib/effort.js): QE v2 bands, weighted words and estimated
  // hours. Project.settings.effort can override weights/throughput. Also
  // powers the filter-bar counters.
  const effortOptions = projectConfig?.settings?.effort;
  const documentEffort = useMemo(
    () => computeEffort(data, effortOptions),
    [data, effortOptions],
  );

  // Rows in the order the table displays them: the MTQE score filter first,
  // then the table's own column filters (status, source/target search) and
  // sort. This is the working list for navigation and for the counters.
  const orderedData = useMemo(() => {
    let rows = tableData;
    for (const [key, values] of Object.entries(tableView.filters ?? {})) {
      const match = COLUMN_FILTERS[key];
      if (!match || !values?.length) continue;
      rows = rows.filter((record) => match(values, record));
    }
    const compare = tableView.sorter && COLUMN_SORTERS[tableView.sorter.key];
    if (compare) {
      const direction = tableView.sorter.order === "descend" ? -1 : 1;
      rows = [...rows].sort((a, b) => direction * compare(a, b));
    }
    return rows;
  }, [tableData, tableView]);
  // Any filter (score, status or text search) that leaves rows out.
  const listFiltered = orderedData.length !== data.length;

  const filteredEffort = useMemo(
    () =>
      listFiltered ? computeEffort(orderedData, effortOptions) : documentEffort,
    [listFiltered, orderedData, effortOptions, documentEffort],
  );
  const totalWords = documentEffort.totalWords;
  const filteredWords = filteredEffort.totalWords;

  const applyScoreFilter = () => {
    setAppliedScoreFilter(isNeutralRule(v2Rule) ? null : v2Rule);
  };

  const clearScoreFilter = () => {
    setV2Rule(NEUTRAL_RULE);
    setAppliedScoreFilter(null);
  };

  // The filtered list is the working list: if the current selection falls
  // out of it (filter changed, or the confirmed segment no longer matches),
  // jump to the first visible row so confirm/next keeps flowing. Render-phase
  // state adjustment (per React's "you might not need an effect") — React
  // re-renders immediately with the corrected selection.
  if (
    scoreFilterActive &&
    tableData.length > 0 &&
    selectedRow &&
    !tableData.some((row) => row.id === selectedRow.id)
  ) {
    setSelectedRow(tableData[0]);
  }

  // All TM matches DAAIT returned for the segment, unfiltered.
  const tmInfo = useMemo(
    () => (Array.isArray(selectedRow?.tmInfo) ? selectedRow.tmInfo : []),
    [selectedRow?.tmInfo],
  );

  const glossaryInfo = useMemo(() => {
    const info = selectedRow?.glossaryInfo;
    if (!Array.isArray(info)) return [];
    return info;
  }, [selectedRow?.glossaryInfo]);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters, confirm) => {
    clearFilters();
    setSearchText("");
    setSearchedColumn("");
    confirm();
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div
        style={{ padding: 8 }}
        onKeyDown={(e) => e.stopPropagation()}
        role="search"
        className="text-gray-500"
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedKeys(value ? [value] : []);
            if (!value) {
              setSearchText("");
              setSearchedColumn("");
              confirm({ closeDropdown: false });
            }
          }}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
            color: "#666",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<Search size={15} />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <Search size={15} style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) => matchesTextFilter(dataIndex, value, record),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    // Inline-code placeholders (<g1>, <x2/>…) render as chips, never as raw
    // text; the search highlight applies only to the text between them.
    render: (text, record) => (
      <div style={{ wordWrap: "break-word", wordBreak: "break-word" }}>
        <TagText
          info={record?.tagInfo}
          text={text ? text.toString() : ""}
          renderText={
            searchedColumn === dataIndex
              ? (part) => (
                  <Highlighter
                    highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={part}
                  />
                )
              : undefined
          }
        />
      </div>
    ),
  });

  const sourceDir = getTextDirection(projectConfig?.sourceLanguage);
  const targetDir = getTextDirection(projectConfig?.targetLanguage);

  const columns = [
    {
      title: "No.",
      dataIndex: "index",
      key: "index",
      width: 50,
      render: (_, record, index) => {
        // The segment's own number -- the one the client's CAT tool shows for
        // it when the file said so, else its order in the document -- so it
        // stays the same whatever filter or sort is applied.
        const number = segmentNumberOf(
          record,
          (page - 1) * pageSize + index + 1,
        );
        if (selectedRow && selectedRow.id === record.id) {
          return (
            <div className="absolute top-2 left-2">
              <Tag color="#D97706">{number}</Tag>
            </div>
          );
        }
        return <code className="absolute top-2 left-4">{number}</code>;
      },
    },
    {
      title: "Source",
      dataIndex: "srcLiteral",
      key: "srcLiteral",
      width: "40%",
      minWidth: 400,
      textWrap: "word-break",
      ...getColumnSearchProps("srcLiteral"),
      render: (text, record) => {
        const srcLiteral = getColumnSearchProps("srcLiteral");
        return (
          <div
            dir={sourceDir}
            style={{
              wordWrap: "break-word",
              wordBreak: "break-word",
              textAlign: sourceDir === "rtl" ? "right" : "left",
            }}
          >
            {srcLiteral.render(text, record)}
          </div>
        );
      },
    },
    {
      title: "Target",
      dataIndex: "reviewLiteral",
      key: "reviewLiteral",
      width: "40%",
      ...getColumnSearchProps("reviewLiteral"),
      render: (text, record) => {
        const aux = drafts[record.id] ?? (text || record.translatedLiteral || "");

        // Locked, or with a save in flight: read-only until it answers.
        if (record.block || pending[record.id]) {
          const reviewLiteral = getColumnSearchProps("reviewLiteral");
          return (
            <div
              className="text-gray-500"
              dir={targetDir}
              style={{
                wordWrap: "break-word",
                wordBreak: "break-word",
                textAlign: targetDir === "rtl" ? "right" : "left",
              }}
            >
              {reviewLiteral.render(aux, record)}
            </div>
          );
        }

        if (selectedRow && record.id === selectedRow.id) {
          const initialValue =
            selectedRow.reviewLiteral || selectedRow.translatedLiteral;
          // Submitted work renders read-only: the row can be inspected but
          // the editor never mounts (the backend rejects writes anyway).
          if (editingLocked) {
            const aux = initialValue ?? "";
            return (
              <div
                dir={targetDir}
                style={{
                  wordWrap: "break-word",
                  wordBreak: "break-word",
                  textAlign: targetDir === "rtl" ? "right" : "left",
                }}
              >
                {hasInlineTags(aux) ? <TagText text={aux} info={selectedRow.tagInfo} /> : stripHTML(aux)}
              </div>
            );
          }
          // Segments with inline-code placeholders use the chip editor: Quill
          // parses the value as HTML and silently destroys the tags. The
          // others keep Quill and its LanguageTool spellchecker.
          const Editor =
            hasInlineTags(selectedRow.srcLiteral) || hasInlineTags(initialValue)
              ? TagEditor
              : CustomTextArea;
          return (
            <div onKeyDownCapture={handleHistoryKeys}>
            <Editor
              key={`${record.id}-${editorRefreshKey}`}
              dir={targetDir}
              value={initialValue}
              source={selectedRow.srcLiteral}
              {...(Editor === TagEditor
                ? { tagInfo: selectedRow.tagInfo, ordered: orderedTags }
                : {})}
              setValue={
                Editor === TagEditor
                  ? changeTextInTagEditor
                  : changeTextInTextarea
              }
              onKeyDown={async (e) => {
                // Ctrl+Enter saves; Ctrl+Shift+Enter rejects (below). Without
                // the !shiftKey both ran: the segment was saved AND rejected.
                if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  save(selectedRow.reviewLiteral, { advance: true });
                }
                if (e.key === "Enter" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  reject();
                }
                if (e.key === "ArrowDown" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(1);
                }
                if (e.key === "ArrowUp" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(-1);
                }
                // Plain Down on the last line / Up on the first one move to
                // the next / previous segment of the list, as in a CAT grid.
                if (
                  (e.key === "ArrowDown" || e.key === "ArrowUp") &&
                  !e.ctrlKey &&
                  !e.shiftKey &&
                  !e.altKey &&
                  !e.metaKey
                ) {
                  const direction = e.key === "ArrowDown" ? "down" : "up";
                  const box =
                    e.currentTarget.querySelector?.(".ql-editor") ||
                    e.currentTarget;
                  if (caretOnEdgeLine(box, direction)) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(direction === "down" ? 1 : -1);
                  }
                }
                if ((e.key === "s" || e.key === "S") && e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  saveDrafts();
                }
              }}
            />
            </div>
          );
        } else {
          const reviewLiteral = getColumnSearchProps("reviewLiteral");
          return (
            <div
              dir={targetDir}
              style={{ textAlign: targetDir === "rtl" ? "right" : "left" }}
            >
              {reviewLiteral.render(aux, record)}
            </div>
          );
        }
      },
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "status",
      width: 100,
      // The values are the review status codes; the reviewer reads them in
      // words (and in their language).
      // Everything the column can show: the situation (icon) and the origin
      // (badge). The table calls onFilter once per chosen value and keeps the
      // row if any call says yes, so each call judges the whole selection.
      filters: STATUS_FILTER_VALUES.map((value) => ({
        text: t(`tus.status.${value}`),
        value,
      })),
      onFilter: (value, record) =>
        matchesStatusSelection(tableView.filters?.status ?? [value], record),
      render: (text, record) => {
        // Confirm / reject / save in flight: the spinner replaces the status
        // icon of this row only.
        if (pending[record.id] === "status") {
          return (
            <div className="absolute top-2 left-2">
              <LoaderCircle size={18} className="animate-spin text-gray-400" />
            </div>
          );
        }
        // Display only, read as in a CAT tool: confirmation level + origin
        // of the target (see SegmentStatusIcon). Locked segments show the
        // level the client's file gave them.
        const hasDraft = drafts[record.id] != null;
        const by = record.reviewedAt ? record.reviewedByName : null;
        const origin = segmentOrigin(record, { hasDraft });
        const tooltip = `${t(`tus.state.${segmentState(record, { hasDraft })}`)}${
          origin ? ` · ${origin.text}` : ""
        }${by ? ` — ${by}` : ""}`;
        return (
          <div className="absolute top-2 left-2">
            {/* Hover: the status in words and the segment's edit history. */}
            <SegmentHistory tu={record} shareToken={shareToken} title={tooltip}>
              <span>
                <SegmentStatusIcon tu={record} hasDraft={hasDraft} />
              </span>
            </SegmentHistory>
          </div>
        );
      },
    },
    {
      title: <LockIcon size={16} className="text-gray-800" />,
      width: 80,
      dataIndex: "block",
      key: "block",
      // Filtered, not sorted: "show me the locked ones" / "the open ones".
      filters: [
        { text: t("tus.lock.locked"), value: "locked" },
        { text: t("tus.lock.open"), value: "open" },
      ],
      onFilter: matchesLockFilter,
      render: (value, record) => {
        // Lock/unlock in flight: the spinner replaces the padlock of this row.
        if (pending[record.id] === "lock") {
          return (
            <LoaderCircle size={16} className="animate-spin text-gray-400" />
          );
        }
        const reason = value
          ? {
              TM_MATCH: "TM exact match",
              LLM_JUDGE: "Approved by LLM judge",
              INTERNAL: "Locked in the source file",
              MANUAL: "Locked manually",
            }[record.blockReason]
          : null;
        const icon = value ? (
          <LockIcon size={16} className="text-gray-800" />
        ) : (
          <UnlockIcon size={16} className="text-gray-400" />
        );

        // ADMIN/SUPER toggle the lock in place; everyone else just sees it.
        if (!canToggleLock) {
          return reason ? <Tooltip title={reason}>{icon}</Tooltip> : icon;
        }
        return (
          <Tooltip
            title={`${reason ? `${reason} — ` : ""}${
              value ? "Click to unlock" : "Click to lock"
            }`}
          >
            <Button
              type="text"
              size="small"
              icon={icon}
              disabled={Boolean(pending[record.id])}
              onClick={(event) => {
                event.stopPropagation();
                toggleLock(record);
              }}
            />
          </Tooltip>
        );
      },
    },
    // MTQE bands (modules/documents/pipeline-constants.js): >=0.85 reliable,
    // >=0.65 doubtful, below priority. MTQE v2 is the only score (0-1); it is
    // re-scored when a segment is confirmed.
    {
      title: "MTQE",
      width: 84,
      dataIndex: "mtqeV2Score",
      key: "mtqeV2Score",
      sorter: COLUMN_SORTERS.mtqeV2Score,
      render: (value) => {
        const score = typeof value === "number" ? value : null;
        return (
          <Tooltip title="Combined score (weighs TM references)">
            <Tag bordered={false} color={qeBandColor(score)}>
              {score !== null ? score.toFixed(2) : "—"}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "action",
      width: 100,
      render: (record) => {
        if (record.block || pending[record.id]) return null;
        if (selectedRow && selectedRow.id !== record.id) return null;
        return (
          <div className="absolute top-2 left-2">
            {selectedRow?.exampleXml && (
              <Button
                onClick={() => {
                  loadXml(record);
                }}
                className="text-xs"
                style={{ lineHeight: "1.5" }}
                shape="circle"
                type="primary"
                size="small"
                loading={xmlRequesting && xmlRequesting.id === record.id}
              >
                {!xmlRequesting && <code>Xml</code>}
              </Button>
            )}

            {!editingLocked && (
              <>
                <Tooltip title="Confirm Tu (ctrl+enter)">
                  <Button
                    className="ml-2"
                    onClick={() => {
                      save(null, { advance: true });
                    }}
                    variant="text"
                    color="green"
                    icon={<CircleCheck size={24} strokeWidth={2} />}
                    size="small"
                  ></Button>
                </Tooltip>

                <Tooltip title="Reject Tu (ctrl+shift+enter)">
                  <Button
                    className="ml-2"
                    shape="circle"
                    onClick={reject}
                    variant="text"
                    color="red"
                    icon={<CircleX size={24} strokeWidth={2} />}
                    size="small"
                  ></Button>
                </Tooltip>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Saved actions the reviewer can undo (suggestion bookkeeping is not one).
  const UNDOABLE = ["approve", "reject", "save_draft", "lock", "unlock"];

  const confirm = async ({
    tuId,
    reviewLiteral,
    action,
    snapshot,
    direction,
    // false: the caller records ONE undo entry for many saves (confirm all).
    record = true,
  }) => {
    // Backstop — the backend enforces this too (409 SUBMISSION_LOCKED).
    if (editingLocked) {
      throw new Error("submission locked");
    }
    const payload = {
      tuId,
      reviewLiteral,
      action,
      ...(snapshot ? { snapshot, direction } : {}),
    };
    const response = shareToken
      ? await confirmTuByShareToken(shareToken, payload)
      : await confirmTu(payload);
    const { tu, alsoUpdated = [] } = response.data;
    const updatedById = new Map(
      [tu, ...alsoUpdated].map((item) => [item.id, item]),
    );

    if (record && UNDOABLE.includes(action)) {
      // `data` here is still the rows as they were before this save.
      const beforeById = new Map(
        data.filter((doc) => updatedById.has(doc.id)).map((doc) => [doc.id, doc]),
      );
      actionHistoryRef.current = recordAction(
        actionHistoryRef.current,
        actionEntry({
          action,
          number: segmentNumberOf(beforeById.get(tu.id)),
          beforeById,
          after: [tu, ...alsoUpdated],
        }),
      );
      touchHistory();
    }

    setData((prev) =>
      prev.map((doc) =>
        updatedById.has(doc.id) ? { ...doc, ...updatedById.get(doc.id) } : doc,
      ),
    );
    setSelectedRow((prev) =>
      prev && updatedById.has(prev.id)
        ? { ...prev, ...updatedById.get(prev.id) }
        : prev,
    );
    return [tu, ...alsoUpdated];
  };

  // How much of the document is done (locked or confirmed): what gates the
  // processed download and what the bar shows.
  const completion = useMemo(() => completionOf(data), [data]);

  // The text a confirm would save for a row: what was typed, else what it has.
  const confirmTextOf = (row) =>
    draftsRef.current[row.id] ?? row.reviewLiteral ?? row.translatedLiteral ?? "";
  const bulkTargets = confirmableRows(orderedData, confirmTextOf);

  // Confirms every not-yet-confirmed, unlocked segment of the visible list,
  // after saying how many they are. One undo entry for the whole run; the
  // segments the server refuses (tags that do not match the source...) are
  // counted and left as they were.
  const confirmAllInFilter = () => {
    if (editingLocked || bulkProgress) return;
    const targets = confirmableRows(orderedData, confirmTextOf);
    if (targets.length === 0) {
      announce(t("tus.nav.noneLeft"));
      return;
    }
    Modal.confirm({
      title: t("tus.bulk.title", { count: targets.length }),
      content: t(listFiltered ? "tus.bulk.contentFiltered" : "tus.bulk.contentAll"),
      okText: t("tus.bulk.ok", { count: targets.length }),
      cancelText: t("tus.bulk.cancel"),
      // Not awaited: the dialog closes at once and the editor stays locked
      // behind the progress panel until the whole list has been answered.
      onOk: () => {
        runBulkConfirm(targets);
      },
    });
  };

  // The list goes to the server in requests of many segments (not one call
  // per segment); each answer confirms its rows in the grid. Meanwhile every
  // other action is blocked (see the panel and the key guard below).
  const runBulkConfirm = async (targets) => {
    const beforeById = new Map(data.map((doc) => [doc.id, doc]));
    const after = new Map();
    let failed = 0;
    let firstReason = null;
    let done = 0;
    const items = targets.map((row) => ({
      tuId: row.id,
      reviewLiteral: confirmTextOf(row),
    }));
    document.activeElement?.blur?.();
    setBulkProgress({ done: 0, total: items.length });
    for (const chunk of chunksOf(items)) {
      // Already confirmed by the propagation of an earlier request (same source).
      const pending = chunk.filter((item) => !after.has(item.tuId));
      try {
        if (pending.length > 0) {
          const response = shareToken
            ? await confirmTusBulkByShareToken(shareToken, { items: pending })
            : await confirmTusBulk({ documentId: projectId, items: pending });
          const { updated = [], failed: refused = [] } = response.data;
          const updatedById = new Map(updated.map((item) => [item.id, item]));
          for (const item of updated) {
            after.set(item.id, item);
            clearDraft(item.id);
          }
          failed += refused.length;
          firstReason ??= refused[0]?.message || null;
          setData((prev) =>
            prev.map((doc) =>
              updatedById.has(doc.id) ? { ...doc, ...updatedById.get(doc.id) } : doc,
            ),
          );
          setSelectedRow((prev) =>
            prev && updatedById.has(prev.id)
              ? { ...prev, ...updatedById.get(prev.id) }
              : prev,
          );
        }
      } catch (error) {
        failed += pending.length;
        firstReason ??= failureReason(error);
        console.error(error);
      }
      done += chunk.length;
      setBulkProgress({ done, total: items.length });
    }
    setBulkProgress(null);
    actionHistoryRef.current = recordAction(
      actionHistoryRef.current,
      actionEntry({
        action: "approve_all",
        number: after.size,
        beforeById,
        after: [...after.values()],
      }),
    );
    touchHistory();
    if (failed > 0) {
      messageApi.warning(
        `${t("tus.bulk.someFailed", { failed, done: after.size })}${
          firstReason ? ` (${firstReason})` : ""
        }`,
      );
    } else {
      announce(t("tus.bulk.done", { done: after.size }));
    }
  };

  // While a bulk confirm runs nothing else may be done: keys are swallowed
  // here (shortcuts and typing alike) and the panel below takes the clicks.
  useEffect(() => {
    if (!bulkProgress) return undefined;
    const swallow = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", swallow, true);
    return () => window.removeEventListener("keydown", swallow, true);
  }, [Boolean(bulkProgress)]);

  // LLM suggestion lifecycle: applying copies the suggestion into the target
  // editor (the reviewer still confirms), discarding hides it; both persist
  // suggestionStatus so acceptance can be measured.
  const applySuggestion = async () => {
    if (!selectedRow?.suggestionLiteral) return;
    // Guard: a suggestion that does not keep the source's tags (e.g. one
    // stored before tags went to the LLM) is never applied.
    if (!tagIssue(selectedRow.srcLiteral, selectedRow.suggestionLiteral).ok) return;
    const text = selectedRow.suggestionLiteral;
    try {
      await confirm({ tuId: selectedRow.id, action: "apply_suggestion" });
      setSelectedRow((prev) => (prev ? { ...prev, reviewLiteral: text } : prev));
      markDraft(selectedRow.id, text);
      setEditorRefreshKey((prev) => prev + 1);
      messageApi.success("Suggestion applied — save it or confirm");
    } catch (error) {
      console.error(error);
      messageApi.error("Could not apply the suggestion");
    }
  };

  const discardSuggestion = async () => {
    if (!selectedRow?.suggestionLiteral) return;
    try {
      await confirm({ tuId: selectedRow.id, action: "discard_suggestion" });
    } catch (error) {
      console.error(error);
      messageApi.error("Could not discard the suggestion");
    }
  };

  const toggleLock = async (record) => {
    if (!beginPending(record.id, "lock")) return;
    try {
      await confirm({
        tuId: record.id,
        action: record.block ? "unlock" : "lock",
      });
    } catch (error) {
      console.error(error);
      messageApi.error("Could not update the segment lock");
    } finally {
      endPending(record.id);
    }
  };

  // Server reason of a failed request, when it sent one.
  const failureReason = (error) => {
    const body = error?.response?.data;
    return (
      body?.message ||
      body?.error?.message ||
      (typeof body?.error === "string" ? body.error : null)
    );
  };

  // Selecting a row restores its unsaved text, if any (the grid record only
  // knows the persisted value).
  const selectRow = (record) => {
    const draft = draftsRef.current[record.id];
    setSelectedRow(draft != null ? { ...record, reviewLiteral: draft } : record);
  };

  // Moves the selection to a row of the visible list and asks the list to
  // follow it (see the navIntentRef effect). `fromIndex` = where the move
  // started: what lies in between is what the notice reports as skipped.
  const goToRowIndex = (index, fromIndex = null) => {
    if (index < 0 || index >= orderedData.length) return;

    const targetPage = Math.floor(index / pageSize) + 1;
    const pageChanged = targetPage !== page;
    const target = orderedData[index];

    if (fromIndex !== null && fromIndex !== index) {
      const [low, high] = fromIndex < index ? [fromIndex, index] : [index, fromIndex];
      const between = orderedData.slice(low + 1, high);
      const locked = between.filter(isSegmentBlocked).length;
      const parts = [];
      if (between.length > 0) {
        parts.push(
          `${segmentNumberOf(orderedData[fromIndex], fromIndex + 1)} → ${segmentNumberOf(target, index + 1)}`,
        );
      }
      if (locked > 0) parts.push(t("tus.nav.lockedSkipped", { count: locked }));
      if (pageChanged) {
        parts.push(
          t("tus.nav.page", {
            page: targetPage,
            total: Math.max(1, Math.ceil(orderedData.length / pageSize)),
          }),
        );
      }
      if (parts.length > 0) announce(parts.join(" · "));
    }

    navIntentRef.current = { id: target.id, jump: pageChanged };
    selectRow(target);
    if (pageChanged) setPage(targetPage);
  };

  // Manual navigation (Ctrl+Shift+Down / Up, or plain Down / Up on the edge
  // line of the editor). Locked segments are skipped in both directions; no
  // wrap-around.
  const navigate = (step) => {
    if (!selectedRow) return;
    const currentIndex = orderedData.findIndex(
      (doc) => doc.id === selectedRow.id,
    );
    if (currentIndex < 0) return;

    let index = currentIndex + step;
    while (
      index >= 0 &&
      index < orderedData.length &&
      isSegmentBlocked(orderedData[index])
    ) {
      index += step;
    }
    if (index >= 0 && index < orderedData.length) {
      goToRowIndex(index, currentIndex);
    }
  };

  // After a confirm (as in Trados' Ctrl+Enter): the next segment of the
  // visible list that is neither locked nor already confirmed. Stays put when
  // there is none.
  const goToNextUnconfirmed = (fromId) => {
    const currentIndex = orderedData.findIndex((doc) => doc.id === fromId);
    if (currentIndex < 0) return;
    const next = nextPendingIndex(
      orderedData,
      currentIndex,
      (doc) =>
        !isSegmentBlocked(doc) && !isConfirmed(doc) && !pendingRef.current[doc.id],
    );
    // Nothing left to edit in this filter: stay put and say so.
    if (!next) {
      announce(t("tus.nav.noneLeft"));
      return;
    }
    if (!next.wrapped) {
      goToRowIndex(next.index, currentIndex);
      return;
    }
    // None below, but some were left behind above: go back to the first one.
    goToRowIndex(next.index);
    announce(
      t("tus.nav.wrapped", {
        number: segmentNumberOf(orderedData[next.index], next.index + 1),
      }),
    );
  };

  // A failed request brings the reviewer back to its segment (the text typed
  // there is still in the editor as an unsaved draft).
  const returnToSegment = (tuId) => {
    const index = orderedData.findIndex((doc) => doc.id === tuId);
    if (index >= 0) goToRowIndex(index);
  };

  const save = async (str, { advance = false } = {}) => {
    if (!selectedRow) return;
    if (editingLocked) {
      messageApi.warning("Editing is closed: this work was submitted.");
      return;
    }

    const currentRow = selectedRow;
    if (isSegmentBlocked(currentRow)) {
      messageApi.info("This segment is locked");
      return;
    }
    const reviewLiteral =
      str ?? currentRow.reviewLiteral ?? currentRow.translatedLiteral ?? "";

    // Only this row waits (spinner in its status cell); a second Ctrl+Enter
    // on it is ignored. The reviewer moves on to the next unconfirmed
    // segment while the request is in flight.
    if (!beginPending(currentRow.id, "status")) return;
    if (advance) goToNextUnconfirmed(currentRow.id);

    try {
      if (!isSegmentBlocked(currentRow)) {
        await confirm({
          tuId: currentRow.id,
          reviewLiteral,
          action: "approve",
        });

        clearDraft(currentRow.id);

        if (projectConfig?.tmIds?.length) {
          const tmIds = projectConfig.tmIds.filter(
            (tmId) => projectConfig.tms.find((tm) => tm.id === tmId)?.updateTm,
          );
          if (tmIds.length > 0) {
            // The TM gets the text only: placeholders stored in DAAIT came
            // back as <x1/> in the TM panel and in the QE references.
            const appendPayload = {
              tmIds,
              source: stripInlineTags(currentRow.srcLiteral),
              target: stripInlineTags(reviewLiteral),
            };
            const appendPromise = shareToken
              ? appendTuByShareToken(shareToken, appendPayload)
              : appendTu(appendPayload);
            appendPromise.catch((appendError) => {
              console.error(appendError);
              messageApi.warning("Segment saved, but TM update failed");
            });
          }
        }
      }

    } catch (error) {
      const reason = failureReason(error);
      messageApi.error(reason ? `Not saved: ${reason}` : "Error saving TU");
      console.error(error);
      returnToSegment(currentRow.id);
    } finally {
      endPending(currentRow.id);
    }
  };

  const reject = async () => {
    if (editingLocked) {
      messageApi.warning("Editing is closed: this work was submitted.");
      return;
    }
    const currentRow = selectedRow;
    if (!currentRow) return;
    if (isSegmentBlocked(currentRow)) {
      messageApi.info("This segment is locked");
      return;
    }
    if (!beginPending(currentRow.id, "status")) return;
    try {
      await confirm({
        tuId: currentRow.id,
        reviewLiteral: null,
        action: "reject",
      });
      clearDraft(currentRow.id);
    } catch (error) {
      const reason = failureReason(error);
      messageApi.error(
        reason ? `Not rejected: ${reason}` : "Error rejecting TU",
      );
      console.error(error);
    } finally {
      endPending(currentRow.id);
    }
  };

  // Whitespace/entity-insensitive comparison: Quill and TagEditor normalize
  // the content they are given, so their first onChange after selecting a row
  // can differ cosmetically from the stored literal without any real edit.
  const normalizeDraft = (text) =>
    (text ?? "")
      .normalize("NFKC")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // Debounced live evaluation of the draft: fires ~1.2s after the reviewer
  // stops typing, and ONLY when the draft actually differs from the persisted
  // target (reviewLiteral, falling back to the MT). Selecting a row emits the
  // editor's initial content — that must never trigger an MTQE/LLM round-trip.
  const scheduleLiveEvaluation = (tuId, text) => {
    if (liveEvalTimerRef.current) clearTimeout(liveEvalTimerRef.current);
    const draft = normalizeDraft(text);
    if (!draft) return;

    const baselineRow = data.find((doc) => doc.id === tuId);
    const baseline = normalizeDraft(
      baselineRow?.reviewLiteral || baselineRow?.translatedLiteral || "",
    );
    if (draft === baseline) {
      // Unchanged (or reverted) draft: drop any stale live result too.
      setLiveEval((prev) => (prev?.tuId === tuId ? null : prev));
      return;
    }

    liveEvalTimerRef.current = setTimeout(async () => {
      const seq = ++liveEvalSeqRef.current;
      setLiveEval({ tuId, loading: true });
      try {
        const response = shareToken
          ? await evaluateTuByShareToken(shareToken, { tuId, target: text })
          : await evaluateTu({ tuId, target: text });
        if (liveEvalSeqRef.current !== seq) return;
        const { score, verdict, suggestion, meta } = response.data ?? {};
        setLiveEval({ tuId, loading: false, score, verdict, suggestion, meta });
        if (typeof score === "number") {
          setData((prev) =>
            prev.map((doc) =>
              doc.id === tuId ? { ...doc, mtqeV2Score: score } : doc,
            ),
          );
          setSelectedRow((prev) =>
            prev?.id === tuId ? { ...prev, mtqeV2Score: score } : prev,
          );
        }
      } catch (error) {
        console.error("Live evaluation failed", error);
        if (liveEvalSeqRef.current === seq) setLiveEval(null);
      }
    }, 1200);
  };

  // Cancel any pending/in-flight evaluation when the selection moves. No
  // state reset needed: every consumer of liveEval guards on tuId, so a
  // stale result for another row is simply never rendered.
  useEffect(() => {
    liveEvalSeqRef.current += 1;
    if (liveEvalTimerRef.current) clearTimeout(liveEvalTimerRef.current);
  }, [selectedRow?.id]);

  // A draft exists only while the text differs from what is persisted
  // (reviewLiteral, falling back to the MT): reverting the edit clears it.
  const markDraft = (tuId, text) => {
    const row = data.find((doc) => doc.id === tuId);
    const baseline = normalizeDraft(row?.reviewLiteral || row?.translatedLiteral || "");
    const next = { ...draftsRef.current };
    if (normalizeDraft(text) === baseline) delete next[tuId];
    else next[tuId] = text;
    draftsRef.current = next;
    setDrafts(next);
    if (saveFailed) setSaveFailed(false);
  };

  const clearDraft = (tuId) => {
    if (!(tuId in draftsRef.current)) return;
    const next = { ...draftsRef.current };
    delete next[tuId];
    draftsRef.current = next;
    setDrafts(next);
  };

  // A real change of the typed text becomes an undo step of that segment
  // (cosmetic differences the editors emit on mount are not one).
  const rememberTyped = (row, next) => {
    const previous = row.reviewLiteral ?? row.translatedLiteral ?? "";
    if (normalizeDraft(previous) === normalizeDraft(next)) return;
    textHistoryRef.current = {
      ...textHistoryRef.current,
      [row.id]: recordText(textHistoryRef.current[row.id], previous, Date.now()),
    };
    touchHistory();
  };

  // Puts `text` in the editor of the selected segment (undo / redo of typing):
  // the editors only read their initial value, so the editor is remounted.
  const replaceEditorText = (tuId, text) => {
    setSelectedRow((prev) =>
      prev?.id === tuId ? { ...prev, reviewLiteral: text } : prev,
    );
    markDraft(tuId, text);
    setEditorRefreshKey((prev) => prev + 1);
    scheduleLiveEvaluation(tuId, text);
    // The remounted editor takes the caret back, at the end of the text.
    setTimeout(() => {
      const box = document.querySelector(
        "#tus-list .selected-row .tag-editor, #tus-list .selected-row .ql-editor",
      );
      if (!box) return;
      box.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNodeContents(box);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }, 120);
  };

  // Restores every segment of a saved action to its state before (undo) or
  // after (redo) it, then shows where it happened. Filters are never changed:
  // a segment outside the current filter is restored and reported as such.
  const restoreAction = async (entry, side) => {
    const items = side === "before" ? [...entry.items].reverse() : entry.items;
    for (const item of items) {
      if (!beginPending(item.id, "status")) continue;
      try {
        await confirm({
          tuId: item.id,
          action: "restore",
          snapshot: item[side],
          // Recorded in the segment's history as an undo or a redo.
          direction: side === "before" ? "undo" : "redo",
        });
        clearDraft(item.id);
      } finally {
        endPending(item.id);
      }
    }
    setEditorRefreshKey((prev) => prev + 1);
    const mainId = entry.items[0].id;
    const index = orderedData.findIndex((doc) => doc.id === mainId);
    const what =
      entry.action === "approve_all"
        ? `${t(`tus.undo.${side === "before" ? "undo" : "redo"}`)}: ${t("tus.undo.action.approve_all")} (${entry.items.length})`
        : t(`tus.undo.${side === "before" ? "undone" : "redone"}`, {
            action: t(`tus.undo.action.${entry.action}`),
            number: entry.number ?? "",
          });
    if (index >= 0) {
      goToRowIndex(index);
      announce(what);
    } else {
      announce(`${what} ${t("tus.undo.outsideFilter")}`);
    }
  };

  // Ctrl+Z / Ctrl+Y (and the two buttons). What was typed in the selected
  // segment goes first; with nothing typed left, the last saved action.
  const stepHistory = async (direction) => {
    if (undoBusyRef.current) return;
    if (editingLocked) {
      messageApi.warning("Editing is closed: this work was submitted.");
      return;
    }
    const row = selectedRow;
    if (row && !isSegmentBlocked(row) && !pendingRef.current[row.id]) {
      const current = row.reviewLiteral ?? row.translatedLiteral ?? "";
      const step =
        direction === "undo"
          ? undoText(textHistoryRef.current[row.id], current)
          : redoText(textHistoryRef.current[row.id], current);
      if (step) {
        textHistoryRef.current = {
          ...textHistoryRef.current,
          [row.id]: step.history,
        };
        touchHistory();
        replaceEditorText(row.id, step.text);
        return;
      }
    }
    const step =
      direction === "undo"
        ? undoAction(actionHistoryRef.current)
        : redoAction(actionHistoryRef.current);
    if (!step) {
      announce(t(`tus.undo.${direction === "undo" ? "nothingToUndo" : "nothingToRedo"}`));
      return;
    }
    undoBusyRef.current = true;
    const previousHistory = actionHistoryRef.current;
    actionHistoryRef.current = step.history;
    touchHistory();
    try {
      await restoreAction(step.entry, direction === "undo" ? "before" : "after");
    } catch (error) {
      actionHistoryRef.current = previousHistory;
      touchHistory();
      const reason = failureReason(error);
      messageApi.error(
        reason
          ? `${t("tus.undo.failed")}: ${reason}`
          : t("tus.undo.failed"),
      );
      console.error(error);
    } finally {
      undoBusyRef.current = false;
    }
  };

  // Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z typed inside an editor: handled here, in
  // the capture phase, so both editors (and Quill's own history) behave alike.
  const handleHistoryKeys = (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    const undo = key === "z" && !event.shiftKey;
    const redo = key === "y" || (key === "z" && event.shiftKey);
    if (!undo && !redo) return;
    event.preventDefault();
    event.stopPropagation();
    stepHistory(undo ? "undo" : "redo");
  };

  const changeTextInTextarea = (text) => {
    const html = stripHTML(text);
    if (selectedRow && selectedRow.reviewLiteral !== html) {
      if (!isSegmentBlocked(selectedRow)) rememberTyped(selectedRow, html);
      setSelectedRow((prev) => ({
        ...prev,
        reviewLiteral: html,
      }));
      if (!isSegmentBlocked(selectedRow)) {
        markDraft(selectedRow.id, html);
        scheduleLiveEvaluation(selectedRow.id, html);
      }
    }
  };

  // TagEditor already emits plain text with the placeholders inline;
  // stripHTML here would eat the tags (<g1> parses as an HTML element).
  const changeTextInTagEditor = (text) => {
    if (selectedRow && selectedRow.reviewLiteral !== text) {
      if (!isSegmentBlocked(selectedRow)) rememberTyped(selectedRow, text);
      setSelectedRow((prev) => ({
        ...prev,
        reviewLiteral: text,
      }));
      if (!isSegmentBlocked(selectedRow)) {
        markDraft(selectedRow.id, text);
        scheduleLiveEvaluation(selectedRow.id, text);
      }
    }
  };

  // Save every unsaved draft WITHOUT approving it (action "save_draft": status
  // untouched, no propagation, QE v2 re-scored). Sequential: each request
  // re-scores against QE v2. Text typed while a request is in flight is kept as
  // a new draft instead of being overwritten by the server's copy.
  const saveDrafts = async () => {
    const ids = Object.keys(draftsRef.current);
    if (ids.length === 0 || savingDrafts) return;
    if (editingLocked) {
      messageApi.warning("Editing is closed: this work was submitted.");
      return;
    }

    setSavingDrafts(true);
    setSaveFailed(false);
    let failed = 0;
    let firstReason = null;
    for (const id of ids) {
      const sent = draftsRef.current[id];
      // Being confirmed right now: that request already carries its text.
      if (sent == null || !beginPending(id, "status")) continue;
      try {
        await confirm({ tuId: id, reviewLiteral: sent, action: "save_draft" });
        if (draftsRef.current[id] === sent) {
          clearDraft(id);
        } else {
          // Typed again meanwhile: keep the newer text on screen.
          const newer = draftsRef.current[id];
          setSelectedRow((prev) =>
            prev?.id === id ? { ...prev, reviewLiteral: newer } : prev,
          );
        }
      } catch (error) {
        failed += 1;
        firstReason ??= failureReason(error);
        console.error(error);
      } finally {
        endPending(id);
      }
    }
    setSavingDrafts(false);
    if (failed > 0) {
      setSaveFailed(true);
      messageApi.error(
        firstReason ? `Not saved: ${firstReason}` : `${failed} segment(s) not saved`,
      );
    }
  };

  const draftCount = Object.keys(drafts).length;

  // Warn before closing the tab with unsaved text (there is no autosave).
  useEffect(() => {
    if (draftCount === 0) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draftCount]);

  // "Last saved": the newest reviewedAt of the document (a reviewer's save,
  // not a pipeline write). Time only when it is today, date + time otherwise.
  const lastSavedAt = useMemo(() => {
    let newest = 0;
    for (const row of data) {
      const stamp = row.reviewedAt ? Date.parse(row.reviewedAt) : 0;
      if (stamp > newest) newest = stamp;
    }
    return newest || null;
  }, [data]);

  const formatSavedAt = (stamp) => {
    if (!stamp) return "—";
    const moment = new Date(stamp);
    const today = moment.toDateString() === new Date().toDateString();
    return today
      ? moment.toLocaleTimeString()
      : `${moment.toLocaleDateString()} ${moment.toLocaleTimeString()}`;
  };

  const loadXml = async (record) => {
    try {
      setXmlRequesting({
        id: record.id,
      });
      const { data } = await axios.get(record.exampleXml, {
        headers: {
          "Content-Type": "application/xml",
        },
        responseType: "text",
      });
      setXmlData(data);
      setOpen(true);
      setXmlRequesting(null);
    } catch (error) {
      messageApi.error("Error loading XML");
      console.error(error);
    }
  };

  useHotkeys("ctrl+enter", async () => {
    save(null, { advance: true });
  });
  useHotkeys("ctrl+shift+enter", () => {
    reject();
  });
  useHotkeys("ctrl+shift+down", () => {
    navigate(1);
  });
  useHotkeys("ctrl+shift+up", () => {
    navigate(-1);
  });
  // With the focus outside an editor (inside one: handleHistoryKeys).
  useHotkeys("ctrl+z", (event) => {
    event.preventDefault();
    stepHistory("undo");
  });
  useHotkeys("ctrl+y, ctrl+shift+z", (event) => {
    event.preventDefault();
    stepHistory("redo");
  });
  useHotkeys(
    "ctrl+s",
    (event) => {
      event.preventDefault();
      saveDrafts();
    },
    { preventDefault: true },
  );

  return (
    <div>
      {contextHolder}
      {bulkProgress
        ? // On <body>, above everything: no ancestor can clip it or sit over it.
          createPortal(
        <div
          className="bulk-lock"
          role="alertdialog"
          aria-busy="true"
          aria-label={t("tus.bulk.running", bulkProgress)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(15, 23, 42, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "progress",
          }}
        >
          <div className="w-[26rem] max-w-[90vw] rounded-lg bg-white p-5 shadow-xl">
            <div className="text-sm font-semibold text-slate-800">
              {t("tus.bulk.running", bulkProgress)}
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{
                  width: `${Math.round((bulkProgress.done / Math.max(1, bulkProgress.total)) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-3 text-xs text-slate-500">{t("tus.bulk.runningHint")}</div>
          </div>
        </div>,
            document.body,
          )
        : null}
      <div
        className="mb-2"
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 5,
        }}
      >
        <StatsTus
          stats={stats}
          percentage={stats.porcent}
          requesting={requesting}
          totalSegments={data.length}
          projectId={shareToken ? undefined : projectId}
          parentProjectId={shareToken ? undefined : projectConfig?.projectId}
          projectTms={projectConfig?.tms}
          onTmsUpdated={getProjectConfig}
          submission={
            projectConfig
              ? {
                  translatorSubmitted,
                  reviewerSubmitted,
                  showReview: !shareToken,
                }
              : null
          }
          effort={documentEffort}
        />
      </div>

      {editingLocked ? (
        <Alert
          className="mb-2"
          type="warning"
          showIcon
          message="Editing is closed — this work was submitted. A project manager can reopen it."
        />
      ) : null}

      {tagIssueCount > 0 ? (
        <Alert
          className="mb-2"
          type="error"
          showIcon
          message={`${tagIssueCount} segment${tagIssueCount === 1 ? "" : "s"} with tags that do not match the source (missing, extra${orderedTags ? " or in another order" : ""}). They cannot be approved and the export will not write them: open each one and use "Fix tags".`}
        />
      ) : null}

      <div className="mb-2">
        <div
          role="button"
          tabIndex={0}
          onClick={toggleTopPanel}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleTopPanel();
            }
          }}
          className="flex cursor-pointer select-none items-center gap-2 rounded px-1 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          title={topPanelOpen ? "Hide suggestion, TMs and glossaries" : "Show suggestion, TMs and glossaries"}
        >
          {topPanelOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>Suggestion · TMs · Glossaries</span>
          <Badge
            count={
              (liveEval?.tuId === selectedRow?.id && liveEval?.suggestion) ||
              (selectedRow?.suggestionStatus === "PENDING" &&
                selectedRow?.suggestionLiteral)
                ? 1
                : 0
            }
            color="gold"
            title="LLM suggestion available"
          />
          <Badge count={tmInfo.length} color="blue" title="TM matches" showZero={false} />
          <Badge count={glossaryInfo.length} color="green" title="Glossary hits" showZero={false} />
          {/* The document being worked on, at the right end of the row. */}
          {projectConfig?.filename ? (
            <span
              className="ml-auto min-w-0 truncate pl-4 text-xs font-semibold text-slate-700"
              title={
                projectConfig.label
                  ? `${projectConfig.filename} — ${projectConfig.label}`
                  : projectConfig.filename
              }
            >
              {projectConfig.filename}
              {projectConfig.label ? (
                <span className="ml-2 font-normal text-slate-500">
                  {projectConfig.label}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
        {topPanelOpen ? (
        <Tabs
          type="card"
          defaultActiveKey="1"
          headers={{
            style: {
              padding: "0px 0px",
            },
          }}
          items={[
            {
              key: "1",
              label: (
                <>
                  <span>Suggestion</span>{" "}
                  <Badge
                    count={
                      (liveEval?.tuId === selectedRow?.id &&
                        liveEval?.suggestion) ||
                      (selectedRow?.suggestionStatus === "PENDING" &&
                        selectedRow?.suggestionLiteral)
                        ? 1
                        : 0
                    }
                  />
                </>
              ),
              children: (
                <SuggestionTool
                  segment={selectedRow}
                  disabled={isSegmentBlocked(selectedRow) || editingLocked}
                  onApply={applySuggestion}
                  onDiscard={discardSuggestion}
                  live={liveEval?.tuId === selectedRow?.id ? liveEval : null}
                  onApplyLive={() => {
                    if (!liveEval?.suggestion) return;
                    if (!tagIssue(selectedRow?.srcLiteral, liveEval.suggestion).ok) return;
                    const text = liveEval.suggestion;
                    setSelectedRow((prev) =>
                      prev ? { ...prev, reviewLiteral: text } : prev,
                    );
                    markDraft(selectedRow.id, text);
                    setEditorRefreshKey((prev) => prev + 1);
                  }}
                />
              ),
            },
            {
              key: "2",
              label: (
                <>
                  <span>TMs</span> <Badge count={tmInfo.length} />
                </>
              ),
              children: (
                <TmTool tmInfo={tmInfo} />
              ),
            },
            {
              key: "3",
              label: (
                <>
                  <span>Glossaries</span> <Badge count={glossaryInfo.length} />
                </>
              ),
              children: <GlossaryTool glossaryInfo={glossaryInfo} />,
            },
          ]}
        />
        ) : null}
      </div>

      {topPanelOpen ? <Divider /> : null}

      <Card id="tus-list">
        <Modal
          title="XML Example"
          centered
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
        >
          <XMLViewer
            xml={xmlData}
            theme={{
              attributeKeyColor: "#0074D9",
              attributeValueColor: "#2ECC40",
            }}
            collapsible
          />
        </Modal>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Filter size={14} /> MTQE filter
          </span>

          {/* QE v2 rule */}
          <div className="flex items-center gap-1">
            <Tag bordered={false} className="m-0">
              MTQE
            </Tag>
            <Select
              size="small"
              value={v2Rule.op}
              style={{ width: 60 }}
              options={["<=", "<", ">=", ">", "="].map((op) => ({
                value: op,
                label: op,
              }))}
              onChange={(op) => setV2Rule((prev) => ({ ...prev, op }))}
            />
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={v2Rule.value}
              onChange={(value) => setV2Rule((prev) => ({ ...prev, value }))}
              style={{ width: 140, margin: "0 6px" }}
            />
            <span className="w-9 text-xs tabular-nums text-slate-600">
              {v2Rule.value.toFixed(2)}
            </span>
          </div>

          <Button
            size="small"
            type="primary"
            icon={<Filter size={13} />}
            onClick={applyScoreFilter}
          >
            Apply
          </Button>
          <Button size="small" onClick={clearScoreFilter}>
            Clear
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {navNotice ? (
              <span
                role="status"
                aria-live="polite"
                className="nav-notice rounded bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-700"
              >
                {navNotice}
              </span>
            ) : null}
            <span
              className={`text-xs ${
                saveFailed
                  ? "text-red-600"
                  : draftCount > 0
                    ? "text-amber-600"
                    : "text-slate-500"
              }`}
            >
              {savingDrafts
                ? "Saving…"
                : saveFailed
                  ? "Save failed"
                  : draftCount > 0
                    ? `Unsaved changes (${draftCount})`
                    : "All changes saved"}
            </span>
            <Tooltip
              title={
                selectedRow?.reviewedAt
                  ? `This segment: ${formatSavedAt(Date.parse(selectedRow.reviewedAt))}${
                      selectedRow.reviewedByName ? ` · ${selectedRow.reviewedByName}` : ""
                    }`
                  : "Last time a reviewer saved a segment of this document"
              }
            >
              <Tag bordered={false} className="m-0">
                Last saved{" "}
                <span className="font-bold tabular-nums">
                  {formatSavedAt(lastSavedAt)}
                </span>
              </Tag>
            </Tooltip>
            <Tooltip
              title={
                bulkProgress
                  ? `${bulkProgress.done}/${bulkProgress.total}`
                  : `${t("tus.bulk.button")} — ${t(
                      listFiltered ? "tus.bulk.tooltipFiltered" : "tus.bulk.tooltipAll",
                      { count: bulkTargets.length },
                    )}`
              }
            >
              <Button
                size="small"
                aria-label={t("tus.bulk.button")}
                icon={<CheckCheck size={14} />}
                loading={Boolean(bulkProgress)}
                disabled={bulkTargets.length === 0 || editingLocked}
                onClick={confirmAllInFilter}
              >
                <span className="font-bold tabular-nums">
                  {bulkProgress
                    ? `${bulkProgress.done}/${bulkProgress.total}`
                    : bulkTargets.length}
                </span>
              </Button>
            </Tooltip>
            {(() => {
              // Undo / redo: typed text of the selected segment first, then
              // the last saved action (see stepHistory).
              const typed = selectedRow ? textHistoryRef.current[selectedRow.id] : null;
              const actions = actionHistoryRef.current;
              const lastUndo = actions.past[actions.past.length - 1];
              const lastRedo = actions.future[actions.future.length - 1];
              const describe = (entry) =>
                entry
                  ? `${t(`tus.undo.action.${entry.action}`)} · ${entry.number ?? ""}`
                  : "";
              const canUndo = Boolean(typed?.past.length) || actions.past.length > 0;
              const canRedo = Boolean(typed?.future.length) || actions.future.length > 0;
              return (
                <span className="inline-flex items-center">
                  <Tooltip
                    title={`${t("tus.undo.undo")} (Ctrl+Z)${
                      typed?.past.length
                        ? ` — ${t("tus.undo.typedText")}`
                        : lastUndo
                          ? ` — ${describe(lastUndo)}`
                          : ""
                    }`}
                  >
                    <Button
                      size="small"
                      type="text"
                      aria-label={t("tus.undo.undo")}
                      icon={<Undo2 size={15} />}
                      disabled={!canUndo || editingLocked}
                      onClick={() => stepHistory("undo")}
                    />
                  </Tooltip>
                  <Tooltip
                    title={`${t("tus.undo.redo")} (Ctrl+Y)${
                      typed?.future.length
                        ? ` — ${t("tus.undo.typedText")}`
                        : lastRedo
                          ? ` — ${describe(lastRedo)}`
                          : ""
                    }`}
                  >
                    <Button
                      size="small"
                      type="text"
                      aria-label={t("tus.undo.redo")}
                      icon={<Redo2 size={15} />}
                      disabled={!canRedo || editingLocked}
                      onClick={() => stepHistory("redo")}
                    />
                  </Tooltip>
                </span>
              );
            })()}
            <Tooltip
              title={t(
                completion.complete ? "tus.done.tooltipComplete" : "tus.done.tooltipPending",
                { pending: completion.pending, rejected: completion.rejected },
              )}
            >
              <Tag
                bordered={false}
                color={completion.complete ? "green" : "gold"}
                className="m-0"
              >
                {t("tus.done.label")}{" "}
                <span className="font-bold tabular-nums">
                  {completion.done}/{completion.total}
                </span>
              </Tag>
            </Tooltip>
            {!shareToken ? (
              <>
                <Tooltip
                  title={`${t("documents.downloadOriginal")} — ${t("documents.downloadOriginalHint")}`}
                >
                  <Button
                    size="small"
                    aria-label={t("documents.downloadOriginal")}
                    icon={<FileDown size={14} />}
                    href={getDocumentOriginalLink(projectId, baseURL)}
                  />
                </Tooltip>
                <Tooltip
                  title={`${t("documents.downloadProcessed")} — ${
                    completion.complete
                      ? t("documents.downloadProcessedHint")
                      : t(
                          completion.rejected
                            ? "documents.incompleteWithRejected"
                            : "documents.incomplete",
                          {
                            pending: completion.pending,
                            total: completion.total,
                            rejected: completion.rejected,
                          },
                        )
                  }`}
                >
                  <Button
                    size="small"
                    type={completion.complete ? "primary" : "default"}
                    aria-label={t("documents.downloadProcessed")}
                    icon={<Download size={14} />}
                    loading={downloading}
                    // Not complete: only an admin can still take it, as a
                    // partial delivery, after confirming (see the hook).
                    disabled={
                      !completion.complete &&
                      !["ADMIN", "SUPER"].includes(user?.role)
                    }
                    onClick={() =>
                      downloadProcessed(projectId, { onBusy: setDownloading })
                    }
                  />
                </Tooltip>
              </>
            ) : null}
            <Tooltip
              title={
                <div className="text-xs leading-5">
                  {[
                    ["Segments", orderedData.length, data.length],
                    ["Words", filteredWords, totalWords],
                    ["Weighted", filteredEffort.weightedWords, documentEffort.weightedWords],
                  ].map(([label, shown, total]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span>{label}</span>
                      <span className="font-bold tabular-nums">
                        {listFiltered
                          ? `${shown.toLocaleString()} / ${total.toLocaleString()}`
                          : total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="mt-1 opacity-70">
                    {listFiltered ? t("tus.info.filtered") : t("tus.info.all")}
                  </div>
                </div>
              }
            >
              <Tag
                bordered={false}
                color={listFiltered ? "blue" : "default"}
                className="segment-info m-0 inline-flex cursor-help items-center gap-1"
              >
                <Info size={13} />
                <span className="font-bold tabular-nums">
                  {listFiltered ? `${orderedData.length}/${data.length}` : data.length}
                </span>
              </Tag>
            </Tooltip>
            <Tooltip title="Save the text you typed without approving it (Ctrl+S)">
              <Button
                size="small"
                icon={<Save size={13} />}
                loading={savingDrafts}
                disabled={draftCount === 0 || editingLocked}
                onClick={saveDrafts}
              >
                {draftCount > 1 ? `Save (${draftCount})` : "Save"}
              </Button>
            </Tooltip>
          </div>
        </div>
        <Table
          loading={requesting}
          columns={columns}
          dataSource={tableData}
          rowKey={(record) => {
            return record?.id;
          }}
          size="small"
          ref={tblRef}
          onChange={(_pagination, filters, sorter) => {
            // Fires on every sort/filter/paginate: keep the filters and sort
            // the table applies, so navigation and the counters follow it.
            const active = Array.isArray(sorter) ? sorter[0] : sorter;
            setTableView({
              filters: filters ?? {},
              sorter: active?.order
                ? { key: active.columnKey, order: active.order }
                : null,
            });
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                if (!selectedRow || selectedRow.id !== record.id) {
                  selectRow(record);
                }
              },
            };
          }}
          rowClassName={(record) => {
            const classes = ["cursor-pointer"];

            if (record.block) classes.push("blocked");

            if (record.Status === "REJECTED") classes.push("rejected");
            else if (record.Status === "ACCEPTED")
              classes.push("original-accepted");
            else if (record.Status === "EDITED") classes.push("edited");

            if (selectedRow?.id === record.id) classes.push("selected-row");
            if (arrivedId === record.id) classes.push("nav-arrived");
            if (drafts[record.id] != null) classes.push("unsaved");

            return classes.join(" ");
          }}
          pagination={{
            position: ["bottomCenter"],
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100"],
            current: page,
            pageSize,
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setPage(1);
            },
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              if (nextPageSize && nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
              }
            },
          }}
          scroll={{
            x: "100%",
            y: topPanelOpen ? "calc(100vh - 460px)" : "calc(100vh - 300px)",
          }}
        />
      </Card>
    </div>
  );
};

export default TusList;
