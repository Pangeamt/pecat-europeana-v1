"use client";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Space, Spin, message } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, Files, Percent, SlidersHorizontal } from "lucide-react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { StatCard, StatCardGrid } from "@/components/shared/StatCard";
import { DOCUMENT_PENDING_STATUSES } from "@/lib/document-status";
import { fetchProjectByIdRequest } from "@/services/project.services";
import { saveDocumentLabel } from "@/services/document.services";
import DocumentAdd from "@/components/Documents/add";
import DocumentList from "@/components/Documents/list";
import EditProjectModal from "./EditProjectModal";

function summarizeDocuments(documents) {
  let segmentsCount = 0;
  let finishedCount = 0;

  for (const doc of documents) {
    const total = doc.totalCount ?? 0;
    segmentsCount += total;
    const pending = (doc.countByStatus ?? [])
      .filter(
        (item) =>
          item.Status === "NOT_REVIEWED" || item.Status === "TRANSLATED_MT",
      )
      .reduce((sum, item) => sum + item._count, 0);
    finishedCount += total - pending;
  }

  return {
    segmentsCount,
    finishedCount,
    progress:
      segmentsCount > 0 ? Math.round((finishedCount * 100) / segmentsCount) : 0,
  };
}

const ProjectDetail = ({ projectId }) => {
  const { t } = useTranslation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetchProjectByIdRequest(projectId);
      setProject(response?.project ?? null);
    } catch (error) {
      console.error(error);
      message.error(t("projects.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  const fetchProjectRef = useRef(fetchProject);
  fetchProjectRef.current = fetchProject;

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    const hasPending = (project?.documents ?? []).some((doc) =>
      DOCUMENT_PENDING_STATUSES.includes(doc.status),
    );
    if (!hasPending) return;

    const timer = setInterval(() => {
      fetchProjectRef.current();
    }, 5000);
    return () => clearInterval(timer);
  }, [project?.documents]);

  const handleSaveDocumentLabel = async ({ documentId, label }) => {
    try {
      await saveDocumentLabel(documentId, label);
      await fetchProject();
    } catch (error) {
      console.error(error);
      message.error(t("documents.editError"));
    }
  };

  if (loading) {
    return (
      <Card style={{ marginLeft: 20 }}>
        <div className="flex min-h-[300px] items-center justify-center">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card style={{ marginLeft: 20 }}>
        <Empty description={t("projects.detail.notFound")} />
        <div className="mt-4 flex justify-center">
          <Link href="/dashboard">
            <Button icon={<ArrowLeftOutlined />}>{t("common.back")}</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const docsCount = project.documentsTotal ?? project.documents?.length ?? 0;
  const { segmentsCount, finishedCount, progress } = summarizeDocuments(
    project.documents ?? [],
  );

  return (
    <Card style={{ marginLeft: 20 }} className="overflow-hidden">
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              {t("projects.eyebrow")}
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">{project.name}</h2>
            <p className="m-0 text-sm text-slate-300">
              {project.description || t("projects.detail.subtitle")}
            </p>
          </div>
          <Space wrap>
            <Link href="/dashboard">
              <Button icon={<ArrowLeftOutlined />}>{t("common.back")}</Button>
            </Link>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsEditOpen(true)}
            >
              {t("actions.edit")}
            </Button>
          </Space>
        </div>
      </div>

      <StatCardGrid columns={4} ariaLabel={t("projects.detail.statsAria")}>
        <StatCard
          label={t("projects.profileColumn")}
          value={
            project.profileId ? (
              <Link
                href={`/dashboard/profiles/${project.profileId}`}
                className="hover:text-blue-600"
              >
                {project.profileName ?? t("projects.detail.noProfile")}
              </Link>
            ) : (
              t("projects.detail.noProfile")
            )
          }
          icon={SlidersHorizontal}
          theme="violet"
          compactValue
        />
        <StatCard
          label={t("projects.create.thresholdLabel")}
          value={`${Math.round((project.tmThreshold ?? 0) * 100)}%`}
          icon={Percent}
          theme="sky"
        />
        <StatCard
          label={t("projects.docsColumn")}
          value={docsCount}
          hint={t("projects.detail.docsHint", { count: segmentsCount })}
          icon={Files}
          theme="slate"
        />
        <StatCard
          label={t("table.progress")}
          value={`${progress}%`}
          hint={t("projects.detail.progressHint", {
            finished: finishedCount,
            total: segmentsCount,
          })}
          icon={CircleCheck}
          theme="emerald"
        />
      </StatCardGrid>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="font-semibold text-slate-900">
            {t("projects.detail.documentsTitle")}
          </div>
          <DocumentAdd project={project} refetch={fetchProject} />
        </div>
        <DocumentList
          documents={project.documents ?? []}
          onSave={handleSaveDocumentLabel}
          onRefresh={fetchProject}
        />
      </section>

      <EditProjectModal
        open={isEditOpen}
        project={project}
        onClose={() => setIsEditOpen(false)}
        onSaved={async () => {
          setIsEditOpen(false);
          await fetchProject();
        }}
      />
    </Card>
  );
};

export default ProjectDetail;
