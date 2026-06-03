"use client";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
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
  Tag,
  Upload,
  message,
} from "antd";
import {
  BookMarked,
  Database,
  FileUp,
  Languages,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  {
    key: "principal",
    title: "Principal",
    description: "Languages",
    icon: Languages,
  },
  {
    key: "tms",
    title: "TMs",
    description: "Memories",
    icon: Database,
  },
  {
    key: "glossaries",
    title: "Glossaries",
    description: "Terms",
    icon: BookMarked,
  },
  {
    key: "file",
    title: "File",
    description: "Upload",
    icon: FileUp,
  },
];

const getLanguageLabel = (code) =>
  languageOptions.find((option) => option.value === code)?.label ?? code;

const ProjectAdd = ({ add, refetch }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mt] = useState(true);
  const [tmMode, setTmMode] = useState("standard");
  const [tmThreshold, setTmThreshold] = useState(0.75);
  const [tmIds, setTmIds] = useState([]);
  const [glossaryIds, setGlossaryIds] = useState([]);
  const [tms, setTms] = useState([]);
  const [glossaries, setGlossaries] = useState([]);
  const [src, setSrc] = useState(null);
  const [tgt, setTgt] = useState(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const { user } = userStore();

  const filteredTms = useMemo(() => {
    if (!src || !tgt) return [];

    return tms.filter((tm) => {
      const tmSource = tm.sourceLanguage ?? tm.context?.source;
      const tmTarget = tm.targetLanguage ?? tm.context?.target;
      return tmSource === src && tmTarget === tgt;
    });
  }, [src, tgt, tms]);

  const filteredGlossaries = useMemo(() => {
    if (!src || !tgt) return [];

    return glossaries.filter((glossary) => {
      const glossarySource = glossary.context?.source;
      const glossaryTarget = glossary.context?.target;
      return glossarySource === src && glossaryTarget === tgt;
    });
  }, [src, tgt, glossaries]);

  const selectedTmNames = useMemo(
    () =>
      filteredTms
        .filter((tm) => tmIds.includes(tm.id))
        .map((tm) => tm.name),
    [filteredTms, tmIds],
  );

  const selectedGlossaryNames = useMemo(
    () =>
      filteredGlossaries
        .filter((glossary) => glossaryIds.includes(glossary.id))
        .map((glossary) => glossary.name),
    [filteredGlossaries, glossaryIds],
  );

  useEffect(() => {
    if (!isModalOpen || !user) return;

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
  }, [isModalOpen, user]);

  const resetWizard = () => {
    form.resetFields();
    setCurrentStep(0);
    setSrc(null);
    setTgt(null);
    setTmIds([]);
    setGlossaryIds([]);
    setTmMode("standard");
    setTmThreshold(0.75);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    resetWizard();
  };

  const syncTmSelection = (nextSrc, nextTgt) => {
    const validTmIds = new Set(
      tms.reduce((ids, tm) => {
        const tmSource = tm.sourceLanguage ?? tm.context?.source;
        const tmTarget = tm.targetLanguage ?? tm.context?.target;
        if (nextSrc && nextTgt && tmSource === nextSrc && tmTarget === nextTgt) {
          ids.push(tm.id);
        }
        return ids;
      }, []),
    );
    const nextTmIds = tmIds.filter((id) => validTmIds.has(id));
    setTmIds(nextTmIds);
    form.setFieldsValue({ tm_ids: nextTmIds });
  };

  const syncGlossarySelection = (nextSrc, nextTgt) => {
    const validGlossaryIds = new Set(
      glossaries.reduce((ids, glossary) => {
        if (
          nextSrc &&
          nextTgt &&
          glossary.context?.source === nextSrc &&
          glossary.context?.target === nextTgt
        ) {
          ids.push(glossary.id);
        }
        return ids;
      }, []),
    );
    const nextGlossaryIds = glossaryIds.filter((id) => validGlossaryIds.has(id));
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
      glossary_ids: JSON.stringify(glossaryIds),
    }),
    onChange(info) {
      if (info.file.status === "done") {
        message.success(`${info.file.name} uploaded successfully`);
        refetch();
        setIsModalOpen(false);
        resetWizard();
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} upload failed.`);
      }
    },
    beforeUpload: (file) => {
      const isLt = file.size / 1024 / 1024 < 500;
      if (!isLt) {
        message.error("Files must be smaller than 500MB");
        return false;
      }
      const extension = checkFile(file);
      if (!extension) {
        message.error("File type not supported");
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
              Step 1
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Language pair
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose the source and target languages for this project.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              label="Source language"
              name="src"
              rules={[
                {
                  required: true,
                  message: "Please select a source language",
                },
              ]}
            >
              <Select
                showSearch
                size="large"
                placeholder="Select source"
                optionFilterProp="label"
                onChange={onChangeSrc}
                options={languageOptions}
              />
            </Form.Item>
            <Form.Item
              label="Target language"
              name="tgt"
              rules={[
                {
                  required: true,
                  message: "Please select a target language",
                },
              ]}
            >
              <Select
                showSearch
                size="large"
                placeholder="Select target"
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
              Step 2
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Translation memories
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Select matching TMs and configure matching mode and threshold.
            </p>
          </div>
          <Form.Item name="tm_ids" label="Matching TMs" initialValue={tmIds}>
            <Select
              mode="multiple"
              size="large"
              loading={loadingAssets}
              placeholder="Select translation memories"
              notFoundContent={
                filteredTms.length === 0
                  ? "No matching memories for this language pair"
                  : undefined
              }
              optionFilterProp="label"
              onChange={setTmIds}
              options={filteredTms.map((tm) => ({
                value: tm.id,
                label: tm.name,
              }))}
            />
          </Form.Item>
          {filteredTms.length === 0 ? (
            <Alert
              type="info"
              showIcon
              className="mb-4"
              message="No compatible memories found"
              description="You can continue without TMs or create one from the TMs page."
            />
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item name="tm_mode" label="Mode" initialValue={tmMode}>
              <Radio.Group
                buttonStyle="solid"
                optionType="button"
                onChange={(event) => setTmMode(event.target.value)}
              >
                <Radio.Button value="standard">Standard</Radio.Button>
                <Radio.Button value="smart">Smart</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="tm_threshold"
              label={`Threshold: ${Math.round(tmThreshold * 100)}%`}
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
              Step 3
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Glossaries
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Attach glossaries compatible with the selected language pair.
            </p>
          </div>
          <Form.Item
            name="glossary_ids"
            label="Matching glossaries"
            initialValue={glossaryIds}
          >
            <Select
              mode="multiple"
              size="large"
              loading={loadingAssets}
              placeholder="Select glossaries"
              notFoundContent={
                filteredGlossaries.length === 0
                  ? "No matching glossaries for this language pair"
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
              message="No compatible glossaries found"
              description="You can continue without glossaries or create one from the Glossaries page."
            />
          ) : null}
        </section>
      );
    }

    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Configuration summary
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500">Language pair</div>
              <div className="mt-1 font-medium text-slate-900">
                {getLanguageLabel(src)} → {getLanguageLabel(tgt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">TM mode / threshold</div>
              <div className="mt-1 font-medium capitalize text-slate-900">
                {tmMode} · {Math.round(tmThreshold * 100)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Translation memories</div>
              <div className="mt-1 font-medium text-slate-900">
                {selectedTmNames.length > 0
                  ? selectedTmNames.join(", ")
                  : "None selected"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Glossaries</div>
              <div className="mt-1 font-medium text-slate-900">
                {selectedGlossaryNames.length > 0
                  ? selectedGlossaryNames.join(", ")
                  : "None selected"}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-[#98C441]/40 bg-white p-5">
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7aa832]">
              Step 4
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Upload file
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Drop your source file here or browse. Max 500MB.
            </p>
          </div>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Drop file or click to browse</p>
            <p className="ant-upload-hint">
              Supported formats depend on your workspace configuration.
            </p>
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
        Add Project
      </Button>
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          isLastStep ? (
            <div className="flex justify-start">
              <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
                Back
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button onClick={handleCancel}>Cancel</Button>
              <div className="flex gap-2">
                {currentStep > 0 ? (
                  <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
                    Back
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
                  Next
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
        <div className="relative overflow-hidden bg-slate-950 px-6 py-5 text-white">
          <div className="absolute -right-8 -top-8 size-28 rounded-full bg-[#98C441]/20 blur-3xl" />
          <div className="relative">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98C441]">
              New project
            </div>
            <h2 className="mt-1 text-xl font-semibold">Create project</h2>
            <p className="mt-1 text-sm text-slate-300">
              Configure languages, assets and upload in four guided steps.
            </p>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white px-6 py-4">
          <Steps
            current={currentStep}
            responsive
            items={WIZARD_STEPS.map(({ title, description }) => ({
              title,
              description,
            }))}
          />
        </div>

        <Form form={form} layout="vertical" className="max-h-[58vh] overflow-y-auto p-6">
          {renderStepContent()}
        </Form>
      </Modal>
    </>
  );
};

export default ProjectAdd;
