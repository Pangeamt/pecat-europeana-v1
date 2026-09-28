"use client";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Slider,
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
      profileIds:
        project.profileIds ?? (project.profileId ? [project.profileId] : []),
      threshold: project.tmThreshold ?? 0.75,
    });
  }, [open, project, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const profileIds = values.profileIds ?? [];
      // Clearing the Select leaves an empty array; the API wants an explicit
      // null to detach the default profile (undefined = "leave as is").
      await updateProjectRequest(project.id, {
        ...values,
        // The first one picked becomes the project's default profile.
        profileId: profileIds[0] ?? null,
        profileIds,
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
        <Form.Item
          label={t("projects.create.profileLabel")}
          name="profileIds"
          tooltip={t("projects.create.profileMultiHint")}
        >
          <Select
            mode="multiple"
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
      </Form>
    </Modal>
  );
}
