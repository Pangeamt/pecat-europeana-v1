"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Form,
  Modal,
  Radio,
  Select,
  Slider,
  Steps,
  Switch,
  Tag,
  Upload,
  message,
} from "antd";
import { BookMarked, Database, FileUp, Languages } from "lucide-react";
import { useMemo, useState } from "react";

import locales from "@/lib/locales.json";
import { useTranslation } from "@/components/i18n/LanguageProvider";
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
  {
    key: "principal",
    titleKey: "documents.add.steps.principal",
    descKey: "documents.add.steps.principalDesc",
    icon: Languages,
  },
  {
    key: "tms",
    titleKey: "documents.add.steps.tms",
    descKey: "documents.add.steps.tmsDesc",
    icon: Database,
  },
  {
    key: "glossaries",
    titleKey: "documents.add.steps.glossaries",
    descKey: "documents.add.steps.glossariesDesc",
    icon: BookMarked,
  },
  {
    key: "file",
    titleKey: "documents.add.steps.file",
    descKey: "documents.add.steps.fileDesc",
    icon: FileUp,
  },
];

const getLanguageLabel = (code) =>
  languageOptions.find((option) => option.value === code)?.label ?? code;

const ProjectAdd = ({ add, refetch }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mt] = useState(true);
  const [tmMode, setTmMode] = useState("standard");
  const [tmThreshold, setTmThreshold] = useState(0.75);
  const [tmIds, setTmIds] = useState([]);
  const [updateTmIds, setUpdateTmIds] = useState([]);
  const [glossaryIds, setGlossaryIds] = useState([]);
  const [tms, setTms] = useState([]);
  const [glossaries, setGlossaries] = useState([]);
  const [src, setSrc] = useState(null);
  const [tgt, setTgt] = useState(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
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

  const selectedTmNames = useMemo(
    () =>
      filteredTms.filter((tm) => tmIds.includes(tm.id)).map((tm) => tm.name),
    [filteredTms, tmIds],
  );

  const selectedGlossaryNames = useMemo(
    () =>
      filteredGlossaries
        .filter((glossary) => glossaryIds.includes(glossary.id))
        .map((glossary) => glossary.name),
    [filteredGlossaries, glossaryIds],
  );

  const resetWizard = () => {
    form.resetFields();
    setCurrentStep(0);
    setSrc(null);
    setTgt(null);
    setTmIds([]);
    setUpdateTmIds([]);
    setGlossaryIds([]);
    setTmMode("standard");
    setTmThreshold(0.75);
  };

  const showModal = () => {
    setIsModalOpen(true);

    if (!user) return;
    const query =
      user.role === "SUPER"
        ? { size: 1000 }
        : user.workspaceId
          ? { workspaceId: user.workspaceId, size: 1000 }
          : null;
    if (!query) return;

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

  const syncTmSelection = (nextSrc, nextTgt) => {
    const srcPfx = nextSrc?.substring(0, 2);
    const tgtPfx = nextTgt?.substring(0, 2);
    const validTmIds = new Set(
      tms.reduce((ids, tm) => {
        const tmSource = tm.sourceLanguage ?? tm.context?.source;
        const tmTarget = tm.targetLanguage ?? tm.context?.target;
        if (
          nextSrc &&
          nextTgt &&
          tmSource?.substring(0, 2) === srcPfx &&
          tmTarget?.substring(0, 2) === tgtPfx
        ) {
          ids.push(tm.id);
        }
        return ids;
      }, []),
    );
    const nextTmIds = tmIds.filter((id) => validTmIds.has(id));
    setTmIds(nextTmIds);
    setUpdateTmIds((prev) => prev.filter((id) => validTmIds.has(id)));
    form.setFieldsValue({ tm_ids: nextTmIds });
  };

  const handleTmIdsChange = (nextTmIds) => {
    setTmIds(nextTmIds);
    const selected = new Set(nextTmIds);
    setUpdateTmIds((prev) => prev.filter((id) => selected.has(id)));
  };

  const toggleUpdateTm = (tmId, shouldUpdate) => {
    setUpdateTmIds((prev) => {
      if (shouldUpdate) {
        return prev.includes(tmId) ? prev : [...prev, tmId];
      }
      return prev.filter((id) => id !== tmId);
    });
  };

  const syncGlossarySelection = (nextSrc, nextTgt) => {
    const srcPfx = nextSrc?.substring(0, 2);
    const tgtPfx = nextTgt?.substring(0, 2);
    const validGlossaryIds = new Set(
      glossaries.reduce((ids, glossary) => {
        if (
          nextSrc &&
          nextTgt &&
          glossary.context?.source?.substring(0, 2) === srcPfx &&
          glossary.context?.target?.substring(0, 2) === tgtPfx
        ) {
          ids.push(glossary.id);
        }
        return ids;
      }, []),
    );
    const nextGlossaryIds = glossaryIds.filter((id) =>
      validGlossaryIds.has(id),
    );
    setGlossaryIds(nextGlossaryIds);
    form.setFieldsValue({ glossary_ids: nextGlossaryIds });
  };

  const onChangeSrc = (value) => {
    setSrc(value);
    syncTmSelection(value, tgt);
    syncGlossarySelection(value, tgt);
  };

  const onChangeTgt = (value) => {
    setTgt(value);
    syncTmSelection(src, value);
    syncGlossarySelection(src, value);
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

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const uploadProps = {
    multiple: true,
    name: "file",
    action: "/api/projects",
    showUploadList: true,
    headers: {
      authorization: "authorization-text",
    },
    data: () => ({
      mt,
      src,
      tgt,
      tm_mode: tmMode,
      tm_threshold: tmThreshold,
      tm_ids: JSON.stringify(tmIds),
      tm_update_ids: JSON.stringify(updateTmIds),
      glossary_ids: JSON.stringify(glossaryIds),
    }),
    onChange(info) {
      if (info.file.status === "done") {
        message.success(
          t("documents.add.uploadSuccess", { name: info.file.name }),
        );
        refetch();
        setIsModalOpen(false);
        resetWizard();
      } else if (info.file.status === "error") {
        message.error(
          t("documents.add.uploadError", { name: info.file.name }),
        );
      }
    },
    beforeUpload: (file) => {
      const isLt = file.size / 1024 / 1024 < 500;
      if (!isLt) {
        message.error(t("documents.add.tooLarge"));
        return false;
      }
      const extension = checkFile(file);
      if (!extension) {
        message.error(t("documents.add.invalidType"));
        return false;
      }
      return true;
    },
    disabled: !src || !tgt,
  };

  const getTgtOptions = (source) => {
    if (source) {
      return languageOptions.filter((option) => option.value !== source);
    }
    return [];
  };

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
                {
                  required: true,
                  message: t("documents.add.sourceRequired"),
                },
              ]}
            >
              <Select
                showSearch
                size="large"
                placeholder={t("documents.add.sourcePlaceholder")}
                optionFilterProp="label"
                onChange={onChangeSrc}
                options={languageOptions}
              />
            </Form.Item>
            <Form.Item
              label={t("documents.add.targetLabel")}
              name="tgt"
              rules={[
                {
                  required: true,
                  message: t("documents.add.targetRequired"),
                },
              ]}
            >
              <Select
                showSearch
                size="large"
                placeholder={t("documents.add.targetPlaceholder")}
                optionFilterProp="label"
                onChange={onChangeTgt}
                disabled={!src}
                options={getTgtOptions(src)}
              />
            </Form.Item>
          </div>
          {src && tgt ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Tag color="geekblue" className="rounded-full px-3 py-0.5">
                {getLanguageLabel(src)}
              </Tag>
              <span className="text-slate-300">→</span>
              <Tag color="cyan" className="rounded-full px-3 py-0.5">
                {getLanguageLabel(tgt)}
              </Tag>
            </div>
          ) : null}
        </section>
      );
    }

    if (currentStep === 1) {
      return (
        <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-50/50 to-white p-5">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600/80">
              {t("documents.add.step2Eyebrow")}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {t("documents.add.step2Title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("documents.add.step2Subtitle")}
            </p>
          </div>
          <Form.Item
            name="tm_ids"
            label={t("documents.add.matchingTms")}
            initialValue={tmIds}
          >
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
              onChange={handleTmIdsChange}
              options={filteredTms.map((tm) => ({
                value: tm.id,
                label: tm.name,
              }))}
            />
          </Form.Item>
          {tmIds.length > 0 ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white/70 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("documents.add.updateOnReview")}
              </div>
              <p className="mb-3 text-xs text-slate-500">
                {t("documents.add.updateOnReviewHint")}
              </p>
              <div className="flex flex-col gap-2">
                {filteredTms
                  .filter((tm) => tmIds.includes(tm.id))
                  .map((tm) => (
                    <div
                      key={tm.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
                    >
                      <span className="truncate text-sm font-medium text-slate-700">
                        {tm.name}
                      </span>
                      <Switch
                        size="small"
                        checked={updateTmIds.includes(tm.id)}
                        onChange={(checked) => toggleUpdateTm(tm.id, checked)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
          {filteredTms.length === 0 ? (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message={t("documents.add.noCompatibleTms")}
              description={t("documents.add.noCompatibleTmsDesc")}
            />
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              name="tm_mode"
              label={t("documents.add.modeLabel")}
              initialValue={tmMode}
            >
              <Radio.Group
                buttonStyle="solid"
                optionType="button"
                onChange={(event) => setTmMode(event.target.value)}
              >
                <Radio.Button value="standard">
                  {t("documents.add.modeStandard")}
                </Radio.Button>
                <Radio.Button value="smart">
                  {t("documents.add.modeSmart")}
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="tm_threshold"
              label={t("documents.add.thresholdLabel", {
                value: Math.round(tmThreshold * 100),
              })}
              initialValue={tmThreshold}
            >
              <Slider
                min={0}
                max={1}
                step={0.01}
                marks={{ 0: "0%", 0.75: "75%", 1: "100%" }}
                onChange={(value) => setTmThreshold(value ?? 0)}
                value={tmThreshold}
              />
            </Form.Item>
          </div>
        </section>
      );
    }

    if (currentStep === 2) {
      return (
        <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-5">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600/80">
              {t("documents.add.step3Eyebrow")}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {t("documents.add.step3Title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("documents.add.step3Subtitle")}
            </p>
          </div>
          <Form.Item
            name="glossary_ids"
            label={t("documents.add.matchingGlossaries")}
            initialValue={glossaryIds}
          >
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
              onChange={setGlossaryIds}
              options={filteredGlossaries.map((glossary) => ({
                value: glossary.id,
                label: glossary.name,
              }))}
            />
          </Form.Item>
          {filteredGlossaries.length === 0 ? (
            <Alert
              type="info"
              showIcon
              message={t("documents.add.noCompatibleGlossaries")}
              description={t("documents.add.noCompatibleGlossariesDesc")}
            />
          ) : null}
        </section>
      );
    }

    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("documents.add.summaryTitle")}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500">
                {t("documents.add.summaryLanguagePair")}
              </div>
              <div className="mt-1 font-medium text-slate-900">
                {getLanguageLabel(src)} → {getLanguageLabel(tgt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">
                {t("documents.add.summaryTmMode")}
              </div>
              <div className="mt-1 font-medium capitalize text-slate-900">
                {tmMode} · {Math.round(tmThreshold * 100)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">
                {t("documents.add.summaryTms")}
              </div>
              <div className="mt-1 font-medium text-slate-900">
                {selectedTmNames.length > 0
                  ? selectedTmNames.join(", ")
                  : t("documents.add.noneSelected")}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">
                {t("documents.add.summaryGlossaries")}
              </div>
              <div className="mt-1 font-medium text-slate-900">
                {selectedGlossaryNames.length > 0
                  ? selectedGlossaryNames.join(", ")
                  : t("documents.add.noneSelected")}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-[#98C441]/40 bg-white p-5">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7aa832]">
              {t("documents.add.step4Eyebrow")}
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {t("documents.add.step4Title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("documents.add.step4Subtitle")}
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
      </div>
    );
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
                  style={{
                    background: "#98C441",
                    borderColor: "#98C441",
                  }}
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
        <div className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-4 pr-12 text-white">
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
            items={WIZARD_STEPS.map(({ titleKey, descKey }) => ({
              title: t(titleKey),
              description: t(descKey),
            }))}
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

export default ProjectAdd;
