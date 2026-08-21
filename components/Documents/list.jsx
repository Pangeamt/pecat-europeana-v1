"use client";
import {
  ArrowRightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LinkOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Empty, message, Popconfirm, Progress, Space, Table, Tag, Tooltip } from "antd";
import Link from "next/link";
import { useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { getLocaleName } from "@/lib/locale-direction";
import {
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_COLORS,
} from "@/lib/document-status";
import {
  assignDocumentUser,
  getDocumentShareLink,
  removeDocument,
} from "@/services/document.services";
import UserAvatar from "@/components/shared/UserAvatar";
import AssignUserModal from "./AssignUserModal";
import DocumentEdit from "./edit";
import TranslatorShareModal from "./TranslatorShareModal";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

const DocumentList = ({
  documents,
  loading,
  onSave,
  onRefresh,
  canAssign = false,
  workspaceId,
}) => {
  const { t } = useTranslation();
  const [requesting, setRequesting] = useState("");
  const [assignTarget, setAssignTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const getDocumentStatusTag = (status) => {
    const color = DOCUMENT_STATUS_COLORS[status] ?? "default";
    const label = DOCUMENT_STATUS_COLORS[status]
      ? t(`documents.status.${status}`)
      : status || t("documents.unknown");
    return <Tag color={color}>{label}</Tag>;
  };

  const getDownloadLink = async (documentId) => {
    try {
      setRequesting(documentId);
      const shareLink = await getDocumentShareLink(documentId, baseURL);
      window.location.assign(shareLink);
    } catch (error) {
      console.error(error);
      message.error(t("documents.downloadError"));
    } finally {
      setRequesting("");
    }
  };

  const handleRemove = async (documentId) => {
    try {
      await removeDocument(documentId);
      await onRefresh?.();
    } catch (error) {
      console.error(error);
      message.error(t("documents.removeError"));
    }
  };

  const handleUnassign = async (documentId, role) => {
    try {
      await assignDocumentUser(documentId, role, null);
      await onRefresh?.();
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || t("documents.assign.saveError"),
      );
    }
  };

  const renderAssignmentCell = (record, role) => {
    const assignee = record[role];
    const openAssign = () => setAssignTarget({ document: record, role });

    if (assignee) {
      return (
        <UserAvatar
          user={assignee}
          onClick={canAssign ? openAssign : undefined}
          onRemove={canAssign ? () => handleUnassign(record.id, role) : undefined}
          removeLabel={t("documents.assign.removeTooltip")}
        />
      );
    }

    if (!canAssign) {
      return <span className="text-slate-300">—</span>;
    }

    return (
      <Tooltip title={t("documents.assign.addTooltip")}>
        <Button
          shape="circle"
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={openAssign}
        />
      </Tooltip>
    );
  };

  const columns = [
    {
      title: t("table.filename"),
      dataIndex: "filename",
      key: "filename",
      render: (text, record) => {
        const isReady =
          record.status === DOCUMENT_STATUS.READY && !record.deletedAt;
        if (!isReady) {
          return (
            <Tooltip title={t("documents.stillProcessing")}>
              <div>
                <span className="font-semibold text-slate-500">{text}</span>
                <div className="mt-1 text-xs text-slate-400">{record.id}</div>
              </div>
            </Tooltip>
          );
        }
        return (
          <div>
            <Link
              href={`/dashboard/${record.id}/tus`}
              className="font-semibold text-slate-900 hover:text-blue-600"
            >
              {text}
            </Link>
            <div className="mt-1 text-xs text-slate-400">{record.id}</div>
          </div>
        );
      },
    },
    {
      title: t("table.label"),
      dataIndex: "label",
      key: "label",
      render: (label) =>
        label ? (
          <Tooltip title={label}>
            <Tag className="max-w-[120px] truncate rounded-full">{label}</Tag>
          </Tooltip>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: t("table.languagePair"),
      key: "languagePair",
      width: 170,
      render: (_, record) => {
        const { sourceLanguage, targetLanguage } = record;
        if (!sourceLanguage && !targetLanguage) {
          return <span className="text-slate-400">-</span>;
        }
        return (
          <Space size={6} wrap>
            <Tooltip title={getLocaleName(sourceLanguage)}>
              <Tag color="geekblue" className="rounded-full uppercase">
                {sourceLanguage || "?"}
              </Tag>
            </Tooltip>
            <ArrowRightOutlined className="text-slate-400" />
            <Tooltip title={getLocaleName(targetLanguage)}>
              <Tag color="cyan" className="rounded-full uppercase">
                {targetLanguage || "?"}
              </Tag>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: t("table.status"),
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) =>
        record.deletedAt ? (
          <Tag color="red" className="rounded-full">
            {t("documents.deleted")}
          </Tag>
        ) : (
          getDocumentStatusTag(status)
        ),
    },
    {
      title: t("documents.assign.translator"),
      key: "translator",
      width: 70,
      align: "center",
      render: (record) => renderAssignmentCell(record, "translator"),
    },
    {
      title: t("documents.assign.reviewer"),
      key: "reviewer",
      width: 70,
      align: "center",
      render: (record) => renderAssignmentCell(record, "reviewer"),
    },
    {
      title: t("table.segments"),
      key: "segments",
      width: 100,
      align: "right",
      render: (record) => record.totalCount ?? 0,
    },
    {
      title: t("table.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (text) => (
        <span className="text-xs text-slate-600">
          {new Date(text).toLocaleString()}
        </span>
      ),
      width: 180,
    },
    {
      title: t("table.progress"),
      key: "progress",
      width: 120,
      render: (record) => {
        // Sum BOTH pending buckets — a document can carry NOT_REVIEWED and
        // TRANSLATED_MT rows at the same time.
        const pending = (record.countByStatus ?? [])
          .filter(
            (item) =>
              item.Status === "NOT_REVIEWED" || item.Status === "TRANSLATED_MT",
          )
          .reduce((sum, item) => sum + item._count, 0);

        if (!record.totalCount) {
          return <Progress percent={0} size="small" />;
        }
        const percentage = parseFloat(
          (((record.totalCount - pending) * 100) / record.totalCount).toFixed(2),
        );
        return <Progress percent={percentage} size="small" />;
      },
    },
    {
      title: "",
      key: "action",
      width: 120,
      render: (record) => (
        <Space size={6}>
          <Tooltip title={t("documents.downloadTooltip")}>
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => getDownloadLink(record.id)}
              loading={requesting === record.id}
            />
          </Tooltip>
          <DocumentEdit document={record} save={onSave} />
          {canAssign ? (
            <Tooltip title={t("documents.share.tooltip")}>
              <Button
                size="small"
                type="text"
                icon={<LinkOutlined />}
                onClick={() => setShareTarget(record.id)}
              />
            </Tooltip>
          ) : null}
          <Popconfirm
            title={t("documents.deleteTitle")}
            description={t("documents.deleteDescription")}
            onConfirm={() => handleRemove(record.id)}
            okText={t("actions.yes")}
            cancelText={t("actions.no")}
          >
            <Tooltip title={t("documents.removeTooltip")}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        loading={loading}
        columns={columns}
        dataSource={documents}
        rowKey={(record) => record.id}
        size="small"
        scroll={{ x: 800 }}
        showSorterTooltip={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("documents.empty")}
            />
          ),
        }}
        rowClassName="align-top"
      />

      <AssignUserModal
        open={Boolean(assignTarget)}
        documentId={assignTarget?.document.id}
        role={assignTarget?.role}
        workspaceId={workspaceId}
        currentUserId={assignTarget?.document[assignTarget.role]?.id ?? null}
        onClose={() => setAssignTarget(null)}
        onSaved={async () => {
          setAssignTarget(null);
          await onRefresh?.();
        }}
      />

      <TranslatorShareModal
        open={Boolean(shareTarget)}
        documentId={shareTarget}
        onClose={() => setShareTarget(null)}
      />
    </>
  );
};

export default DocumentList;
