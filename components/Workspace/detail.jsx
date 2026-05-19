"use client";
import {
  Avatar,
  Button,
  Card,
  Empty,
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

  const handleOpenChange = (open) => {
    if (open) setSelectedRole(role);
    setPopVisible(open);
  };

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
      onOpenChange={handleOpenChange}
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
  }, [workspaceId]);

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
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="mt-1 text-xs text-slate-400">{record.id}</div>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <span className="text-slate-700">{email}</span>,
    },
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
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ].filter(Boolean);

  return (
    <Card loading={loading} style={{ marginLeft: 20 }} className="overflow-hidden">
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/dashboard/workspaces">
              <Button
                type="text"
                shape="circle"
                icon={<ArrowLeftOutlined />}
                className="mt-1 !text-white hover:!bg-white/10"
              />
            </Link>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                Workspace detail
              </div>
              <h2 className="mb-1 mt-2 text-2xl font-semibold">
                {workspace?.name ?? "Workspace"}
              </h2>
              <p className="m-0 text-sm text-slate-300">
                Manage members, roles and workspace access.
              </p>
            </div>
          </div>
          <Tag color="blue" className="m-0 rounded-full">
            {workspace?.members?.length ?? 0} members
          </Tag>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Members
          </div>
          <div className="mt-2 text-2xl font-semibold text-blue-600">
            {workspace?.members?.length ?? 0}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Projects
          </div>
          <div className="mt-2 text-2xl font-semibold text-indigo-600">
            {workspace?._count?.projects ?? 0}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            TMs
          </div>
          <div className="mt-2 text-2xl font-semibold text-purple-600">
            {workspace?._count?.tms ?? 0}
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 font-semibold text-slate-900">Add member</div>
        <Space wrap>
          <Select
            showSearch
            placeholder="Select a user to add"
            value={selectedUserId}
            onChange={setSelectedUserId}
            style={{ minWidth: 320 }}
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
      </div>

      <Table
        columns={columns}
        dataSource={workspace?.members ?? []}
        rowKey="id"
        size="small"
        pagination={{
          pageSize: 10,
          total: workspace?.members?.length ?? wsUsers.length,
          showTotal: (total) => `${total} members`,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No members in this workspace"
            />
          ),
        }}
        rowClassName="align-top"
      />
    </Card>
  );
};

export default WorkspaceDetail;
