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
import { tmStore, userStore } from "@/store";
import CreateTmForm from "./CreateTmForm";
import EditTmModal from "./EditTmModal";
import ImportTmButton from "./importTM";

const TmList = () => {
  const { user } = userStore();
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
      message.error("Error fetching TMs");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchTms();
  }, [fetchTms]);

  const handleExport = async (id) => {
    try {
      message.loading({ content: "Exporting TM...", key: "export-tm" });
      await exportTMRequest(id);
      message.success({
        content: "TM exported successfully!",
        key: "export-tm",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.message || "Error exporting TM",
        key: "export-tm",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      message.loading({ content: "Deleting TM...", key: "delete-tm" });
      await deleteTMRequest(id);
      if (tm?.id === id) saveTm(null);
      await fetchTms();
      message.success({
        content: "TM deleted successfully!",
        key: "delete-tm",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.response?.data?.error || "Error deleting TM",
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
      title: "Project",
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
          <Tag color="blue" className="rounded-full">
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
      title: "Actions",
      key: "actions",
      width: 180,
      render: (record) => (
        <Space size={6}>
          <Tooltip title="View memory">
            <Link href={`/dashboard/tms/${record.id}`}>
              <Button icon={<EyeOutlined />} type="text" size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Edit memory">
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Export TMX">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleExport(record.id)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete TM"
            description="Are you sure you want to delete this TM?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete memory">
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
                Translation assets
              </div>
              <h2 className="mb-1 mt-2 text-2xl font-semibold">
                Translation Memories
              </h2>
              <p className="m-0 text-sm text-slate-300">
                Manage workspace memories, imports and TMX exports.
              </p>
            </div>
            <Space wrap>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setIsCreateOpen(true)}
              >
                Create TM
              </Button>
              <ImportTmButton refetch={fetchTms} user={user} />
            </Space>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Total memories
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {tms.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Language pairs
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {languagePairs}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </div>
            <div className="mt-2 truncate text-sm font-semibold text-slate-900">
              {user?.workspaceId || "All workspaces"}
            </div>
          </div>
        </div>

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
                description="No translation memories yet"
              />
            ),
          }}
          rowClassName="align-top"
        />
      </Card>

      <Modal
        title="Create Translation Memory"
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
