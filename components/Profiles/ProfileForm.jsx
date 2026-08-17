"use client";
import {
  BookOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Select, message } from "antd";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { fetchGlossariesRequest } from "@/services/glossary.services";
import {
  addProfileRequest,
  updateProfileRequest,
} from "@/services/profiles.services";
import { fetchTMRequest } from "@/services/tm.services";

const toAssetOption = (asset) => {
  const source = asset.sourceLanguage ?? asset.context?.source ?? "-";
  const target = asset.targetLanguage ?? asset.context?.target ?? "-";
  return {
    value: asset.id,
    label: `${asset.name} (${source} → ${target})`,
  };
};

export default function ProfileForm({ user, profile, onBack, onSaved }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [tms, setTms] = useState([]);
  const [glossaries, setGlossaries] = useState([]);

  const isEdit = Boolean(profile);

  // Assets must belong to the profile's workspace — the API validates
  // TMs/glossaries against it (relevant for SUPER users, who fetch all).
  const scopedTms = profile?.workspaceId
    ? tms.filter((tm) => tm.workspaceId === profile.workspaceId)
    : tms;
  const scopedGlossaries = profile?.workspaceId
    ? glossaries.filter(
        (glossary) => glossary.workspaceId === profile.workspaceId,
      )
    : glossaries;

  const formalityOptions = [
    { value: "FORMAL", label: t("profiles.form.formalityFormal") },
    { value: "NEUTRO", label: t("profiles.form.formalityNeutral") },
    { value: "INFORMAL", label: t("profiles.form.formalityInformal") },
  ];

  const fetchAssets = useCallback(async () => {
    if (!user) return;

    const query =
      user.role === "SUPER"
        ? { size: 1000 }
        : user.workspaceId
          ? { workspaceId: user.workspaceId, size: 1000 }
          : null;

    if (!query) return;

    try {
      setLoadingAssets(true);
      const [tmResponse, glossaryResponse] = await Promise.all([
        fetchTMRequest(query),
        fetchGlossariesRequest(query),
      ]);
      setTms(tmResponse?.docs ?? []);
      setGlossaries(glossaryResponse?.docs ?? []);
    } catch (error) {
      console.error(error);
      messageApi.error(t("profiles.form.assetsError"));
    } finally {
      setLoadingAssets(false);
    }
  }, [user, messageApi, t]);

  useEffect(() => {
    void fetchAssets();
  }, [fetchAssets]);

  const onFinish = async (values) => {
    const payload = {
      name: values.name,
      description: values.description,
      formality: values.formality,
      instructions: values.instructions,
      domain: values.domain,
      tmIds: values.tmIds ?? [],
      glossaryIds: values.glossaryIds ?? [],
    };

    try {
      messageApi.loading({
        content: t(
          isEdit ? "profiles.messages.updating" : "profiles.messages.creating",
        ),
        key: "save-profile",
      });
      if (isEdit) {
        await updateProfileRequest(profile.id, payload);
      } else {
        await addProfileRequest(payload);
      }
      await onSaved?.();
      if (!isEdit) form.resetFields();
      messageApi.success({
        content: t(
          isEdit ? "profiles.messages.updated" : "profiles.messages.created",
        ),
        key: "save-profile",
      });
    } catch (error) {
      console.error("Failed:", error);
      messageApi.error({
        content:
          error?.response?.data?.message ||
          t(
            isEdit
              ? "profiles.messages.updateError"
              : "profiles.messages.createError",
          ),
        key: "save-profile",
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
        initialValues={
          profile
            ? {
                name: profile.name,
                description: profile.description ?? "",
                domain: profile.domain ?? "",
                formality: profile.formality ?? "FORMAL",
                instructions: profile.instructions ?? "",
                tmIds: profile.tms?.map((tm) => tm.id) ?? [],
                glossaryIds:
                  profile.glossaries?.map((glossary) => glossary.id) ?? [],
              }
            : { formality: "FORMAL", tmIds: [], glossaryIds: [] }
        }
      >
        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileTextOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("profiles.form.detailsTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("profiles.form.detailsSubtitle")}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Form.Item
                label={t("profiles.form.nameLabel")}
                name="name"
                rules={[
                  { required: true, message: t("profiles.form.nameRequired") },
                ]}
              >
                <Input placeholder={t("profiles.form.namePlaceholder")} />
              </Form.Item>
              <Form.Item label={t("profiles.form.domainLabel")} name="domain">
                <Input placeholder={t("profiles.form.optional")} />
              </Form.Item>
            </div>
            <Form.Item
              label={t("profiles.form.descriptionLabel")}
              name="description"
            >
              <Input.TextArea
                rows={2}
                placeholder={t("profiles.form.descriptionPlaceholder")}
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
                  {t("profiles.form.settingsTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("profiles.form.settingsSubtitle")}
                </div>
              </div>
            </div>
            <Form.Item
              label={t("profiles.form.formalityLabel")}
              name="formality"
              rules={[
                {
                  required: true,
                  message: t("profiles.form.formalityRequired"),
                },
              ]}
            >
              <Select options={formalityOptions} />
            </Form.Item>
            <Form.Item
              label={t("profiles.form.instructionsLabel")}
              name="instructions"
            >
              <Input.TextArea
                rows={3}
                placeholder={t("profiles.form.instructionsPlaceholder")}
              />
            </Form.Item>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <DatabaseOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("profiles.form.tmsTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("profiles.form.tmsSubtitle")}
                </div>
              </div>
            </div>
            <Form.Item label={t("profiles.form.tmsLabel")} name="tmIds">
              <Select
                mode="multiple"
                showSearch
                loading={loadingAssets}
                placeholder={t("profiles.form.tmsPlaceholder")}
                optionFilterProp="label"
                notFoundContent={
                  scopedTms.length === 0 ? t("profiles.form.noTms") : undefined
                }
                options={scopedTms.map(toAssetOption)}
              />
            </Form.Item>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BookOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("profiles.form.glossariesTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("profiles.form.glossariesSubtitle")}
                </div>
              </div>
            </div>
            <Form.Item
              label={t("profiles.form.glossariesLabel")}
              name="glossaryIds"
            >
              <Select
                mode="multiple"
                showSearch
                loading={loadingAssets}
                placeholder={t("profiles.form.glossariesPlaceholder")}
                optionFilterProp="label"
                notFoundContent={
                  scopedGlossaries.length === 0
                    ? t("profiles.form.noGlossaries")
                    : undefined
                }
                options={scopedGlossaries.map(toAssetOption)}
              />
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
              {t(
                isEdit ? "profiles.form.submitEdit" : "profiles.form.submit",
              )}
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
