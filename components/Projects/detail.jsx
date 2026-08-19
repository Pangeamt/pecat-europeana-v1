"use client";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, InputNumber, Select, Slider, Space, Spin, message } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { DOCUMENT_PENDING_STATUSES } from "@/lib/document-status";
import { listProfilesRequest } from "@/services/profiles.services";
import {
  fetchProjectByIdRequest,
  updateProjectRequest,
} from "@/services/project.services";
import { saveDocumentLabel } from "@/services/document.services";
import { userStore } from "@/store";
import DocumentAdd from "@/components/Documents/add";
import DocumentList from "@/components/Documents/list";

const ProjectDetail = ({ projectId }) => {
  const { t } = useTranslation();
  const { user } = userStore();
  const [form] = Form.useForm();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const thresholdValue = Form.useWatch("threshold", form);

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
    if (!user?.workspaceId) return;
    listProfilesRequest({ workspaceId: user.workspaceId })
      .then((response) => setProfiles(response?.profiles ?? []))
      .catch((error) => console.error(error));
  }, [user?.workspaceId]);

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

  const handleSaveDetails = async (values) => {
    try {
      setSaving(true);
      await updateProjectRequest(projectId, {
        name: values.name,
        description: values.description,
        profileId: values.profileId,
        threshold: values.threshold,
      });
      await fetchProject();
      message.success(t("projects.messages.updated"));
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || t("projects.messages.updateError"),
      );
    } finally {
      setSaving(false);
    }
  };

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
              {t("projects.detail.subtitle")}
            </p>
          </div>
          <Space wrap>
            <Link href="/dashboard">
              <Button icon={<ArrowLeftOutlined />}>{t("common.back")}</Button>
            </Link>
          </Space>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveDetails}
          initialValues={{
            name: project.name,
            description: project.description ?? "",
            profileId: project.profileId ?? undefined,
            threshold: project.tmThreshold ?? 0.75,
          }}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              label={t("projects.create.nameLabel")}
              name="name"
              rules={[
                { required: true, message: t("projects.create.nameRequired") },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t("projects.create.profileLabel")}
              name="profileId"
              rules={[
                {
                  required: true,
                  message: t("projects.create.profileRequired"),
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={profiles.map((profile) => ({
                  value: profile.id,
                  label: profile.name,
                }))}
              />
            </Form.Item>
          </div>
          <Form.Item
            label={t("projects.create.descriptionLabel")}
            name="description"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label={t("projects.create.thresholdLabel")}
            name="threshold"
          >
            <div className="flex items-center gap-3">
              <Slider
                className="flex-1"
                min={0}
                max={1}
                step={0.01}
                value={thresholdValue}
                onChange={(value) => form.setFieldsValue({ threshold: value })}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.01}
                value={thresholdValue}
                onChange={(value) => form.setFieldsValue({ threshold: value })}
              />
            </div>
          </Form.Item>
          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              style={{
                background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
                border: 0,
              }}
            >
              {t("common.save")}
            </Button>
          </div>
        </Form>
      </section>

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
    </Card>
  );
};

export default ProjectDetail;
