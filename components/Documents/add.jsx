"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  InputNumber,
  Modal,
  Select,
  Slider,
  Steps,
  Switch,
  Upload,
  message,
} from "antd";
import { useMemo, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import locales from "@/lib/locales.json";
import { checkFile } from "@/lib/utils";
import { fetchGlossariesRequest } from "@/services/glossary.services";
import { fetchTMRequest } from "@/services/tm.services";
import { userStore } from "@/store";

const { Dragger } = Upload;

const languageOptions = Object.keys(locales).map((code) => ({
  value: code,
  label: locales[code][0],
}));

const WIZARD_STEPS = [
  { key: "languages", titleKey: "documents.add.steps.principal" },
  { key: "profile", titleKey: "documents.add.steps.tms" },
  { key: "file", titleKey: "documents.add.steps.file" },
];

const DocumentAdd = ({ project, refetch }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [src, setSrc] = useState(null);
  const [tgt, setTgt] = useState(null);
  const [inheritProfile, setInheritProfile] = useState(true);
  const [tmIds, setTmIds] = useState([]);
  const [glossaryIds, setGlossaryIds] = useState([]);
  const [tms, setTms] = useState([]);
  const [glossaries, setGlossaries] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [threshold, setThreshold] = useState(project?.tmThreshold ?? 0.75);
  const { user } = userStore();

  const filteredTms = useMemo(() => {
    if (!src || !tgt) return [];
    const srcPfx = src.substring(0, 2);
    const tgtPfx = tgt.substring(0, 2);
    return tms.filter((tm) => {
      const tmSource = tm.sourceLanguage ?? tm.context?.source;
      const tmTarget = tm.targetLanguage ?? tm.context?.target;
      return (
        tmSource?.substring(0, 2) === srcPfx &&
        tmTarget?.substring(0, 2) === tgtPfx
      );
    });
  }, [src, tgt, tms]);

  const filteredGlossaries = useMemo(() => {
    if (!src || !tgt) return [];
    const srcPfx = src.substring(0, 2);
    const tgtPfx = tgt.substring(0, 2);
    return glossaries.filter((glossary) => {
      const glossarySource = glossary.context?.source;
      const glossaryTarget = glossary.context?.target;
      return (
        glossarySource?.substring(0, 2) === srcPfx &&
        glossaryTarget?.substring(0, 2) === tgtPfx
      );
    });
  }, [src, tgt, glossaries]);

  const resetWizard = () => {
    form.resetFields();
    setCurrentStep(0);
    setSrc(null);
    setTgt(null);
    setInheritProfile(true);
    setTmIds([]);
    setGlossaryIds([]);
    setThreshold(project?.tmThreshold ?? 0.75);
  };

  const showModal = () => {
    setIsModalOpen(true);
    if (!user?.workspaceId) return;
    setLoadingAssets(true);
    // Only DAAIT-ready assets (SUCCESS) can be picked for a document.
    Promise.all([
      fetchTMRequest({ workspaceId: user.workspaceId, size: 1000, status: "SUCCESS" }),
      fetchGlossariesRequest({ workspaceId: user.workspaceId, size: 1000, status: "SUCCESS" }),
    ])
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
        await form.validateFields(["src", "tgt"]);
      } catch {
        return;
      }
    }
    setCurrentStep((step) => Math.min(step + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => setCurrentStep((step) => Math.max(step - 1, 0));

  const getTgtOptions = (source) =>
    source ? languageOptions.filter((option) => option.value !== source) : [];

  const uploadProps = {
    multiple: true,
    name: "file",
    action: `/api/projects/${project.id}/documents`,
    showUploadList: true,
    data: () => ({
      mt: "true",
      src,
      tgt,
      inherit_profile: String(inheritProfile),
      tm_threshold: threshold,
      ...(inheritProfile
        ? {}
        : {
            tm_ids: JSON.stringify(tmIds),
            glossary_ids: JSON.stringify(glossaryIds),
          }),
    }),
    onChange(info) {
      if (info.file.status === "done") {
        message.success(
          t("documents.add.uploadSuccess", { name: info.file.name }),
        );
        refetch?.();
        setIsModalOpen(false);
        resetWizard();
      } else if (info.file.status === "error") {
        message.error(t("documents.add.uploadError", { name: info.file.name }));
      }
    },
    beforeUpload: (file) => {
      const extension = checkFile(file);
      if (!extension) {
        message.error(t("documents.add.invalidType"));
        return false;
      }
      const maxMb = extension === "sdlxliff" ? 500 : 100;
      if (file.size / 1024 / 1024 >= maxMb) {
        message.error(t("documents.add.tooLarge", { max: maxMb }));
        return false;
      }
      return true;
    },
    disabled: !src || !tgt,
  };

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-white p-5">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t("documents.add.step1Eyebrow")}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {t("documents.add.step1Title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("documents.add.step1Subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              label={t("documents.add.sourceLabel")}
              name="src"
              rules={[
                { required: true, message: t("documents.add.sourceRequired") },
              ]}
            >
              <Select
                showSearch
                size="large"
                placeholder={t("documents.add.sourcePlaceholder")}
                optionFilterProp="label"
                onChange={setSrc}
                options={languageOptions}
              />
            </Form.Item>
            <Form.Item
              label={t("documents.add.targetLabel")}
              name="tgt"
              rules={[
                { required: true, message: t("documents.add.targetRequired") },
              ]}
            >
              <Select
                showSearch
                size="large"
                placeholder={t("documents.add.targetPlaceholder")}
                optionFilterProp="label"
                onChange={setTgt}
                disabled={!src}
                options={getTgtOptions(src)}
              />
            </Form.Item>
          </div>
        </section>
      );
    }

    if (currentStep === 1) {
      return (
        <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50/50 to-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600/80">
                {t("documents.add.step2Eyebrow")}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {t("documents.add.step2Title")}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t("documents.add.useProjectProfileHint")}
              </p>
            </div>
            <Switch checked={inheritProfile} onChange={setInheritProfile} />
          </div>

          {!inheritProfile ? (
            <>
              <Form.Item label={t("documents.add.matchingTms")}>
                <Select
                  mode="multiple"
                  size="large"
                  loading={loadingAssets}
                  placeholder={t("documents.add.selectTms")}
                  notFoundContent={
                    filteredTms.length === 0
                      ? t("documents.add.noMatchingTms")
                      : undefined
                  }
                  optionFilterProp="label"
                  value={tmIds}
                  onChange={setTmIds}
                  options={filteredTms.map((tm) => ({
                    value: tm.id,
                    label: tm.name,
                  }))}
                />
              </Form.Item>
              <Form.Item label={t("documents.add.matchingGlossaries")}>
                <Select
                  mode="multiple"
                  size="large"
                  loading={loadingAssets}
                  placeholder={t("documents.add.selectGlossaries")}
                  notFoundContent={
                    filteredGlossaries.length === 0
                      ? t("documents.add.noMatchingGlossaries")
                      : undefined
                  }
                  optionFilterProp="label"
                  value={glossaryIds}
                  onChange={setGlossaryIds}
                  options={filteredGlossaries.map((glossary) => ({
                    value: glossary.id,
                    label: glossary.name,
                  }))}
                />
              </Form.Item>
            </>
          ) : null}

          <Form.Item label={t("documents.add.thresholdLabel", { value: Math.round(threshold * 100) })}>
            <div className="flex items-center gap-3">
              <Slider
                className="flex-1"
                min={0}
                max={1}
                step={0.01}
                value={threshold}
                onChange={setThreshold}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.01}
                value={threshold}
                onChange={(value) => setThreshold(value ?? 0)}
              />
            </div>
          </Form.Item>
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-dashed border-[#98C441]/40 bg-white p-5">
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7aa832]">
            {t("documents.add.step3Eyebrow")}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {t("documents.add.step3Title")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("documents.add.step3Subtitle")}
          </p>
        </div>
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">{t("documents.add.dropText")}</p>
          <p className="ant-upload-hint">{t("documents.add.dropHint")}</p>
        </Dragger>
      </section>
    );
  };

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
        {t("documents.add.trigger")}
      </Button>
      <Modal
        title={t("documents.add.modalTitle")}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          isLastStep ? (
            <div className="flex justify-start">
              <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
                {t("common.back")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button onClick={handleCancel}>{t("common.cancel")}</Button>
              <div className="flex gap-2">
                {currentStep > 0 ? (
                  <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
                    {t("common.back")}
                  </Button>
                ) : null}
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={goNext}
                  style={{ background: "#98C441", borderColor: "#98C441" }}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )
        }
        width={860}
        centered
        destroyOnHidden
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div className="relative overflow-hidden rounded-t-lg bg-slate-950 px-5 py-4 pr-12 text-white">
          <div className="absolute -right-10 -top-10 size-28 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="relative">
            <h2 className="mt-1 text-xl font-semibold">
              {t("documents.add.heading")}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {t("documents.add.headingSubtitle")}
            </p>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white px-6 py-4">
          <Steps
            current={currentStep}
            responsive
            items={WIZARD_STEPS.map(({ titleKey }) => ({ title: t(titleKey) }))}
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          className="max-h-[58vh] overflow-y-auto p-6"
        >
          {renderStepContent()}
        </Form>
      </Modal>
    </>
  );
};

export default DocumentAdd;
