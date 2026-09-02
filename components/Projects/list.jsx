"use client";
import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { StatCard, StatCardGrid } from "@/components/shared/StatCard";
import { useWorkspaceScopeLabel } from "@/components/shared/useWorkspaceScopeLabel";
import {
  deleteProjectRequest,
  listProjectsRequest,
} from "@/services/project.services";
import { userStore } from "@/store";
import { Building2, Database, FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";
import ProjectAdd from "./add";
import EditProjectModal from "./EditProjectModal";

const ProjectList = () => {
  const { t } = useTranslation();
  const { user } = userStore();
  const { label: workspaceLabel, loading: workspaceLabelLoading } =
    useWorkspaceScopeLabel(user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectEdit, setProjectEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listProjectsRequest();
      setProjects(response?.docs ?? []);
    } catch (error) {
      console.error(error);
      message.error(t("projects.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id) => {
    try {
      message.loading({
        content: t("projects.messages.deleting"),
        key: "delete-project",
      });
      await deleteProjectRequest(id);
      await fetchProjects();
      message.success({
        content: t("projects.messages.deleted"),
        key: "delete-project",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content:
          error?.response?.data?.message || t("projects.messages.deleteError"),
        key: "delete-project",
      });
    }
  };

  const totalDocs = projects.reduce((sum, p) => sum + (p.docsCount ?? 0), 0);
  const totalSegments = projects.reduce(
    (sum, p) => sum + (p.segmentsCount ?? 0),
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
            href={`/dashboard/projects/${record.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600"
          >
            {name}
          </Link>
          {record.description ? (
            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
              {record.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: t("projects.profileColumn"),
      key: "profile",
      render: (record) =>
        record.profileName ? (
          <Tag color="geekblue" className="rounded-full">
            {record.profileName}
          </Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: t("projects.docsColumn"),
      key: "docsCount",
      width: 100,
      render: (record) => record.docsCount ?? 0,
    },
    {
      title: t("projects.segmentsColumn"),
      key: "segmentsCount",
      width: 110,
      render: (record) => record.segmentsCount ?? 0,
    },
    {
      title: t("table.progress"),
      key: "progress",
      width: 140,
      render: (record) => (
        <Progress percent={record.progress ?? 0} size="small" />
      ),
    },
    {
      title: t("table.actions"),
      key: "actions",
      width: 100,
      render: (record) => (
        <Space size={6}>
          <Tooltip title={t("projects.editTooltip")}>
            <Button
              icon={<Pencil size={15} />}
              type="text"
              size="small"
              onClick={() => setProjectEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title={t("projects.deleteTitle")}
            description={
              record.docsCount > 0
                ? t("projects.deleteBlockedDescription")
                : t("projects.deleteDescription")
            }
            onConfirm={() => handleDelete(record.id)}
            okText={t("actions.yes")}
            cancelText={t("actions.no")}
            disabled={record.docsCount > 0}
          >
            <Tooltip
              title={
                record.docsCount > 0
                  ? t("projects.deleteBlockedTooltip")
                  : t("projects.deleteTooltip")
              }
            >
              <Button
                danger
                type="text"
                size="small"
                icon={<Trash2 size={15} />}
                disabled={record.docsCount > 0}
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
                {t("projects.eyebrow")}
              </div>
              <h2 className="mb-1 mt-2 text-2xl font-semibold">
                {t("projects.title")}
              </h2>
              <p className="m-0 text-sm text-slate-300">
                {t("projects.subtitle")}
              </p>
            </div>
            {user?.role !== "USER" ? (
              <Space wrap>
                <Button
                  icon={<Plus size={15} />}
                  type="primary"
                  onClick={() => setIsCreateOpen(true)}
                >
                  {t("projects.createProject")}
                </Button>
              </Space>
            ) : null}
          </div>
        </div>

        <StatCardGrid columns={4} ariaLabel={t("projects.statsAria")}>
          <StatCard
            label={t("projects.stats.total")}
            value={loading ? "—" : projects.length}
            hint={t("projects.stats.totalHint")}
            icon={FolderKanban}
            theme="slate"
          />
          <StatCard
            label={t("projects.stats.docs")}
            value={loading ? "—" : totalDocs}
            hint={t("projects.stats.docsHint")}
            icon={Database}
            theme="violet"
          />
          <StatCard
            label={t("projects.stats.segments")}
            value={loading ? "—" : totalSegments}
            hint={t("projects.stats.segmentsHint")}
            icon={Database}
            theme="sky"
          />
          <StatCard
            label={t("projects.stats.workspace")}
            value={loading || workspaceLabelLoading ? "—" : workspaceLabel}
            hint={
              user?.role === "SUPER"
                ? t("projects.stats.workspaceSuperHint")
                : t("projects.stats.workspaceScopeHint")
            }
            icon={Building2}
            theme="emerald"
            compactValue
          />
        </StatCardGrid>

        <Table
          dataSource={projects}
          columns={columns}
          loading={loading}
          rowKey={(record) => record.id}
          size="small"
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("projects.empty")}
              />
            ),
          }}
          rowClassName="align-top"
        />
      </Card>

      <Modal
        title={t("projects.createModalTitle")}
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        destroyOnHidden
        footer={null}
        width={900}
      >
        <ProjectAdd
          user={user}
          onBack={() => setIsCreateOpen(false)}
          onCreated={async () => {
            await fetchProjects();
            setIsCreateOpen(false);
          }}
        />
      </Modal>

      <EditProjectModal
        open={Boolean(projectEdit)}
        project={projectEdit}
        onClose={() => setProjectEdit(null)}
        onSaved={async () => {
          setProjectEdit(null);
          await fetchProjects();
        }}
      />
    </>
  );
};

export default ProjectList;
