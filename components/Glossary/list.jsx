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
import { useWorkspaceScopeLabel } from "@/components/shared/useWorkspaceScopeLabel";
import { userStore } from "@/store";
import { BookMarked, Building2, Languages } from "lucide-react";
import CreateGlossaryForm from "./CreateGlossaryForm";
import EditGlossaryModal from "./EditGlossaryModal";
import ImportGlossaryButton from "./importGlossary";

const GlossaryList = () => {
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
      message.error("Error fetching glossaries");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchGlossaries();
  }, [fetchGlossaries]);

  const handleExport = async (id) => {
    try {
      message.loading({
        content: "Exporting glossary...",
        key: "export-glossary",
      });
      await exportGlossaryRequest(id);
      message.success({
        content: "Glossary exported successfully!",
        key: "export-glossary",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.message || "Error exporting glossary",
        key: "export-glossary",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      message.loading({
        content: "Deleting glossary...",
        key: "delete-glossary",
      });
      await deleteGlossaryRequest(id);
      await fetchGlossaries();
      message.success({
        content: "Glossary deleted successfully!",
        key: "delete-glossary",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.response?.data?.error || "Error deleting glossary",
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
      title: "Name",
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
      title: "Document",
      key: "project",
      render: (record) =>
        record.context.project ? (
          <Tag className="rounded-full">{record.context.project}</Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: "Domain",
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
      title: "Languages",
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
      title: "Entries",
      key: "entries",
      render: (record) => (
        <span className="font-medium text-slate-700">
          {record.total_entries === -1 ? (
            <span className="text-slate-400 font-normal italic">
              Processing…
            </span>
          ) : (
            (record.total_entries ?? "-")
          )}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (record) => (
        <Space size={6}>
          <Tooltip title="View glossary">
            <Link href={`/dashboard/glossaries/${record.id}`}>
              <Button icon={<EyeOutlined />} type="text" size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Edit glossary">
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Export XLSX">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleExport(record.id)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete glossary"
            description="Are you sure you want to delete this glossary?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete glossary">
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
                Translation assets
              </div>
              <h2 className="mb-1 mt-2 text-2xl font-semibold">Glossaries</h2>
              <p className="m-0 text-sm text-slate-300">
                Manage workspace glossaries, imports and XLSX exports.
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
                Create Glossary
              </Button>
              <ImportGlossaryButton refetch={fetchGlossaries} />
            </Space>
          </div>
        </div>

        <StatCardGrid columns={3} ariaLabel="Glossary statistics">
          <StatCard
            label="Total glossaries"
            value={loading ? "—" : glossaries.length}
            hint={
              totalEntries > 0
                ? `${totalEntries.toLocaleString()} total entries`
                : "Workspace glossary assets"
            }
            icon={BookMarked}
            theme="slate"
          />
          <StatCard
            label="Language pairs"
            value={loading ? "—" : languagePairs}
            hint="Source-target combinations"
            icon={Languages}
            theme="violet"
          />
          <StatCard
            label="Workspace"
            value={loading || workspaceLabelLoading ? "—" : workspaceLabel}
            hint={
              user?.role === "SUPER"
                ? "Super admin view"
                : "Current workspace scope"
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
                description="No glossaries yet"
              />
            ),
          }}
          rowClassName="align-top"
        />
      </Card>

      <Modal
        title="Create Glossary"
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
