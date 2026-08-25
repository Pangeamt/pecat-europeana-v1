"use client";
import {
  ArrowRightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  LinkOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Empty,
  message,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
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
import PipelineStageCell from "./PipelineStages";
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
  const [editTarget, setEditTarget] = useState(null);

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
      title: "MT",
      key: "pipeline-mt",
      width: 48,
      align: "center",
      render: (record) =>
        record.deletedAt ? null : (
          <PipelineStageCell document={record} stage="mt" />
        ),
    },
    {
      title: "MTQE",
      key: "pipeline-mtqe",
      width: 60,
      align: "center",
      render: (record) =>
        record.deletedAt ? null : (
          <PipelineStageCell document={record} stage="mtqe" />
        ),
    },
    {
      title: "LLM",
      key: "pipeline-llm",
      width: 52,
      align: "center",
      render: (record) =>
        record.deletedAt ? null : (
          <PipelineStageCell document={record} stage="llm" />
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
      // Compact yyyy/mm/dd; the full date and time live in the tooltip.
      render: (text) => {
        const date = new Date(text);
        const short = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
        return (
          <Tooltip title={date.toLocaleString()}>
            <span className="cursor-default text-xs text-slate-600">
              {short}
            </span>
          </Tooltip>
        );
      },
      width: 110,
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
      width: 48,
      align: "center",
      render: (record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "download",
                icon: <DownloadOutlined />,
                label: t("documents.downloadTooltip"),
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: t("documents.editTooltip"),
              },
              ...(canAssign
                ? [
                    {
                      key: "share",
                      icon: <LinkOutlined />,
                      label: t("documents.share.tooltip"),
                    },
                  ]
                : []),
              { type: "divider" },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: t("documents.removeTooltip"),
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === "download") getDownloadLink(record.id);
              else if (key === "edit") setEditTarget(record);
              else if (key === "share") setShareTarget(record.id);
              else if (key === "delete") {
                Modal.confirm({
                  title: t("documents.deleteTitle"),
                  content: t("documents.deleteDescription"),
                  okText: t("actions.yes"),
                  cancelText: t("actions.no"),
                  okButtonProps: { danger: true },
                  onOk: () => handleRemove(record.id),
                });
              }
            },
          }}
        >
          <Button
            size="small"
            type="text"
            icon={<MoreOutlined />}
            loading={requesting === record.id}
          />
        </Dropdown>
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

      {editTarget ? (
        <DocumentEdit
          document={editTarget}
          save={async (payload) => {
            await onSave?.(payload);
            setEditTarget(null);
          }}
          open
          onClose={() => setEditTarget(null)}
        />
      ) : null}
    </>
  );
};

export default DocumentList;
