"use client";
import {
  createWorkspace,
  deleteWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "@/services/workspace.services";
import { formatDate } from "@/lib/utils";
import { userStore } from "@/store";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const WorkspaceList = () => {
  const store = userStore();
  const { user } = store;

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const canCreate = user?.role === "SUPER";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { workspaces: docs } = await listWorkspaces();
      setWorkspaces(docs ?? []);
    } catch (error) {
      console.error(error);
      message.error("Error loading workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name });
    setModalOpen(true);
  };

  const handleCancel = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateWorkspace(editing.id, { name: values.name });
        message.success("Workspace updated");
      } else {
        await createWorkspace({ name: values.name });
        message.success("Workspace created");
      }
      setModalOpen(false);
      setEditing(null);
      await fetchData();
    } catch (error) {
      if (error?.errorFields) return;
      console.error(error);
      message.error(error?.response?.data?.error || "Error saving workspace");
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteWorkspace(record.id);
      message.success("Workspace deleted");
      await fetchData();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.error || "Error deleting workspace");
    }
  };

  const totalMembers = workspaces.reduce(
    (sum, workspace) => sum + (workspace._count?.members ?? 0),
    0,
  );
  const totalProjects = workspaces.reduce(
    (sum, workspace) => sum + (workspace._count?.projects ?? 0),
    0,
  );
  const totalTms = workspaces.reduce(
    (sum, workspace) => sum + (workspace._count?.tms ?? 0),
    0,
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <div>
          <Link
            href={`/dashboard/workspaces/${record.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600"
          >
            {value}
          </Link>
          <div className="mt-1 text-xs text-slate-400">{record.id}</div>
        </div>
      ),
    },
    {
      title: "Members",
      key: "members",
      render: (record) => (
        <Tag color="blue" className="rounded-full">
          {record._count?.members ?? 0}
        </Tag>
      ),
    },
    {
      title: "Projects",
      key: "projects",
      render: (record) => (
        <Tag color="geekblue">{record._count?.projects ?? 0}</Tag>
      ),
    },
    {
      title: "TMs",
      key: "tms",
      render: (record) => (
        <Tag color="purple" className="rounded-full">
          {record._count?.tms ?? 0}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => (
        <span className="text-sm text-slate-600">{formatDate(value)}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (record) => (
        <Space>
          <Tooltip title="Members">
            <Link href={`/dashboard/workspaces/${record.id}`}>
              <Button size="small" type="text" icon={<TeamOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          {canCreate && (
            <Popconfirm
              title="Delete workspace"
              description="Are you sure? This will fail if it has projects, TMs or members."
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Remove">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden" style={{ marginLeft: 20 }}>
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Organization
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">Workspaces</h2>
            <p className="m-0 text-sm text-slate-300">
              Manage teams, project ownership and memory access.
            </p>
          </div>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New workspace
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Workspaces
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {workspaces.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Members
          </div>
          <div className="mt-2 text-2xl font-semibold text-blue-600">
            {totalMembers}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Projects
          </div>
          <div className="mt-2 text-2xl font-semibold text-indigo-600">
            {totalProjects}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            TMs
          </div>
          <div className="mt-2 text-2xl font-semibold text-purple-600">
            {totalTms}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={workspaces}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 800 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No workspaces found"
            />
          ),
        }}
        rowClassName="align-top"
      />

      <Modal
        title={editing ? "Edit workspace" : "New workspace"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        okText={editing ? "Save" : "Create"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="Workspace name" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default WorkspaceList;
