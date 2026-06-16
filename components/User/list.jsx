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
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { userStore } from "@/store";
import UserAdd from "./add";
import UserEdit from "./edit";

const UserList = () => {
  const { t } = useTranslation();
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
      message.error(t("users.messages.loadError"));
    } finally {
      setRequesting(false);
    }
  }, [currentUser, t]);

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
      message.success(t("users.messages.deleted"));
      await fetchData();
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.error || t("users.messages.deleteError"),
      );
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
      title: t("table.name"),
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
      title: t("table.email"),
      dataIndex: "email",
      key: "email",
      render: (email) => <span className="text-slate-700">{email}</span>,
    },
    {
      title: t("table.role"),
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
                title={t("users.deleteTitle")}
                description={t("users.deleteDescription")}
                onConfirm={() => remove(record.id)}
                okText={t("actions.yes")}
                cancelText={t("actions.no")}
              >
                <Tooltip title={t("users.removeTooltip")}>
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
              {t("users.eyebrow")}
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">
              {t("users.title")}
            </h2>
            <p className="m-0 text-sm text-slate-300">{t("users.subtitle")}</p>
          </div>
          <UserAdd add={add} refetch={fetchData} />
        </div>
      </div>

      <StatCardGrid ariaLabel={t("users.statsAria")}>
        <StatCard
          label={t("users.stats.total")}
          value={requesting ? "—" : users.length}
          hint={t("users.stats.totalHint")}
          icon={Users}
          theme="slate"
        />
        <StatCard
          label={t("users.stats.super")}
          value={requesting ? "—" : superUsers}
          hint={t("users.stats.superHint")}
          icon={ShieldCheck}
          theme="purple"
        />
        <StatCard
          label={t("users.stats.admins")}
          value={requesting ? "—" : adminUsers}
          hint={t("users.stats.adminsHint")}
          icon={UserCog}
          theme="sky"
        />
        <StatCard
          label={t("users.stats.users")}
          value={requesting ? "—" : regularUsers}
          hint={t("users.stats.usersHint")}
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
              description={t("users.empty")}
            />
          ),
        }}
        rowClassName="align-top"
      />
    </Card>
  );
};

export default UserList;
