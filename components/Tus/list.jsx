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
  Popconfirm,
  Select,
  Slider,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import axios from "axios";
import { Ban, CircleCheck, CircleX, Filter, Hourglass, LockIcon, Pencil, Search, SendHorizontal, UnlockIcon } from "lucide-react";
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
  submitDocumentByShareToken,
  updateDocumentSubmission,
} from "@/services/document.services";
import {
  appendTu,
  appendTuByShareToken,
  confirmTu,
  confirmTuByShareToken,
  evaluateTu,
  evaluateTuByShareToken,
  getTus,
  getTusByShareToken,
} from "@/services/tus.services";
import { userStore } from "@/store";
import { getTextDirection } from "@/lib/locale-direction";
import CustomTextArea from "../../components/CustomTextArea";
import TagEditor from "@/components/TagEditor";
import { TagText, hasInlineTags } from "@/components/shared/inline-tags";

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
const TusList = ({ shareToken } = {}) => {
  const { projectId: routeProjectId } = useParams();
  const projectId = shareToken ? null : routeProjectId;
  const [data, setData] = useState([]);
  const [projectConfig, setProjectConfig] = useState(null);
  const [showUnderThreshold, setShowUnderThreshold] = useState(false);

  // QE score filter: one rule per metric — [QE v1 op+slider] AND/OR
  // [QE v2 op+slider] — applied only when the user confirms it ("Apply").
  // Clear resets the controls to the top (<= 1.00) and shows every segment.
  // The filtered list is the working list: confirm on a segment advances to
  // the next row within it.
  const NEUTRAL_RULE = { op: "<=", value: 1 };
  const [v1Rule, setV1Rule] = useState(NEUTRAL_RULE);
  const [v2Rule, setV2Rule] = useState(NEUTRAL_RULE);
  const [scoreLogic, setScoreLogic] = useState("AND");
  // Snapshot of the controls at the moment "Apply" was pressed (null = off).
  const [appliedScoreFilter, setAppliedScoreFilter] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);
  // Bumped when an LLM suggestion is applied so the target editor remounts
  // with the new reviewLiteral (Quill/TagEditor only read the initial value).
  const [editorRefreshKey, setEditorRefreshKey] = useState(0);
  // Live draft evaluation: when the reviewer pauses typing, the draft is
  // re-scored (MTQE) and re-reviewed (LLM). Ephemeral — nothing persists
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

  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  // Visual order of the table. AntD's Table applies sorting/filtering
  // internally at render time, so `data` keeps the fetch order — but
  // previous/next navigation must follow what the reviewer actually sees.
  // Snapshotted (as ids) from `extra.currentDataSource` on every table
  // change event and re-mapped against `data`, so row updates via
  // setData(prev => ...) are never read from a stale copy.
  const [viewOrderIds, setViewOrderIds] = useState(null);
  const [xmlRequesting, setXmlRequesting] = useState(null);
  const pendingScrollIndexRef = useRef(null);

  const isSegmentBlocked = (doc) => Boolean(doc?.block);

  // Manual segment lock/unlock is a management action: session ADMIN/SUPER
  // only, never the anonymous share-link translator (also enforced server-side).
  const canToggleLock =
    !shareToken && ["ADMIN", "SUPER"].includes(user?.role);

  useEffect(() => {
    if (pendingScrollIndexRef.current == null) return;

    const indexOnPage = pendingScrollIndexRef.current;
    pendingScrollIndexRef.current = null;
    tblRef.current?.scrollTo({ index: indexOnPage });
  }, [page, pageSize]);

  useEffect(() => {
    const get = async () => {
      try {
        setRequesting(true);
        const response = shareToken
          ? await getTusByShareToken(shareToken)
          : await getTus(projectId);
        const docs = response.data.docs || [];
        setData(docs);
        setViewOrderIds(null);
        setSelectedRow((prev) => prev || docs[0] || null);
        setRequesting(false);
      } catch (error) {
        console.error(error);
        messageApi.error(
          error?.response?.data?.error?.message || "Project is not ready yet",
        );
        setData([]);
        setViewOrderIds(null);
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

      const mtqe = doc.translationScorePercent;
      const srcWords = doc.srcLiteral
        ? doc.srcLiteral.trim().split(/\s+/).filter(Boolean).length
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

  const tmThreshold = projectConfig?.tmThreshold ?? 0;

  // ----- Submission locks -------------------------------------------------
  // The share link IS the translator; in session mode roles come from the
  // document's assignments. PM = ADMIN/SUPER, never locked out.
  const translatorSubmitted = Boolean(projectConfig?.translatorSubmittedAt);
  const reviewerSubmitted = Boolean(projectConfig?.reviewerSubmittedAt);
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

  const handleSubmission = async (role, action) => {
    setSubmitting(true);
    try {
      if (shareToken) {
        await submitDocumentByShareToken(shareToken);
      } else {
        await updateDocumentSubmission(projectId, role, action);
      }
      await getProjectConfig();
      messageApi.success(
        action === "submit"
          ? "Work submitted — editing is now closed"
          : `Editing reopened for the ${role}`,
      );
    } catch (error) {
      console.error(error);
      messageApi.error(
        error?.response?.data?.message || "Could not update the submission",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ----- QE score filter --------------------------------------------------
  // A rule left at its resting position (<= 1.00) matches everything, so it
  // is treated as inactive — segments without that score are not excluded.
  const isNeutralRule = (rule) => rule.op === "<=" && rule.value >= 1;
  const scoreFilterActive = appliedScoreFilter !== null;

  const tableData = useMemo(() => {
    if (!appliedScoreFilter) return data;
    const { v1, v2, logic } = appliedScoreFilter;
    const rules = [
      v1 ? { ...v1, source: "v1" } : null,
      v2 ? { ...v2, source: "v2" } : null,
    ].filter(Boolean);
    if (rules.length === 0) return data;

    const evalRule = (record, { source, op, value }) => {
      const score =
        source === "v2" ? record?.mtqeV2Score : record?.translationScorePercent;
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

    return data.filter((record) =>
      logic === "AND"
        ? rules.every((rule) => evalRule(record, rule))
        : rules.some((rule) => evalRule(record, rule)),
    );
  }, [data, appliedScoreFilter]);

  const applyScoreFilter = () => {
    const v1 = isNeutralRule(v1Rule) ? null : v1Rule;
    const v2 = isNeutralRule(v2Rule) ? null : v2Rule;
    setAppliedScoreFilter(v1 || v2 ? { v1, v2, logic: scoreLogic } : null);
  };

  const clearScoreFilter = () => {
    setV1Rule(NEUTRAL_RULE);
    setV2Rule(NEUTRAL_RULE);
    setScoreLogic("AND");
    setAppliedScoreFilter(null);
  };

  // The filtered list is the working list: if the current selection falls
  // out of it (filter changed, or the confirmed segment no longer matches),
  // jump to the first visible row so confirm/next keeps flowing.
  useEffect(() => {
    if (!scoreFilterActive || tableData.length === 0) return;
    if (selectedRow && !tableData.some((row) => row.id === selectedRow.id)) {
      setSelectedRow(tableData[0]);
    }
  }, [tableData, scoreFilterActive, selectedRow]);

  // Rows in the order the table displays them (fetch order until the user
  // sorts or filters; the QE score filter applies first). Ids missing from
  // the filtered list are dropped; an empty snapshot falls back to it.
  const orderedData = useMemo(() => {
    if (!viewOrderIds) return tableData;
    const byId = new Map(tableData.map((doc) => [doc.id, doc]));
    const ordered = viewOrderIds.map((id) => byId.get(id)).filter(Boolean);
    return ordered.length ? ordered : tableData;
  }, [tableData, viewOrderIds]);

  const filteredTmInfo = useMemo(() => {
    const info = selectedRow?.tmInfo ?? [];
    if (showUnderThreshold) return info;
    return info.filter((item) => item.tm_score >= tmThreshold);
  }, [selectedRow?.tmInfo, showUnderThreshold, tmThreshold]);

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
    onFilter: (value, record) => {
      const fieldValue =
        dataIndex === "reviewLiteral"
          ? record.reviewLiteral || record.translatedLiteral
          : record[dataIndex];
      if (!fieldValue) return false;
      return fieldValue
        .toString()
        .toLowerCase()
        .includes(value.toString().toLowerCase());
    },
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    // Inline-code placeholders (<g1>, <x2/>…) render as chips, never as raw
    // text; the search highlight applies only to the text between them.
    render: (text) => (
      <div style={{ wordWrap: "break-word", wordBreak: "break-word" }}>
        <TagText
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
      render: (_, __, index) => {
        if (selectedRow && selectedRow.id === __.id) {
          return (
            <div className="absolute top-2 left-2">
              <Tag color="#D97706">{(page - 1) * pageSize + index + 1}</Tag>
            </div>
          );
        }
        return (
          <code className="absolute top-2 left-4">
            {(page - 1) * pageSize + index + 1}
          </code>
        );
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
      render: (text) => {
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
            {srcLiteral.render(text)}
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
        const aux = text || record.translatedLiteral || "";

        if (record.block) {
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
              {reviewLiteral.render(aux)}
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
                {hasInlineTags(aux) ? <TagText text={aux} /> : stripHTML(aux)}
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
            <Editor
              key={`${record.id}-${editorRefreshKey}`}
              dir={targetDir}
              value={initialValue}
              setValue={
                Editor === TagEditor
                  ? changeTextInTagEditor
                  : changeTextInTextarea
              }
              onKeyDown={async (e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  save(selectedRow.reviewLiteral);
                }
                if (e.key === "Enter" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  reject();
                }
                if (e.key === "ArrowDown" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  moveNext();
                }
                if (e.key === "ArrowUp" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  movePrevious();
                }
              }}
            />
          );
        } else {
          const reviewLiteral = getColumnSearchProps("reviewLiteral");
          return (
            <div
              dir={targetDir}
              style={{ textAlign: targetDir === "rtl" ? "right" : "left" }}
            >
              {reviewLiteral.render(aux)}
            </div>
          );
        }
      },
    },
    {
      title: <LockIcon size={16} className="text-gray-800" />,
      width: 80,
      dataIndex: "block",
      key: "block",
      sorter: (a, b) => Number(Boolean(a.block)) - Number(Boolean(b.block)),
      render: (value, record) => {
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
              onClick={(event) => {
                event.stopPropagation();
                toggleLock(record);
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Fuzzy",
      width: 80,
      dataIndex: "levenshteinDistance",
      key: "levenshteinDistance",
      sorter: (a, b) =>
        (Number(a.levenshteinDistance) || 0) -
        (Number(b.levenshteinDistance) || 0),
      render: (value) => (
        <Tag
          bordered={false}
          color={value == 1 ? "green" : value == 0 ? "red" : "yellow"}
        >
          {value != null && value !== ""
            ? Number.parseFloat(String(value)).toFixed(2)
            : "—"}
        </Tag>
      ),
    },
    // MTQE bands (modules/documents/pipeline-constants.js): >=0.85 reliable,
    // >=0.65 doubtful, below priority. One column per QE version — both 0-1,
    // same bands, so the two scores compare side by side.
    {
      title: "QE v1",
      width: 84,
      dataIndex: "translationScorePercent",
      key: "translationScorePercent",
      sorter: (a, b) =>
        (a.translationScorePercent ?? -1) - (b.translationScorePercent ?? -1),
      // "↻" = re-scored after an edit (differs from the pipeline's first score).
      render: (text, record) => {
        const score =
          text !== null && text !== undefined && text !== ""
            ? Number.parseFloat(text)
            : null;
        const recalculated =
          score !== null &&
          record.mtqeOriginal != null &&
          Math.abs(score - record.mtqeOriginal) > 1e-6;
        return (
          <Tooltip
            title={
              recalculated
                ? `Re-scored (initial: ${Number(record.mtqeOriginal).toFixed(2)})`
                : undefined
            }
          >
            <Tag bordered={false} color={qeBandColor(score)}>
              {score !== null ? score.toFixed(2) : "—"}
              {recalculated ? " ↻" : ""}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "QE v2",
      width: 84,
      dataIndex: "mtqeV2Score",
      key: "mtqeV2Score",
      sorter: (a, b) => (a.mtqeV2Score ?? -1) - (b.mtqeV2Score ?? -1),
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
      title: "Status",
      dataIndex: "Status",
      key: "status",
      width: 90,
      filters: [
        {
          text: "REJECTED",
          value: "REJECTED",
        },
        {
          text: "ACCEPTED",
          value: "ACCEPTED",
        },
        {
          text: "EDITED",
          value: "EDITED",
        },
        {
          text: "NOT_REVIEWED",
          value: "NOT_REVIEWED",
        },
      ],
      // NOT_REVIEWED and TRANSLATED_MT both render as "not reviewed"
      // (hourglass), so the filter must match either.
      onFilter: (value, record) =>
        value === "NOT_REVIEWED"
          ? record.Status === "NOT_REVIEWED" ||
            record.Status === "TRANSLATED_MT"
          : record.Status === value,
      render: (text) => {
        let cpm = (
          <Hourglass size={18}
            color="#D97706"
          />
        );
        if (text === "REJECTED") {
          cpm = (
            <Ban size={18} color="#DC2626" />
          );
        }
        if (text === "ACCEPTED") {
          cpm = (
            <CircleCheck size={18}
              color="#4D7C0F"
            />
          );
        }
        if (text === "EDITED") {
          cpm = (
            <Pencil size={18} color="#2563EB" />
          );
        }
        return <div className="absolute top-2 left-2">{cpm}</div>;
      },
    },
    {
      title: "Actions",
      key: "action",
      width: 100,
      render: (record) => {
        if (record.block) return null;
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
                      save(null);
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

  const confirm = async ({ tuId, reviewLiteral, action }) => {
    // Backstop — the backend enforces this too (409 SUBMISSION_LOCKED).
    if (editingLocked) {
      throw new Error("submission locked");
    }
    const response = shareToken
      ? await confirmTuByShareToken(shareToken, { tuId, reviewLiteral, action })
      : await confirmTu({ tuId, reviewLiteral, action });
    const { tu, alsoUpdated = [] } = response.data;
    const updatedById = new Map(
      [tu, ...alsoUpdated].map((item) => [item.id, item]),
    );

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
  };

  // LLM suggestion lifecycle: applying copies the suggestion into the target
  // editor (the reviewer still confirms), discarding hides it; both persist
  // suggestionStatus so acceptance can be measured.
  const applySuggestion = async () => {
    if (!selectedRow?.suggestionLiteral) return;
    const text = selectedRow.suggestionLiteral;
    try {
      await confirm({ tuId: selectedRow.id, action: "apply_suggestion" });
      setSelectedRow((prev) => (prev ? { ...prev, reviewLiteral: text } : prev));
      setEditorRefreshKey((prev) => prev + 1);
      messageApi.success("Suggestion applied — review it and confirm");
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
    try {
      await confirm({
        tuId: record.id,
        action: record.block ? "unlock" : "lock",
      });
    } catch (error) {
      console.error(error);
      messageApi.error("Could not update the segment lock");
    }
  };

  const goToRowIndex = (index) => {
    if (index < 0 || index >= orderedData.length) return;

    const targetPage = Math.floor(index / pageSize) + 1;
    const indexOnPage = index % pageSize;

    setSelectedRow(orderedData[index]);

    if (targetPage === page) {
      tblRef.current?.scrollTo({ index: indexOnPage });
      return;
    }

    pendingScrollIndexRef.current = indexOnPage;
    setPage(targetPage);
  };

  const movePrevious = () => {
    if (!selectedRow) return;
    const currentIndex = orderedData.findIndex(
      (doc) => doc.id === selectedRow.id,
    );
    if (currentIndex <= 0) return;

    goToRowIndex(currentIndex - 1);
  };

  const moveNext = ({ skipBlocked = false } = {}) => {
    if (!selectedRow) return;
    const currentIndex = orderedData.findIndex(
      (doc) => doc.id === selectedRow.id,
    );
    if (currentIndex < 0 || currentIndex >= orderedData.length - 1) return;

    let nextIndex = currentIndex + 1;

    if (skipBlocked && !isSegmentBlocked(selectedRow)) {
      while (
        nextIndex < orderedData.length &&
        isSegmentBlocked(orderedData[nextIndex])
      ) {
        nextIndex += 1;
      }
    }

    if (nextIndex < orderedData.length) {
      goToRowIndex(nextIndex);
    }
  };

  const save = async (str) => {
    if (!selectedRow) return;
    if (editingLocked) {
      messageApi.warning("Editing is closed: this work was submitted.");
      return;
    }

    const currentRow = selectedRow;
    const reviewLiteral =
      str ?? currentRow.reviewLiteral ?? currentRow.translatedLiteral ?? "";

    messageApi.open({
      key: "loading",
      type: "loading",
      content: "saving...",
    });

    try {
      if (!isSegmentBlocked(currentRow)) {
        await confirm({
          tuId: currentRow.id,
          reviewLiteral,
          action: "approve",
        });

        moveNext({ skipBlocked: true });

        if (projectConfig?.tmIds?.length) {
          const tmIds = projectConfig.tmIds.filter(
            (tmId) => projectConfig.tms.find((tm) => tm.id === tmId)?.updateTm,
          );
          if (tmIds.length > 0) {
            const appendPayload = {
              tmIds,
              source: currentRow.srcLiteral,
              target: reviewLiteral,
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
      } else {
        moveNext();
      }

      messageApi.open({
        key: "loading",
        type: "success",
        content: "Successful save!",
        duration: 2,
      });
    } catch (error) {
      messageApi.error("Error saving TU");
      console.error(error);
    }
  };

  const reject = async () => {
    if (editingLocked) {
      messageApi.warning("Editing is closed: this work was submitted.");
      return;
    }
    messageApi.open({
      key: "loading",
      type: "loading",
      content: "Rejecting...",
    });

    await confirm({
      tuId: selectedRow.id,
      reviewLiteral: null,
      action: "reject",
    });
    moveNext();
    messageApi.open({
      key: "loading",
      type: "success",
      content: "Rejected!",
      duration: 2,
    });
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
              doc.id === tuId ? { ...doc, translationScorePercent: score } : doc,
            ),
          );
          setSelectedRow((prev) =>
            prev?.id === tuId
              ? { ...prev, translationScorePercent: score }
              : prev,
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

  const changeTextInTextarea = (text) => {
    const html = stripHTML(text);
    if (selectedRow && selectedRow.reviewLiteral !== html) {
      setSelectedRow((prev) => ({
        ...prev,
        reviewLiteral: html,
      }));
      if (!isSegmentBlocked(selectedRow)) {
        scheduleLiveEvaluation(selectedRow.id, html);
      }
    }
  };

  // TagEditor already emits plain text with the placeholders inline;
  // stripHTML here would eat the tags (<g1> parses as an HTML element).
  const changeTextInTagEditor = (text) => {
    if (selectedRow && selectedRow.reviewLiteral !== text) {
      setSelectedRow((prev) => ({
        ...prev,
        reviewLiteral: text,
      }));
      if (!isSegmentBlocked(selectedRow)) {
        scheduleLiveEvaluation(selectedRow.id, text);
      }
    }
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
    save(null);
  });
  useHotkeys("ctrl+shift+enter", () => {
    reject();
  });
  useHotkeys("ctrl+shift+down", () => {
    moveNext();
  });
  useHotkeys("ctrl+shift+up", () => {
    movePrevious();
  });

  return (
    <div>
      {contextHolder}
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
          mode={projectConfig?.tmMode}
          tmThreshold={projectConfig?.tmThreshold}
          projectId={shareToken ? undefined : projectId}
          parentProjectId={shareToken ? undefined : projectConfig?.projectId}
          projectTms={projectConfig?.tms}
          onTmsUpdated={getProjectConfig}
        />
      </div>

      {(isTranslator || isReviewer || isPm) && projectConfig ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Tag color={translatorSubmitted ? "green" : "default"}>
            <span className="inline-flex items-center gap-1 align-middle">
              {translatorSubmitted ? <LockIcon size={11} /> : null}
              {translatorSubmitted
                ? "Translation submitted"
                : "Translation open"}
            </span>
          </Tag>
          {!shareToken && (
            <Tag color={reviewerSubmitted ? "green" : "default"}>
              <span className="inline-flex items-center gap-1 align-middle">
                {reviewerSubmitted ? <LockIcon size={11} /> : null}
                {reviewerSubmitted ? "Review submitted" : "Review open"}
              </span>
            </Tag>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {isTranslator && !translatorSubmitted ? (
              <Popconfirm
                title="Submit the translation?"
                description="After submitting you will no longer be able to edit."
                okText="Submit"
                onConfirm={() => handleSubmission("translator", "submit")}
              >
                <Button
                  type="primary"
                  size="small"
                  loading={submitting}
                  icon={<SendHorizontal size={14} />}
                >
                  Submit translation
                </Button>
              </Popconfirm>
            ) : null}
            {isReviewer && !reviewerSubmitted ? (
              <Popconfirm
                title="Submit the review?"
                description="After submitting you will no longer be able to edit."
                okText="Submit"
                onConfirm={() => handleSubmission("reviewer", "submit")}
              >
                <Button
                  type="primary"
                  size="small"
                  loading={submitting}
                  icon={<SendHorizontal size={14} />}
                >
                  Submit review
                </Button>
              </Popconfirm>
            ) : null}
            {isPm && translatorSubmitted ? (
              <Button
                size="small"
                loading={submitting}
                icon={<UnlockIcon size={14} />}
                onClick={() => handleSubmission("translator", "reopen")}
              >
                Reopen translator
              </Button>
            ) : null}
            {isPm && reviewerSubmitted ? (
              <Button
                size="small"
                loading={submitting}
                icon={<UnlockIcon size={14} />}
                onClick={() => handleSubmission("reviewer", "reopen")}
              >
                Reopen reviewer
              </Button>
            ) : null}
          </div>

          {editingLocked ? (
            <Alert
              className="w-full"
              type="warning"
              showIcon
              message="Editing is closed — this work was submitted. A project manager can reopen it."
            />
          ) : null}
        </div>
      ) : null}

      <div className="mb-2">
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
                    const text = liveEval.suggestion;
                    setSelectedRow((prev) =>
                      prev ? { ...prev, reviewLiteral: text } : prev,
                    );
                    setEditorRefreshKey((prev) => prev + 1);
                  }}
                />
              ),
            },
            {
              key: "2",
              label: (
                <>
                  <span>TMs</span> <Badge count={filteredTmInfo.length} />
                </>
              ),
              children: (
                <TmTool
                  filteredTmInfo={filteredTmInfo}
                  showUnderThreshold={showUnderThreshold}
                  onShowUnderThresholdChange={setShowUnderThreshold}
                />
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
      </div>

      <Divider />

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
            <Filter size={14} /> QE filter
          </span>

          {/* QE v1 rule */}
          <div className="flex items-center gap-1">
            <Tag bordered={false} className="m-0">
              QE v1
            </Tag>
            <Select
              size="small"
              value={v1Rule.op}
              style={{ width: 60 }}
              options={["<=", "<", ">=", ">", "="].map((op) => ({
                value: op,
                label: op,
              }))}
              onChange={(op) => setV1Rule((prev) => ({ ...prev, op }))}
            />
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={v1Rule.value}
              onChange={(value) => setV1Rule((prev) => ({ ...prev, value }))}
              style={{ width: 140, margin: "0 6px" }}
            />
            <span className="w-9 text-xs tabular-nums text-slate-600">
              {v1Rule.value.toFixed(2)}
            </span>
          </div>

          <Select
            size="small"
            value={scoreLogic}
            style={{ width: 72 }}
            options={[
              { value: "AND", label: "AND" },
              { value: "OR", label: "OR" },
            ]}
            onChange={setScoreLogic}
          />

          {/* QE v2 rule */}
          <div className="flex items-center gap-1">
            <Tag bordered={false} className="m-0">
              QE v2
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
          {scoreFilterActive ? (
            <Tag color="blue">
              {tableData.length}/{data.length}
            </Tag>
          ) : null}
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
          onChange={(_pagination, _filters, _sorter, extra) => {
            // Fires on every sort/filter/paginate: snapshot the visual order
            // so previous/next navigation follows the table as displayed.
            setViewOrderIds(extra.currentDataSource.map((doc) => doc.id));
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                if (!selectedRow || selectedRow.id !== record.id) {
                  setSelectedRow(record);
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

            return classes.join(" ");
          }}
          pagination={{
            position: ["bottomCenter"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
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
          scroll={{ x: "100%", y: "calc(100vh - 460px)" }}
        />
      </Card>
    </div>
  );
};

export default TusList;
