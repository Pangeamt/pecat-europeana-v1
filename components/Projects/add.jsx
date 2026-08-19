"use client";
import { FileTextOutlined, SlidersOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select, Slider, message } from "antd";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { createProjectRequest } from "@/services/project.services";
import { listProfilesRequest } from "@/services/profiles.services";

export default function CreateProjectForm({ user, onBack, onCreated }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const fetchProfiles = useCallback(async () => {
    if (!user?.workspaceId) return;
    try {
      setLoadingProfiles(true);
      const response = await listProfilesRequest({
        workspaceId: user.workspaceId,
      });
      setProfiles(response?.profiles ?? []);
    } catch (error) {
      console.error(error);
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  }, [user?.workspaceId]);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  const onFinish = async (values) => {
    try {
      messageApi.loading({
        content: t("projects.create.creating"),
        key: "add-project",
      });
      await createProjectRequest({
        name: values.name,
        description: values.description,
        profileId: values.profileId,
        threshold: values.threshold,
      });
      await onCreated?.();
      form.resetFields();
      messageApi.success({
        content: t("projects.create.created"),
        key: "add-project",
      });
    } catch (error) {
      console.error("Failed:", error);
      messageApi.error({
        content:
          error?.response?.data?.message || t("projects.create.createError"),
        key: "add-project",
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ threshold: 0.75 }}
      >
        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileTextOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("projects.create.detailsTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("projects.create.detailsSubtitle")}
                </div>
              </div>
            </div>
            <Form.Item
              label={t("projects.create.nameLabel")}
              name="name"
              rules={[
                { required: true, message: t("projects.create.nameRequired") },
              ]}
            >
              <Input placeholder={t("projects.create.namePlaceholder")} />
            </Form.Item>
            <Form.Item
              label={t("projects.create.descriptionLabel")}
              name="description"
            >
              <Input.TextArea
                rows={2}
                placeholder={t("projects.create.descriptionPlaceholder")}
              />
            </Form.Item>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <SlidersOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("projects.create.settingsTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("projects.create.settingsSubtitle")}
                </div>
              </div>
            </div>
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
                loading={loadingProfiles}
                placeholder={t("projects.create.profilePlaceholder")}
                optionFilterProp="label"
                notFoundContent={
                  profiles.length === 0
                    ? t("projects.create.noProfiles")
                    : undefined
                }
                options={profiles.map((profile) => ({
                  value: profile.id,
                  label: profile.name,
                }))}
              />
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
                  value={Form.useWatch("threshold", form)}
                  onChange={(value) => form.setFieldsValue({ threshold: value })}
                />
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  value={Form.useWatch("threshold", form)}
                  onChange={(value) => form.setFieldsValue({ threshold: value })}
                />
              </div>
            </Form.Item>
          </section>

          <div className="flex justify-end gap-2">
            <Button onClick={onBack}>{t("common.cancel")}</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
                border: 0,
              }}
            >
              {t("projects.create.submit")}
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
