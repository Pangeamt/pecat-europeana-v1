"use client";
// Dialogs behind the keyboard shortcuts of the segment editor (see
// lib/trados-shortcuts.js and components/Tus/list.jsx): the shortcut list,
// Verify (F8), Concordance search (F3) and Go to (Ctrl+G). Presentation only.
import { Button, Empty, Input, List, Modal, Spin, Table, Tag } from "antd";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { TagText } from "@/components/shared/inline-tags";
import { TRADOS_SHORTCUTS } from "@/lib/trados-shortcuts";

// Shortcuts the editor already had before this list.
const OWN = [
  { id: "reject", keys: "Ctrl+Shift+Enter" },
  { id: "save", keys: "Ctrl+S" },
  { id: "prevNextShift", keys: "Ctrl+Shift+↑ / Ctrl+Shift+↓" },
  { id: "whitespace", keys: "Ctrl+Shift+8" },
  // Moving a tag of the target (2026-11-12, as in Trados): drag it, or cut and paste it.
  { id: "dragTag", keysKey: "tus.shortcuts.dragKeys" },
  { id: "moveTag", keys: "Ctrl+X → Ctrl+V" },
];

// One list with only the shortcuts that work in PECAT-E (the ones that do
// not apply are never shown).
export function ShortcutsHelpModal({ open, onClose }) {
  const { t } = useTranslation();
  const rows = [
    ...TRADOS_SHORTCUTS.filter((s) => s.supported).map((s) => ({
      key: s.id,
      keys: s.keys,
      label: t(`tus.shortcuts.action.${s.id}`),
    })),
    ...OWN.map((s) => ({ key: s.id, keys: s.keysKey ? t(s.keysKey) : s.keys, label: t(`tus.shortcuts.own.${s.id}`) })),
  ];
  const columns = [
    { title: t("tus.shortcuts.keys"), dataIndex: "keys", width: 260, render: (v) => <code className="text-xs">{v}</code> },
    { title: t("tus.shortcuts.what"), dataIndex: "label" },
  ];
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={760} title={t("tus.shortcuts.title")}>
      <div style={{ maxHeight: "70vh", overflowY: "auto" }} data-testid="shortcuts-help">
        <Table size="small" pagination={false} columns={columns} dataSource={rows} />
      </div>
    </Modal>
  );
}

/** F8: what keeps the document from a clean delivery, segment by segment. */
export function VerifyModal({ open, onClose, issues, onGo }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={720} title={t("tus.verify.title", { count: issues.length })}>
      {issues.length === 0 ? (
        <Empty description={t("tus.verify.none")} />
      ) : (
        <List
          size="small"
          data-testid="verify-list"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
          dataSource={issues}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="go" size="small" onClick={() => onGo(item.id)}>
                  {t("tus.verify.go")}
                </Button>,
              ]}
            >
              <span className="tabular-nums font-semibold">#{item.number}</span>
              <Tag className="ml-2" color={item.severity === "error" ? "red" : "gold"} bordered={false}>
                {t(`tus.verify.kind.${item.kind}`)}
              </Tag>
              <span className="text-xs text-slate-600">{item.detail}</span>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}

/**
 * F3: concordance search in the document's translation memories. Mounted
 * afresh on every opening (the list renders it only while open), so it starts
 * from `initialQuery` and searches it at once.
 */
export function ConcordanceModal({ open, onClose, initialQuery, search }) {
  const { t } = useTranslation();
  const first = String(initialQuery ?? "").trim();
  const [query, setQuery] = useState(first);
  const [loading, setLoading] = useState(Boolean(first));
  const [rows, setRows] = useState(null);
  const seq = useRef(0);

  // Only the answer of the last search counts.
  const searchFor = (text) => {
    const mine = ++seq.current;
    return search(text)
      .catch(() => [])
      .then((found) => {
        if (mine !== seq.current) return;
        setRows(found);
        setLoading(false);
      });
  };

  const run = (q) => {
    const text = String(q ?? "").trim();
    if (!text) return;
    setLoading(true);
    searchFor(text);
  };

  useEffect(() => {
    if (first) searchFor(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={860} title={t("tus.concordance.title")}>
      <Input.Search
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={run}
        placeholder={t("tus.concordance.placeholder")}
        enterButton
      />
      <div className="mt-3" data-testid="concordance-results">
        {loading ? (
          <Spin />
        ) : rows == null ? null : rows.length === 0 ? (
          <Empty description={t("tus.concordance.none")} />
        ) : (
          <Table
            size="small"
            pagination={{ pageSize: 20 }}
            rowKey={(r, i) => `${r.tm}-${i}`}
            dataSource={rows}
            columns={[
              { title: t("tus.concordance.source"), dataIndex: "source", render: (v) => <TagText text={v} /> },
              { title: t("tus.concordance.target"), dataIndex: "target", render: (v) => <TagText text={v} /> },
              { title: "TM", dataIndex: "tm", width: 160 },
            ]}
          />
        )}
      </div>
    </Modal>
  );
}

/** Ctrl+G: go to a segment by the number the grid shows (mounted on each opening). */
export function GoToModal({ open, onClose, onGo }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => onGo(value)}
      okText={t("tus.goTo.ok")}
      cancelText={t("tus.bulk.cancel")}
      title={t("tus.goTo.title")}
      width={360}
      destroyOnHidden
    >
      <Input
        autoFocus
        inputMode="numeric"
        aria-label={t("tus.goTo.label")}
        placeholder={t("tus.goTo.label")}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        onPressEnter={() => onGo(value)}
      />
    </Modal>
  );
}
