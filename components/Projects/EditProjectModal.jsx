"use client";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Slider,
  Switch,
  message,
} from "antd";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { listProfilesRequest } from "@/services/profiles.services";
import { updateProjectRequest } from "@/services/project.services";
import { userStore } from "@/store";

export default function EditProjectModal({ open, project, onClose, onSaved }) {
  const { t } = useTranslation();
  const { user } = userStore();
  const [form] = Form.useForm();
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const thresholdValue = Form.useWatch("threshold", form);
  const mtqeThresholdValue = Form.useWatch("mtqeThreshold", form);
  const llmJudgeValue = Form.useWatch("llmJudge", form);

  useEffect(() => {
    if (!open || !user?.workspaceId) return;
    setLoadingProfiles(true);
    listProfilesRequest({ workspaceId: user.workspaceId })
      .then((response) => setProfiles(response?.profiles ?? []))
      .catch((error) => console.error(error))
      .finally(() => setLoadingProfiles(false));
  }, [open, user?.workspaceId]);

  useEffect(() => {
    if (!open || !project) return;
    form.setFieldsValue({
      name: project.name,
      description: project.description ?? "",
      profileId: project.profileId ?? undefined,
      threshold: project.tmThreshold ?? 0.75,
      mtqeThreshold: project.pipeline?.mtqeThreshold ?? 0.85,
      llmJudge: project.pipeline?.llmJudge ?? true,
      llmSuggest: project.pipeline?.llmSuggest ?? true,
    });
  }, [open, project, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      // Clearing the Select leaves undefined; the API wants an explicit null
      // to detach the profile (undefined = "leave as is").
      await updateProjectRequest(project.id, {
        ...values,
        profileId: values.profileId ?? null,
      });
      message.success(t("projects.messages.updated"));
      onSaved?.();
    } catch (error) {
      if (error?.errorFields) return;
      console.error(error);
      message.error(
        error?.response?.data?.message || t("projects.messages.updateError"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={t("projects.editModalTitle")}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t("projects.create.nameLabel")}
          name="name"
          rules={[
            { required: true, message: t("projects.create.nameRequired") },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={t("projects.create.profileLabel")} name="profileId">
          <Select
            showSearch
            allowClear
            loading={loadingProfiles}
            optionFilterProp="label"
            placeholder={t("projects.create.profilePlaceholder")}
            options={profiles.map((profile) => ({
              value: profile.id,
              label: profile.name,
            }))}
          />
        </Form.Item>
        <Form.Item
          label={t("projects.create.descriptionLabel")}
          name="description"
        >
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label={t("projects.create.thresholdLabel")} name="threshold">
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
              onChange={(value) => form.setFieldsValue({ threshold: value ?? 0 })}
            />
          </div>
        </Form.Item>
        <Form.Item
          label={t("projects.create.mtqeThresholdLabel")}
          name="mtqeThreshold"
          tooltip={t("projects.create.mtqeThresholdHint")}
        >
          <div className="flex items-center gap-3">
            <Slider
              className="flex-1"
              min={0}
              max={1}
              step={0.01}
              value={mtqeThresholdValue}
              onChange={(value) => form.setFieldsValue({ mtqeThreshold: value })}
            />
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              value={mtqeThresholdValue}
              onChange={(value) =>
                form.setFieldsValue({ mtqeThreshold: value ?? 0 })
              }
            />
          </div>
        </Form.Item>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Form.Item
            label={t("projects.create.llmJudgeLabel")}
            name="llmJudge"
            valuePropName="checked"
            tooltip={t("projects.create.llmJudgeHint")}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={t("projects.create.llmSuggestLabel")}
            name="llmSuggest"
            valuePropName="checked"
            tooltip={t("projects.create.llmSuggestHint")}
          >
            <Switch disabled={llmJudgeValue === false} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
