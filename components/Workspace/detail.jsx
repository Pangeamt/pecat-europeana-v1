"use client";
import {
  Avatar,
  Button,
  Card,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addWorkspaceMember,
  getWorkspace,
  removeWorkspaceMember,
} from "@/services/workspace.services";
import { getUsers, saveUser } from "@/services/user.services";
import { userStore } from "@/store";

const ROLE_OPTIONS = [
  { label: "SUPER", value: "SUPER" },
  { label: "ADMIN", value: "ADMIN" },
  { label: "USER", value: "USER" },
];

const roleColor = (role) =>
  role === "SUPER" ? "red" : role === "ADMIN" ? "blue" : "default";

const RoleCell = ({ role, onChange }) => {
  const [popVisible, setPopVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(role);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (!popVisible) setSelectedRole(role);
  }, [role, popVisible]);

  const handleConfirm = async () => {
    if (selectedRole === role) {
      setPopVisible(false);
      return;
    }
    try {
      setChanging(true);
      await onChange(selectedRole);
      setPopVisible(false);
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.error || "Error updating role");
    } finally {
      setChanging(false);
    }
  };

  return (
    <Popconfirm
      title="Change user role"
      description={
        <Select
          value={selectedRole}
          onChange={setSelectedRole}
          options={ROLE_OPTIONS}
          style={{ minWidth: 120 }}
          disabled={changing}
        />
      }
      open={popVisible}
      onOpenChange={setPopVisible}
      onConfirm={handleConfirm}
      okButtonProps={{ loading: changing }}
      okText="Change"
      cancelText="Cancel"
    >
      <Tag color={roleColor(role)} style={{ cursor: "pointer" }}>
        {role}
      </Tag>
    </Popconfirm>
  );
};

const WorkspaceDetail = ({ workspaceId }) => {
  const store = userStore();
  const { user } = store;

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [wsUsers, setWsUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [adding, setAdding] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const { workspace: docs } = await getWorkspace(workspaceId);
      setWorkspace(docs);
    } catch (error) {
      console.error(error);
      message.error("Error loading workspace");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data } = await getUsers();
      const usersInSameWorkspace =
        data?.users?.filter((user) => user.workspaceId === workspaceId) ?? [];
      const usersNotInSameWorkspace =
        data?.users?.filter((user) => user.workspaceId !== workspaceId) ?? [];
      setWsUsers(usersInSameWorkspace);
      setAllUsers(usersNotInSameWorkspace);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    void fetchWorkspace();
    void fetchAllUsers();
  }, [fetchWorkspace, fetchAllUsers]);

  const memberIds = useMemo(
    () => new Set((workspace?.members ?? []).map((m) => m.id)),
    [workspace],
  );

  const assignableUsers = useMemo(
    () => allUsers.filter((u) => !memberIds.has(u.id)),
    [allUsers, memberIds],
  );

  const handleAdd = async () => {
    if (!selectedUserId) return;
    try {
      setAdding(true);
      await addWorkspaceMember(workspaceId, selectedUserId);
      message.success("Member added");
      setSelectedUserId(null);
      await fetchWorkspace();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.error || "Error adding member");
    } finally {
      setAdding(false);
    }
  };

  const handleChangeRole = async (userId, nextRole) => {
    if (!userId) {
      message.error("User ID is required");
      return;
    }
    if (!nextRole) {
      message.error("Role is required");
      return;
    }
    try {
      await saveUser({ userId, role: nextRole });
      message.success("Role updated");
      await fetchWorkspace();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.error || "Error changing role");
    }
  };

  const handleRemove = async (userId) => {
    try {
      await removeWorkspaceMember(workspaceId, userId);
      message.success("Member removed");
      await fetchWorkspace();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.error || "Error removing member");
    }
  };

  const columns = [
    {
      title: "",
      key: "avatar",
      width: 60,
      render: () => <Avatar src="/images/Logo perfil RRSS 1.png" />,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <RoleCell
          role={role}
          onChange={(nextRole) => handleChangeRole(record.id, nextRole)}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (record) => (
        <Popconfirm
          title="Remove from workspace"
          description="The user will be left without workspace."
          onConfirm={() => handleRemove(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Tooltip title="Remove from workspace">
            <Button
              size="small"
              danger
              shape="circle"
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ].filter(Boolean);

  return (
    <Card
      title={
        <Space>
          <Link href="/dashboard/workspaces">
            <Button type="text" shape="circle" icon={<ArrowLeftOutlined />} />
          </Link>
          <span>{workspace?.name ?? "Workspace"}</span>
        </Space>
      }
      loading={loading}
      style={{ marginLeft: 20 }}
      extra={
        <Space>
          <Select
            showSearch
            placeholder="Select a user to add"
            value={selectedUserId}
            onChange={setSelectedUserId}
            style={{ minWidth: 260 }}
            optionFilterProp="label"
            options={assignableUsers.map((u) => ({
              label: `${u.name} · ${u.email}`,
              value: u.id,
            }))}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            disabled={!selectedUserId}
            loading={adding}
            onClick={handleAdd}
          >
            Add member
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="small" style={{ marginBottom: 12 }}>
        <Tag color="geekblue">Projects: {workspace?._count?.projects ?? 0}</Tag>
        <Tag color="purple">TMs: {workspace?._count?.tms ?? 0}</Tag>
      </Space>
      <Table
        columns={columns}
        dataSource={workspace?.members ?? []}
        rowKey="id"
        size="small"
        pagination={true}
        total={wsUsers.length}
        pageSize={10}
        current={1}
        onChange={(page, pageSize) => {
          console.log(page, pageSize);
        }}
      />
    </Card>
  );
};

export default WorkspaceDetail;
