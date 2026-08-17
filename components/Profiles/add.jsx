"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Steps, Tag, message } from "antd";
import { useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { fetchGlossariesRequest } from "@/services/glossary.services";
import { addProfileRequest } from "@/services/profiles.services";
import { fetchTMRequest } from "@/services/tm.services";
import { userStore } from "@/store";

const WIZARD_STEPS = [
  {
    key: "info",
    titleKey: "profiles.add.steps.info",
    descKey: "profiles.add.steps.infoDesc",
  },
  {
    key: "tms",
    titleKey: "profiles.add.steps.tms",
    descKey: "profiles.add.steps.tmsDesc",
  },
  {
    key: "glossaries",
    titleKey: "profiles.add.steps.glossaries",
    descKey: "profiles.add.steps.glossariesDesc",
  },
];

const toAssetOption = (asset) => {
  const source = asset.sourceLanguage ?? asset.context?.source ?? "-";
  const target = asset.targetLanguage ?? asset.context?.target ?? "-";
  return {
    value: asset.id,
    label: `${asset.name} (${source} → ${target})`,
  };
};

const ProfileAdd = ({ refetch }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [tms, setTms] = useState([]);
  const [glossaries, setGlossaries] = useState([]);
  const { user } = userStore();

  const name = Form.useWatch("name", form);
  const formality = Form.useWatch("formality", form);
  const tmIds = Form.useWatch("tmIds", form) ?? [];
  const glossaryIds = Form.useWatch("glossaryIds", form) ?? [];

  const formalityOptions = [
    { value: "FORMAL", label: t("profiles.form.formalityFormal") },
    { value: "NEUTRO", label: t("profiles.form.formalityNeutral") },
    { value: "INFORMAL", label: t("profiles.form.formalityInformal") },
  ];

  const selectedTmNames = tms
    .filter((tm) => tmIds.includes(tm.id))
    .map((tm) => tm.name);

  const selectedGlossaryNames = glossaries
    .filter((glossary) => glossaryIds.includes(glossary.id))
    .map((glossary) => glossary.name);

  const resetWizard = () => {
    form.resetFields();
    setCurrentStep(0);
  };

  const showModal = () => {
    setIsModalOpen(true);

    // The profile is always created in the user's own workspace, so only
    // that workspace's assets are selectable.
    if (!user?.workspaceId) return;
    const query = { workspaceId: user.workspaceId, size: 1000 };

    setLoadingAssets(true);
    Promise.all([fetchTMRequest(query), fetchGlossariesRequest(query)])
      .then(([tmResponse, glossaryResponse]) => {
        setTms(tmResponse?.docs ?? []);
        setGlossaries(glossaryResponse?.docs ?? []);
      })
      .catch((error) => {
        console.error(error);
        setTms([]);
        setGlossaries([]);
      })
      .finally(() => setLoadingAssets(false));
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetWizard();
  };

  const goNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(["name", "formality"]);
      } catch {
        return;
      }
    }
    setCurrentStep((step) => Math.min(step + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleFinish = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      setCurrentStep(0);
      return;
    }

    try {
      setSaving(true);
      message.loading({
        content: t("profiles.messages.creating"),
        key: "add-profile",
      });
      await addProfileRequest({
        name: values.name,
        description: values.description,
        formality: values.formality,
        instructions: values.instructions,
        domain: values.domain,
        tmIds: values.tmIds ?? [],
        glossaryIds: values.glossaryIds ?? [],
      });
      message.success({
        content: t("profiles.messages.created"),
        key: "add-profile",
      });
      setIsModalOpen(false);
      resetWizard();
      await refetch?.();
    } catch (error) {
      console.error(error);
      message.error({
        content:
          error?.response?.data?.message || t("profiles.messages.createError"),
        key: "add-profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <>
      <Button
        icon={<PlusOutlined />}
        type="primary"
        onClick={showModal}
        className="shadow-sm"
        style={{
          background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
          border: 0,
        }}
      >
        {t("profiles.createProfile")}
      </Button>
      <Modal
        title={t("profiles.createModalTitle")}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          <div className="flex justify-between gap-3">
            <Button onClick={handleCancel}>{t("common.cancel")}</Button>
            <div className="flex gap-2">
              {currentStep > 0 ? (
                <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
                  {t("common.back")}
                </Button>
              ) : null}
              {isLastStep ? (
                <Button
                  type="primary"
                  loading={saving}
                  onClick={handleFinish}
                  style={{
                    background:
                      "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
                    border: 0,
                  }}
                >
                  {t("profiles.form.submit")}
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={goNext}
                  style={{
                    background: "#98C441",
                    borderColor: "#98C441",
                  }}
                >
                  {t("common.next")}
                </Button>
              )}
            </div>
          </div>
        }
        width={860}
        centered
        destroyOnHidden
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-4 pr-12 text-white">
          <div className="absolute -right-10 -top-10 size-28 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="relative">
            <h2 className="mt-1 text-xl font-semibold">
              {t("profiles.add.heading")}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {t("profiles.add.headingSubtitle")}
            </p>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white px-6 py-4">
          <Steps
            current={currentStep}
            responsive
            items={WIZARD_STEPS.map(({ titleKey, descKey }) => ({
              title: t(titleKey),
              description: t(descKey),
            }))}
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ formality: "FORMAL", tmIds: [], glossaryIds: [] }}
          className="max-h-[58vh] overflow-y-auto p-6"
        >
          <section
            className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br from-blue-50/50 to-white p-5 ${
              currentStep === 0 ? "" : "hidden"
            }`}
          >
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600/80">
                {t("profiles.add.step1Eyebrow")}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {t("profiles.add.step1Title")}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t("profiles.add.step1Subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Form.Item
                label={t("profiles.form.nameLabel")}
                name="name"
                rules={[
                  { required: true, message: t("profiles.form.nameRequired") },
                ]}
              >
                <Input
                  size="large"
                  placeholder={t("profiles.form.namePlaceholder")}
                />
              </Form.Item>
              <Form.Item label={t("profiles.form.domainLabel")} name="domain">
                <Input size="large" placeholder={t("profiles.form.optional")} />
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                <Select size="large" options={formalityOptions} />
              </Form.Item>
            </div>
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

          <section
            className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50/50 to-white p-5 ${
              currentStep === 1 ? "" : "hidden"
            }`}
          >
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600/80">
                {t("profiles.add.step2Eyebrow")}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {t("profiles.add.step2Title")}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t("profiles.add.step2Subtitle")}
              </p>
            </div>
            <Form.Item label={t("profiles.form.tmsLabel")} name="tmIds">
              <Select
                mode="multiple"
                size="large"
                showSearch
                loading={loadingAssets}
                placeholder={t("profiles.form.tmsPlaceholder")}
                notFoundContent={
                  tms.length === 0 ? t("profiles.form.noTms") : undefined
                }
                optionFilterProp="label"
                options={tms.map(toAssetOption)}
              />
            </Form.Item>
          </section>

          <div className={currentStep === 2 ? "space-y-4" : "hidden"}>
            <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-5">
              <div className="mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600/80">
                  {t("profiles.add.step3Eyebrow")}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {t("profiles.add.step3Title")}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {t("profiles.add.step3Subtitle")}
                </p>
              </div>
              <Form.Item
                label={t("profiles.form.glossariesLabel")}
                name="glossaryIds"
              >
                <Select
                  mode="multiple"
                  size="large"
                  showSearch
                  loading={loadingAssets}
                  placeholder={t("profiles.form.glossariesPlaceholder")}
                  notFoundContent={
                    glossaries.length === 0
                      ? t("profiles.form.noGlossaries")
                      : undefined
                  }
                  optionFilterProp="label"
                  options={glossaries.map(toAssetOption)}
                />
              </Form.Item>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("profiles.add.summaryTitle")}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs text-slate-500">
                    {t("profiles.add.summaryName")}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-medium text-slate-900">
                    <span>{name || "-"}</span>
                    {formality ? (
                      <Tag color="geekblue" className="rounded-full">
                        {
                          formalityOptions.find(
                            (option) => option.value === formality,
                          )?.label
                        }
                      </Tag>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    {t("profiles.add.summaryTms")}
                  </div>
                  <div className="mt-1 font-medium text-slate-900">
                    {selectedTmNames.length > 0
                      ? selectedTmNames.join(", ")
                      : t("profiles.add.noneSelected")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    {t("profiles.add.summaryGlossaries")}
                  </div>
                  <div className="mt-1 font-medium text-slate-900">
                    {selectedGlossaryNames.length > 0
                      ? selectedGlossaryNames.join(", ")
                      : t("profiles.add.noneSelected")}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ProfileAdd;
