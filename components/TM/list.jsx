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
  deleteTMRequest,
  exportTMRequest,
  fetchTMRequest,
} from "@/services/tm.services";
import { StatCard, StatCardGrid } from "@/components/shared/StatCard";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { useWorkspaceScopeLabel } from "@/components/shared/useWorkspaceScopeLabel";
import { tmStore, userStore } from "@/store";
import { Building2, Database, Languages } from "lucide-react";
import CreateTmForm from "./CreateTmForm";
import EditTmModal from "./EditTmModal";
import ImportTmButton from "./importTM";

const TmList = () => {
  const { t } = useTranslation();
  const { user } = userStore();
  const { label: workspaceLabel, loading: workspaceLabelLoading } =
    useWorkspaceScopeLabel(user);
  const { tm, saveTm } = tmStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tmEdit, setTmEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tms, setTms] = useState([]);

  const fetchTms = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        setTms([]);
        return;
      }

      const query =
        user.role === "SUPER"
          ? { size: 1000 }
          : user.workspaceId
            ? { workspaceId: user.workspaceId, size: 1000 }
            : null;

      if (!query) {
        setTms([]);
        return;
      }

      const response = await fetchTMRequest(query);
      setTms(response?.docs ?? []);
    } catch (error) {
      console.error(error);
      message.error(t("tms.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void fetchTms();
  }, [fetchTms]);

  const handleExport = async (id) => {
    try {
      message.loading({ content: t("tms.messages.exporting"), key: "export-tm" });
      await exportTMRequest(id);
      message.success({
        content: t("tms.messages.exported"),
        key: "export-tm",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.message || t("tms.messages.exportError"),
        key: "export-tm",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      message.loading({ content: t("tms.messages.deleting"), key: "delete-tm" });
      await deleteTMRequest(id);
      if (tm?.id === id) saveTm(null);
      await fetchTms();
      message.success({
        content: t("tms.messages.deleted"),
        key: "delete-tm",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.response?.data?.error || t("tms.messages.deleteError"),
        key: "delete-tm",
      });
    }
  };

  const openEditModal = (record) => {
    setTmEdit(record);
    setIsEditOpen(true);
  };

  const languagePairs = new Set(
    tms.map(
      (item) => `${item.context?.source || "-"}-${item.context?.target || "-"}`,
    ),
  ).size;
  const domainCount = new Set(
    tms.map((item) => item.context?.domain).filter(Boolean),
  ).size;

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
            href={`/dashboard/tms/${record.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600"
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
          <Tag color="blue" className="rounded-full">
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
      title: t("table.actions"),
      key: "actions",
      width: 180,
      render: (record) => (
        <Space size={6}>
          <Tooltip title={t("tms.viewTooltip")}>
            <Link href={`/dashboard/tms/${record.id}`}>
              <Button icon={<EyeOutlined />} type="text" size="small" />
            </Link>
          </Tooltip>
          <Tooltip title={t("tms.editTooltip")}>
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t("tms.exportTooltip")}>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleExport(record.id)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title={t("tms.deleteTitle")}
            description={t("tms.deleteDescription")}
            onConfirm={() => handleDelete(record.id)}
            okText={t("actions.yes")}
            cancelText={t("actions.no")}
          >
            <Tooltip title={t("tms.deleteTooltip")}>
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
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                {t("tms.eyebrow")}
              </div>
              <h2 className="mb-1 mt-2 text-2xl font-semibold">
                {t("tms.title")}
              </h2>
              <p className="m-0 text-sm text-slate-300">{t("tms.subtitle")}</p>
            </div>
            <Space wrap>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setIsCreateOpen(true)}
              >
                {t("tms.createTm")}
              </Button>
              <ImportTmButton refetch={fetchTms} user={user} />
            </Space>
          </div>
        </div>

        <StatCardGrid columns={3} ariaLabel={t("tms.statsAria")}>
          <StatCard
            label={t("tms.stats.total")}
            value={loading ? "—" : tms.length}
            hint={t("tms.stats.totalHint")}
            icon={Database}
            theme="slate"
          />
          <StatCard
            label={t("tms.stats.pairs")}
            value={loading ? "—" : languagePairs}
            hint={
              domainCount > 0
                ? t("tms.stats.pairsDomainsHint", { count: domainCount })
                : t("tms.stats.pairsHint")
            }
            icon={Languages}
            theme="violet"
          />
          <StatCard
            label={t("tms.stats.workspace")}
            value={loading || workspaceLabelLoading ? "—" : workspaceLabel}
            hint={
              user?.role === "SUPER"
                ? t("tms.stats.workspaceSuperHint")
                : t("tms.stats.workspaceScopeHint")
            }
            icon={Building2}
            theme="emerald"
            compactValue
          />
        </StatCardGrid>

        <Table
          dataSource={tms}
          columns={columns}
          loading={loading}
          rowKey={(record) => record.id}
          size="small"
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("tms.empty")}
              />
            ),
          }}
          rowClassName="align-top"
        />
      </Card>

      <Modal
        title={t("tms.createModalTitle")}
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        width={900}
      >
        <CreateTmForm
          user={user}
          onBack={() => setIsCreateOpen(false)}
          onCreated={async () => {
            await fetchTms();
            setIsCreateOpen(false);
          }}
        />
      </Modal>

      <EditTmModal
        open={isEditOpen}
        tm={tmEdit}
        onClose={() => {
          setTmEdit(null);
          setIsEditOpen(false);
        }}
        onUpdated={async () => {
          await fetchTms();
        }}
      />
    </>
  );
};

export default TmList;
