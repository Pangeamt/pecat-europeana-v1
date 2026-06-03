"use client";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
  Image,
} from "antd";
import { useCallback, useState } from "react";
import {
  addUser,
  getUsers,
  removeUser,
  saveUser,
} from "@/services/user.services";
import { getMembersOfWorkspace } from "@/services/workspace.services";
import { StatCard, StatCardGrid } from "@/components/shared/StatCard";
import { DeleteOutlined } from "@ant-design/icons";
import { ShieldCheck, UserCircle, UserCog, Users } from "lucide-react";
import { useEffect } from "react";
import { userStore } from "@/store";
import UserAdd from "./add";
import UserEdit from "./edit";

const UserList = () => {
  const store = userStore();
  const { user: currentUser } = store;
  const [requesting, setRequesting] = useState(true);
  const [users, setUsers] = useState([]);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setUsers([]);
      setRequesting(false);
      return;
    }

    try {
      setRequesting(true);

      if (currentUser.role === "SUPER") {
        const response = await getUsers();
        setUsers(response?.data?.users ?? []);
        return;
      }

      if (!currentUser.workspaceId) {
        setUsers([]);
        return;
      }

      const data = await getMembersOfWorkspace(currentUser.workspaceId);
      setUsers(data?.members ?? []);
    } catch (error) {
      console.error(error);
      message.error("Error loading users");
    } finally {
      setRequesting(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const canDelete = (record) => {
    if (!currentUser) return false;
    if (record.id === currentUser.id) return false;
    if (currentUser.role === "SUPER") return true;
    if (currentUser.role === "ADMIN") {
      if (record.role === "SUPER") return false;
      return record.workspaceId === currentUser.workspaceId;
    }
    return false;
  };

  const save = async ({ ...values }) => {
    try {
      const response = await saveUser(values);
      await fetchData();
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const add = async ({ ...values }) => {
    try {
      const response = await addUser(values);
      await fetchData();
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const remove = async (userId) => {
    try {
      await removeUser(userId);
      message.success("User deleted");
      await fetchData();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.error || "Error deleting user");
    }
  };

  const adminUsers = users.filter((user) => user.role === "ADMIN").length;
  const regularUsers = users.filter((user) => user.role === "USER").length;
  const superUsers = users.filter((user) => user.role === "SUPER").length;

  const columns = [
    {
      title: "",
      dataIndex: "image",
      key: "image",
      width: 70,
      render: (value) => (
        <Space size="middle">
          {value && <Avatar src={<Image src={value} alt="avatar" />} />}
          {!value && <Avatar src={"/images/Logo perfil RRSS 1.png"} />}
        </Space>
      ),
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
      render: (role) => {
        const color =
          role === "SUPER" ? "purple" : role === "ADMIN" ? "blue" : "default";
        return (
          <Tag color={color} className="rounded-full">
            {role}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 120,
      render: (record) => {
        const deletable = canDelete(record);
        return (
          <Space size={6}>
            <UserEdit user={record} save={save} />

            {deletable && (
              <Popconfirm
                title="Delete user"
                description="Are you sure you want to delete this user?"
                onConfirm={() => remove(record.id)}
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
        );
      },
    },
  ];

  return (
    <Card className="project-list-card overflow-hidden" style={{ marginLeft: 20 }}>
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Access control
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">Users</h2>
            <p className="m-0 text-sm text-slate-300">
              Manage users, roles and workspace membership.
            </p>
          </div>
          <UserAdd add={add} refetch={fetchData} />
        </div>
      </div>

      <StatCardGrid ariaLabel="User statistics">
        <StatCard
          label="Total"
          value={requesting ? "—" : users.length}
          hint="Registered accounts in view"
          icon={Users}
          theme="slate"
        />
        <StatCard
          label="Super"
          value={requesting ? "—" : superUsers}
          hint="Platform administrators"
          icon={ShieldCheck}
          theme="purple"
        />
        <StatCard
          label="Admins"
          value={requesting ? "—" : adminUsers}
          hint="Workspace administrators"
          icon={UserCog}
          theme="sky"
        />
        <StatCard
          label="Users"
          value={requesting ? "—" : regularUsers}
          hint="Standard workspace members"
          icon={UserCircle}
          theme="emerald"
        />
      </StatCardGrid>

      <Table
        loading={requesting}
        columns={columns}
        dataSource={users}
        rowKey={(record) => record.id}
        size="small"
        scroll={{ x: 800 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No users found"
            />
          ),
        }}
        rowClassName="align-top"
      />
    </Card>
  );
};

export default UserList;
