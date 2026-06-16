"use client";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  deleteGlossaryRequest,
  exportGlossaryRequest,
  fetchGlossariesRequest,
} from "@/services/glossary.services";
import { StatCard, StatCardGrid } from "@/components/shared/StatCard";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { useWorkspaceScopeLabel } from "@/components/shared/useWorkspaceScopeLabel";
import { userStore } from "@/store";
import { BookMarked, Building2, Languages } from "lucide-react";
import CreateGlossaryForm from "./CreateGlossaryForm";
import EditGlossaryModal from "./EditGlossaryModal";
import ImportGlossaryButton from "./importGlossary";

const GlossaryList = () => {
  const { t } = useTranslation();
  const { user } = userStore();
  const { label: workspaceLabel, loading: workspaceLabelLoading } =
    useWorkspaceScopeLabel(user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [glossaryEdit, setGlossaryEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [glossaries, setGlossaries] = useState([]);

  const fetchGlossaries = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        setGlossaries([]);
        return;
      }

      const query =
        user.role === "SUPER"
          ? { size: 1000 }
          : user.workspaceId
            ? { workspaceId: user.workspaceId, size: 1000 }
            : null;

      if (!query) {
        setGlossaries([]);
        return;
      }

      const response = await fetchGlossariesRequest(query);
      setGlossaries(response?.docs ?? []);
    } catch (error) {
      console.error(error);
      message.error(t("glossaries.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void fetchGlossaries();
  }, [fetchGlossaries]);

  const handleExport = async (id) => {
    try {
      message.loading({
        content: t("glossaries.messages.exporting"),
        key: "export-glossary",
      });
      await exportGlossaryRequest(id);
      message.success({
        content: t("glossaries.messages.exported"),
        key: "export-glossary",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.message || t("glossaries.messages.exportError"),
        key: "export-glossary",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      message.loading({
        content: t("glossaries.messages.deleting"),
        key: "delete-glossary",
      });
      await deleteGlossaryRequest(id);
      await fetchGlossaries();
      message.success({
        content: t("glossaries.messages.deleted"),
        key: "delete-glossary",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content:
          error?.response?.data?.error || t("glossaries.messages.deleteError"),
        key: "delete-glossary",
      });
    }
  };

  const openEditModal = (record) => {
    setGlossaryEdit(record);
    setIsEditOpen(true);
  };

  const languagePairs = new Set(
    glossaries.map(
      (item) => `${item.context?.source || "-"}-${item.context?.target || "-"}`,
    ),
  ).size;
  const totalEntries = glossaries.reduce(
    (sum, item) => sum + (Number(item.total_entries) || 0),
    0,
  );

  const columns = [
    {
      title: "#",
      key: "index",
      width: 64,
      render: (_, __, index) => (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {index + 1}
        </span>
      ),
    },
    {
      title: t("table.name"),
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <Link
            href={`/dashboard/glossaries/${record.id}`}
            className="font-semibold text-slate-900 hover:text-emerald-600"
          >
            {name}
          </Link>
          <div className="mt-1 text-xs text-slate-400">{record.id}</div>
        </div>
      ),
    },
    {
      title: t("table.project"),
      key: "project",
      render: (record) =>
        record.context.project ? (
          <Tag className="rounded-full">{record.context.project}</Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: t("table.domain"),
      key: "domain",
      render: (record) =>
        record.context.domain ? (
          <Tag color="green" className="rounded-full">
            {record.context.domain}
          </Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: t("table.languages"),
      key: "languages",
      render: (record) => (
        <Space size={6}>
          <Tag color="geekblue" className="rounded-full uppercase">
            {record.context.source}
          </Tag>
          <span className="text-slate-300">→</span>
          <Tag color="cyan" className="rounded-full uppercase">
            {record.context.target}
          </Tag>
        </Space>
      ),
    },
    {
      title: t("table.entries"),
      key: "entries",
      render: (record) => (
        <span className="font-medium text-slate-700">
          {record.total_entries === -1 ? (
            <span className="text-slate-400 font-normal italic">
              {t("glossaries.processingEntries")}
            </span>
          ) : (
            (record.total_entries ?? "-")
          )}
        </span>
      ),
    },
    {
      title: t("table.actions"),
      key: "actions",
      width: 180,
      render: (record) => (
        <Space size={6}>
          <Tooltip title={t("glossaries.viewTooltip")}>
            <Link href={`/dashboard/glossaries/${record.id}`}>
              <Button icon={<EyeOutlined />} type="text" size="small" />
            </Link>
          </Tooltip>
          <Tooltip title={t("glossaries.editTooltip")}>
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t("glossaries.exportTooltip")}>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleExport(record.id)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title={t("glossaries.deleteTitle")}
            description={t("glossaries.deleteDescription")}
            onConfirm={() => handleDelete(record.id)}
            okText={t("actions.yes")}
            cancelText={t("actions.no")}
          >
            <Tooltip title={t("glossaries.deleteTooltip")}>
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginLeft: 20 }} className="overflow-hidden">
        <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                {t("glossaries.eyebrow")}
              </div>
              <h2 className="mb-1 mt-2 text-2xl font-semibold">
                {t("glossaries.title")}
              </h2>
              <p className="m-0 text-sm text-slate-300">
                {t("glossaries.subtitle")}
              </p>
            </div>
            <Space wrap>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setIsCreateOpen(true)}
                style={{
                  background:
                    "linear-gradient(135deg, #111827 0%, #059669 100%)",
                  border: 0,
                }}
              >
                {t("glossaries.createGlossary")}
              </Button>
              <ImportGlossaryButton refetch={fetchGlossaries} />
            </Space>
          </div>
        </div>

        <StatCardGrid columns={3} ariaLabel={t("glossaries.statsAria")}>
          <StatCard
            label={t("glossaries.stats.total")}
            value={loading ? "—" : glossaries.length}
            hint={
              totalEntries > 0
                ? t("glossaries.stats.totalEntriesHint", {
                    count: totalEntries.toLocaleString(),
                  })
                : t("glossaries.stats.totalHint")
            }
            icon={BookMarked}
            theme="slate"
          />
          <StatCard
            label={t("glossaries.stats.pairs")}
            value={loading ? "—" : languagePairs}
            hint={t("glossaries.stats.pairsHint")}
            icon={Languages}
            theme="violet"
          />
          <StatCard
            label={t("glossaries.stats.workspace")}
            value={loading || workspaceLabelLoading ? "—" : workspaceLabel}
            hint={
              user?.role === "SUPER"
                ? t("glossaries.stats.workspaceSuperHint")
                : t("glossaries.stats.workspaceScopeHint")
            }
            icon={Building2}
            theme="emerald"
            compactValue
          />
        </StatCardGrid>

        <Table
          dataSource={glossaries}
          columns={columns}
          loading={loading}
          rowKey={(record) => record.id}
          size="small"
          scroll={{ x: 900 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("glossaries.empty")}
              />
            ),
          }}
          rowClassName="align-top"
        />
      </Card>

      <Modal
        title={t("glossaries.createModalTitle")}
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        width={900}
      >
        <CreateGlossaryForm
          user={user}
          onBack={() => setIsCreateOpen(false)}
          onCreated={async () => {
            await fetchGlossaries();
            setIsCreateOpen(false);
          }}
        />
      </Modal>

      <EditGlossaryModal
        open={isEditOpen}
        glossary={glossaryEdit}
        onClose={() => {
          setGlossaryEdit(null);
          setIsEditOpen(false);
        }}
        onUpdated={async () => {
          await fetchGlossaries();
        }}
      />
    </>
  );
};

export default GlossaryList;
