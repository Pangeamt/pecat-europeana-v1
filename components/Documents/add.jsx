"use client";

import {
  Alert,
  Button,
  Form,
  Modal,
  Select,
  Steps,
  Tooltip,
  Upload,
  message,
} from "antd";
import { useMemo, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import locales from "@/lib/locales.json";
import { checkFile } from "@/lib/utils";
import { fetchProfileByIdRequest } from "@/services/profiles.services";
import { ArrowLeft, ArrowRight, Plus, Upload as UploadIcon } from "lucide-react";

const { Dragger } = Upload;

const languageOptions = Object.keys(locales).map((code) => ({
  value: code,
  label: locales[code][0],
}));

// Documents are always translated with the project's profile. Step 2 lets
// the user narrow which of the profile's TMs/glossaries apply to this
// document (all of them by default); nothing outside the profile.
const WIZARD_STEPS = [
  { key: "languages", titleKey: "documents.add.steps.principal" },
  { key: "resources", titleKey: "documents.add.steps.tms" },
  { key: "file", titleKey: "documents.add.steps.file" },
];

// Primary language subtag ("en-US" -> "en"), the granularity DAAIT uses to
// match a resource to the document's pair.
const primaryTag = (code) =>
  String(code ?? "")
    .toLowerCase()
    .split(/[-_]/)[0];

const matchesPair = (asset, src, tgt) =>
  primaryTag(asset.sourceLanguage) === primaryTag(src) &&
  primaryTag(asset.targetLanguage) === primaryTag(tgt);

const DocumentAdd = ({ project, refetch }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [src, setSrc] = useState(null);
  const [tgt, setTgt] = useState(null);
  // Without a profile the project cannot receive documents (the API answers
  // 409 PROFILE_REQUIRED): the upload stays disabled until one is assigned.
  const hasProfile = Boolean(project?.profileId);
  const [profileAssets, setProfileAssets] = useState({ tms: [], glossaries: [] });
  const [loadingAssets, setLoadingAssets] = useState(false);
  // null = untouched = every matching resource (the default); an array once
  // the user edits the selection.
  const [tmSelection, setTmSelection] = useState(null);
  const [glossarySelection, setGlossarySelection] = useState(null);

  // Only the profile's resources for the chosen pair are offered.
  const matchingTms = useMemo(
    () => (src && tgt ? profileAssets.tms.filter((tm) => matchesPair(tm, src, tgt)) : []),
    [profileAssets.tms, src, tgt],
  );
  const matchingGlossaries = useMemo(
    () =>
      src && tgt
        ? profileAssets.glossaries.filter((glossary) => matchesPair(glossary, src, tgt))
        : [],
    [profileAssets.glossaries, src, tgt],
  );
  const tmIds = tmSelection ?? matchingTms.map((tm) => tm.id);
  const glossaryIds =
    glossarySelection ?? matchingGlossaries.map((glossary) => glossary.id);

  const resetWizard = () => {
    form.resetFields();
    setCurrentStep(0);
    setSrc(null);
    setTgt(null);
    setTmSelection(null);
    setGlossarySelection(null);
  };

  const showModal = () => {
    setIsModalOpen(true);
    setLoadingAssets(true);
    fetchProfileByIdRequest(project.profileId)
      .then((response) =>
        setProfileAssets({
          tms: response?.profile?.tms ?? [],
          glossaries: response?.profile?.glossaries ?? [],
        }),
      )
      .catch((error) => {
        console.error(error);
        setProfileAssets({ tms: [], glossaries: [] });
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
      // A (new) pair resets the selection to its default: all of them.
      setTmSelection(null);
      setGlossarySelection(null);
    }
    if (currentStep === 1) {
      // An empty list means "all of them" to DAAIT, so leaving none selected
      // would silently apply everything: keep at least one.
      if (
        (matchingTms.length > 0 && tmIds.length === 0) ||
        (matchingGlossaries.length > 0 && glossaryIds.length === 0)
      ) {
        message.warning(t("documents.add.selectAtLeastOne"));
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
      tm_ids: JSON.stringify(tmIds),
      glossary_ids: JSON.stringify(glossaryIds),
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
        // Show the API reason when there is one (e.g. the profile does not
        // match the language pair or no longer exists in DAAIT).
        message.error(
          info.file.response?.message ||
            t("documents.add.uploadError", { name: info.file.name }),
        );
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
          <Alert
            className="mb-4"
            type="info"
            showIcon
            message={t("documents.add.profileInfo", {
              name: project?.profileName ?? "—",
            })}
          />
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
          <div className="mb-4">
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
          <Form.Item label={t("documents.add.matchingTms")}>
            <Select
              mode="multiple"
              size="large"
              loading={loadingAssets}
              placeholder={t("documents.add.selectTms")}
              notFoundContent={t("documents.add.noMatchingTms")}
              optionFilterProp="label"
              value={tmIds}
              onChange={setTmSelection}
              options={matchingTms.map((tm) => ({ value: tm.id, label: tm.name }))}
            />
          </Form.Item>
          <Form.Item label={t("documents.add.matchingGlossaries")}>
            <Select
              mode="multiple"
              size="large"
              loading={loadingAssets}
              placeholder={t("documents.add.selectGlossaries")}
              notFoundContent={t("documents.add.noMatchingGlossaries")}
              optionFilterProp="label"
              value={glossaryIds}
              onChange={setGlossarySelection}
              options={matchingGlossaries.map((glossary) => ({
                value: glossary.id,
                label: glossary.name,
              }))}
            />
          </Form.Item>
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-dashed border-primary/40 bg-white p-5">
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
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
            <UploadIcon size={15} />
          </p>
          <p className="ant-upload-text">{t("documents.add.dropText")}</p>
          <p className="ant-upload-hint">{t("documents.add.dropHint")}</p>
        </Dragger>
      </section>
    );
  };

  return (
    <>
      <Tooltip title={hasProfile ? undefined : t("documents.add.profileRequired")}>
        <Button
          icon={<Plus size={15} />}
          type="primary"
          onClick={showModal}
          disabled={!hasProfile}
          className="shadow-sm"
          style={
            hasProfile
              ? { background: "var(--brand-gradient)", border: 0 }
              : undefined
          }
        >
          {t("documents.add.trigger")}
        </Button>
      </Tooltip>
      <Modal
        title={t("documents.add.modalTitle")}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          isLastStep ? (
            <div className="flex justify-start">
              <Button icon={<ArrowLeft size={15} />} onClick={goBack}>
                {t("common.back")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button onClick={handleCancel}>{t("common.cancel")}</Button>
              <div className="flex gap-2">
                {currentStep > 0 ? (
                  <Button icon={<ArrowLeft size={15} />} onClick={goBack}>
                    {t("common.back")}
                  </Button>
                ) : null}
                <Button
                  type="primary"
                  icon={<ArrowRight size={15} />}
                  onClick={goNext}
                  style={{ background: "var(--color-primary)", borderColor: "var(--color-primary)" }}
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
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-primary-900 to-primary-700 px-5 py-4 pr-12 text-white">
          <div className="absolute -right-10 -top-10 size-28 rounded-full bg-primary/25 blur-3xl" />
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
