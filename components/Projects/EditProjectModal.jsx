"use client";
import {
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { listProfilesRequest } from "@/services/profiles.services";
import {
  fetchProjectByIdRequest,
  updateProjectRequest,
} from "@/services/project.services";
import { userStore } from "@/store";

export default function EditProjectModal({ open, project, onClose, onSaved }) {
  const { t } = useTranslation();
  const { user } = userStore();
  const [form] = Form.useForm();
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const profileIdsValue = Form.useWatch("profileIds", form);

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
    // The caller may be the projects list, whose rows only carry the
    // default profile (profileId/profileName) — not the full assigned set.
    // Re-fetching the detail here guarantees profileIds is complete
    // regardless of which page opened this modal, so saving never silently
    // detaches profiles the list just didn't know about.
    let cancelled = false;
    const applyFields = (source) => {
      if (cancelled) return;
      form.setFieldsValue({
        name: source.name,
        description: source.description ?? "",
        profileIds:
          source.profileIds ?? (source.profileId ? [source.profileId] : []),
      });
    };
    applyFields(project);
    fetchProjectByIdRequest(project.id)
      .then((response) => {
        if (response?.project) applyFields(response.project);
      })
      .catch((error) => console.error(error));
    return () => {
      cancelled = true;
    };
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
          // The project can be left without profiles, but then no new
          // document can be uploaded until at least one is assigned again.
          extra={
            profileIdsValue?.length ? undefined : (
              <span className="text-amber-600">
                {t("projects.create.profileEmptyWarning")}
              </span>
            )
          }
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
      </Form>
    </Modal>
  );
}
