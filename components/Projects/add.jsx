"use client";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Slider,
  Steps,
  Switch,
  message,
} from "antd";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { createProjectRequest } from "@/services/project.services";
import { listProfilesRequest } from "@/services/profiles.services";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function CreateProjectForm({ user, onBack, onCreated }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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

  // Called ONLY from the explicit create button: the <Form> has no onFinish,
  // so an implicit Enter submit on any field can never create the project.
  const handleCreate = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      // Both steps stay mounted, so validation can fail on a hidden field:
      // jump back to the step that owns the first invalid one.
      const firstField = errorInfo?.errorFields?.[0]?.name?.[0];
      if (firstField === "name" || firstField === "description") {
        setCurrentStep(0);
      }
      return;
    }
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
        mtqeThreshold: values.mtqeThreshold,
        llmJudge: values.llmJudge,
        llmSuggest: values.llmSuggest,
      });
      await onCreated?.();
      form.resetFields();
      setCurrentStep(0);
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

  // Step 0 gathers the project details; step 1 the translation settings.
  const goNext = async () => {
    try {
      await form.validateFields(["name"]);
      setCurrentStep(1);
    } catch {
      // validation message already shown on the field
    }
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          threshold: 0.75,
          mtqeThreshold: 0.85,
          llmJudge: true,
          llmSuggest: true,
        }}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Steps
              current={currentStep}
              responsive
              items={[
                { title: t("projects.create.detailsTitle") },
                { title: t("projects.create.settingsTitle") },
              ]}
            />
          </div>
          <section
            className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${
              currentStep === 0 ? "" : "hidden"
            }`}
          >
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

          <section
            className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${
              currentStep === 1 ? "" : "hidden"
            }`}
          >
            <Form.Item
              label={t("projects.create.profileLabel")}
              name="profileId"
            >
              <Select
                showSearch
                allowClear
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
                  value={Form.useWatch("mtqeThreshold", form)}
                  onChange={(value) =>
                    form.setFieldsValue({ mtqeThreshold: value })
                  }
                />
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  value={Form.useWatch("mtqeThreshold", form)}
                  onChange={(value) =>
                    form.setFieldsValue({ mtqeThreshold: value })
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
                <Switch disabled={Form.useWatch("llmJudge", form) === false} />
              </Form.Item>
            </div>
          </section>

          <div className="flex justify-end gap-2">
            {currentStep === 0 ? (
              <>
                <Button onClick={onBack}>{t("common.cancel")}</Button>
                <Button
                  type="primary"
                  icon={<ArrowRight size={15} />}
                  onClick={goNext}
                >
                  {t("common.next")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  icon={<ArrowLeft size={15} />}
                  onClick={() => setCurrentStep(0)}
                >
                  {t("common.back")}
                </Button>
                <Button
                  type="primary"
                  onClick={handleCreate}
                  style={{
                    background:
                      "var(--brand-gradient)",
                    border: 0,
                  }}
                >
                  {t("projects.create.submit")}
                </Button>
              </>
            )}
          </div>
        </div>
      </Form>
    </>
  );
}
