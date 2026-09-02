"use client";
import {
  Button,
  Card,
  Empty,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { StatCard, StatCardGrid } from "@/components/shared/StatCard";
import { useWorkspaceScopeLabel } from "@/components/shared/useWorkspaceScopeLabel";
import {
  deleteProfileRequest,
  listProfilesRequest,
} from "@/services/profiles.services";
import { userStore } from "@/store";
import Link from "next/link";
import { Building2, Database, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import ProfileAdd from "./add";

const FORMALITY_TAG_COLORS = {
  FORMAL: "geekblue",
  NEUTRO: "default",
  INFORMAL: "orange",
};

const ProfileList = () => {
  const { t } = useTranslation();
  const { user } = userStore();
  const { label: workspaceLabel, loading: workspaceLabelLoading } =
    useWorkspaceScopeLabel(user);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        setProfiles([]);
        return;
      }

      const query =
        user.role === "SUPER"
          ? {}
          : user.workspaceId
            ? { workspaceId: user.workspaceId }
            : null;

      if (!query) {
        setProfiles([]);
        return;
      }

      const response = await listProfilesRequest(query);
      setProfiles(response?.profiles ?? []);
    } catch (error) {
      console.error(error);
      message.error(t("profiles.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  const handleDelete = async (id) => {
    try {
      message.loading({
        content: t("profiles.messages.deleting"),
        key: "delete-profile",
      });
      await deleteProfileRequest(id);
      await fetchProfiles();
      message.success({
        content: t("profiles.messages.deleted"),
        key: "delete-profile",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content:
          error?.response?.data?.message || t("profiles.messages.deleteError"),
        key: "delete-profile",
      });
    }
  };

  const linkedResources = profiles.reduce(
    (total, profile) =>
      total + (profile.tms?.length ?? 0) + (profile.glossaries?.length ?? 0),
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
            href={`/dashboard/profiles/${record.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600"
          >
            {name}
          </Link>
          {record.description ? (
            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
              {record.description}
            </div>
          ) : null}
          <div className="mt-1 text-xs text-slate-400">{record.id}</div>
        </div>
      ),
    },
    {
      title: t("table.domain"),
      key: "domain",
      render: (record) =>
        record.domain ? (
          <Tag color="blue" className="rounded-full">
            {record.domain}
          </Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: t("profiles.formality"),
      key: "formality",
      render: (record) => (
        <Tag
          color={FORMALITY_TAG_COLORS[record.formality] ?? "default"}
          className="rounded-full"
        >
          {record.formality}
        </Tag>
      ),
    },
    {
      title: t("profiles.tmsColumn"),
      key: "tms",
      render: (record) =>
        record.tms?.length ? (
          <Tooltip title={record.tms.map((tm) => tm.name).join(", ")}>
            <Tag color="geekblue" className="rounded-full">
              {record.tms.length}
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: t("profiles.glossariesColumn"),
      key: "glossaries",
      render: (record) =>
        record.glossaries?.length ? (
          <Tooltip
            title={record.glossaries
              .map((glossary) => glossary.name)
              .join(", ")}
          >
            <Tag color="green" className="rounded-full">
              {record.glossaries.length}
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: t("table.actions"),
      key: "actions",
      width: 120,
      render: (record) => (
        <Space size={6}>
          <Tooltip title={t("profiles.editTooltip")}>
            <Link href={`/dashboard/profiles/${record.id}`}>
              <Button icon={<Pencil size={15} />} type="text" size="small" />
            </Link>
          </Tooltip>
          <Popconfirm
            title={t("profiles.deleteTitle")}
            description={t("profiles.deleteDescription")}
            onConfirm={() => handleDelete(record.id)}
            okText={t("actions.yes")}
            cancelText={t("actions.no")}
          >
            <Tooltip title={t("profiles.deleteTooltip")}>
              <Button
                danger
                type="text"
                icon={<Trash2 size={15} />}
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
        <div className="mb-5 rounded-2xl bg-gradient-to-br from-primary-900 to-primary-700 p-5 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">
                {t("profiles.eyebrow")}
              </div>
              <h2 className="mb-1 mt-2 text-2xl font-semibold">
                {t("profiles.title")}
              </h2>
              <p className="m-0 text-sm text-slate-300">
                {t("profiles.subtitle")}
              </p>
            </div>
            <Space wrap>
              <ProfileAdd refetch={fetchProfiles} />
            </Space>
          </div>
        </div>

        <StatCardGrid columns={3} ariaLabel={t("profiles.statsAria")}>
          <StatCard
            label={t("profiles.stats.total")}
            value={loading ? "—" : profiles.length}
            hint={t("profiles.stats.totalHint")}
            icon={SlidersHorizontal}
            theme="slate"
          />
          <StatCard
            label={t("profiles.stats.resources")}
            value={loading ? "—" : linkedResources}
            hint={t("profiles.stats.resourcesHint")}
            icon={Database}
            theme="violet"
          />
          <StatCard
            label={t("profiles.stats.workspace")}
            value={loading || workspaceLabelLoading ? "—" : workspaceLabel}
            hint={
              user?.role === "SUPER"
                ? t("profiles.stats.workspaceSuperHint")
                : t("profiles.stats.workspaceScopeHint")
            }
            icon={Building2}
            theme="emerald"
            compactValue
          />
        </StatCardGrid>

        <Table
          dataSource={profiles}
          columns={columns}
          loading={loading}
          rowKey={(record) => record.id}
          size="small"
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("profiles.empty")}
              />
            ),
          }}
          rowClassName="align-top"
        />
      </Card>
    </>
  );
};

export default ProfileList;
