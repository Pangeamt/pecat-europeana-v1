"use client";
import {
  Button,
  Card,
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
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  createWorkspace,
  deleteWorkspace,
  listWorkspaces,
  updateWorkspace,
} from "@/services/workspace.services";
import { userStore } from "@/store";

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
      message.error(
        error?.response?.data?.error || "Error saving workspace",
      );
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteWorkspace(record.id);
      message.success("Workspace deleted");
      await fetchData();
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.error || "Error deleting workspace",
      );
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <Link href={`/dashboard/workspaces/${record.id}`}>{value}</Link>
      ),
    },
    {
      title: "Members",
      key: "members",
      render: (record) => <Tag color="blue">{record._count?.members ?? 0}</Tag>,
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
      render: (record) => <Tag color="purple">{record._count?.tms ?? 0}</Tag>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (record) => (
        <Space>
          <Tooltip title="Members">
            <Link href={`/dashboard/workspaces/${record.id}`}>
              <Button size="small" shape="circle" icon={<TeamOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              shape="circle"
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
                  type="primary"
                  danger
                  shape="circle"
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
    <Card
      title="Workspaces"
      extra={
        canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            New workspace
          </Button>
        )
      }
      style={{ marginLeft: 20 }}
    >
      <Table
        columns={columns}
        dataSource={workspaces}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 800 }}
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
