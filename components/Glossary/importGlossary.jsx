"use client";

import { Button, Form, Input, Modal, Upload, message, Select } from "antd";
import locales from "@/lib/locales.json";
import {
  BookOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useCallback, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";

const { Dragger } = Upload;

const languageOptions = Object.keys(locales).map((code) => ({
  value: code,
  label: locales[code][0],
}));

const ALLOWED_IMPORT_EXTENSIONS = ["txt", "csv", "tsv", "tbx"];

const checkFile = (file) => {
  const fileName = file.name.trim().replace(/\s+/g, "");
  const fileExtension = fileName.split(".").pop().toLowerCase();
  return ALLOWED_IMPORT_EXTENSIONS.includes(fileExtension);
};

const getTargetOptions = (source) => {
  if (!source) return languageOptions;
  return languageOptions.filter((option) => option.value !== source);
};

const isUploadReady = ({ name, source, target }) =>
  Boolean(name?.trim() && source && target && source !== target);

const ImportGlossaryButton = ({ refetch }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resetFormState = useCallback(() => {
    form.resetFields();
  }, [form]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    resetFormState();
    setIsModalOpen(false);
  };

  const handleSourceChange = (value) => {
    if (form.getFieldValue("target") === value) {
      form.setFieldValue("target", undefined);
    }
  };

  const uploadProps = {
    multiple: false,
    name: "file",
    action: "/api/glossaries/import",
    accept: ".txt,.csv,.tsv,.tbx",
    data: () => ({
      glossary: 0,
      name: form.getFieldValue("name"),
      project: form.getFieldValue("project") ?? "",
      domain: form.getFieldValue("domain") ?? "",
      source: form.getFieldValue("source"),
      target: form.getFieldValue("target"),
    }),
    onChange: async (info) => {
      if (info.file.status === "done") {
        message.success(
          t("glossaries.import.uploadSuccess", { name: info.file.name }),
        );
        await refetch();
        setIsModalOpen(false);
        resetFormState();
      } else if (info.file.status === "error") {
        message.error(
          t("glossaries.import.uploadError", { name: info.file.name }),
        );
      }
    },
    beforeUpload: async (file) => {
      try {
        await form.validateFields(["name", "source", "target"]);
      } catch {
        message.error(t("glossaries.import.validateFields"));
        return Upload.LIST_IGNORE;
      }

      const { source, target } = form.getFieldsValue(["source", "target"]);
      if (source === target) {
        message.error(t("glossaries.import.sameLanguage"));
        return Upload.LIST_IGNORE;
      }

      const isLt = file.size / 1024 / 1024 < 100;
      if (!isLt) {
        message.error(t("glossaries.import.tooLarge"));
        return Upload.LIST_IGNORE;
      }

      if (!checkFile(file)) {
        message.error(t("glossaries.import.invalidType"));
        return Upload.LIST_IGNORE;
      }

      return true;
    },
  };

  return (
    <>
      <Button
        icon={<PlusOutlined />}
        type="primary"
        onClick={showModal}
        className="shadow-sm"
        style={{
          background: "linear-gradient(135deg, #111827 0%, #059669 100%)",
          border: 0,
        }}
      >
        {t("glossaries.import.button")}
      </Button>
      <Modal
        title={t("glossaries.import.title")}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={760}
        centered
        destroyOnHidden
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-4 text-white">
          <div className="absolute -right-10 -top-10 size-28 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="relative">
            <div className="text-lg font-semibold leading-tight">
              {t("glossaries.import.title")}
            </div>
            <div className="mt-1 text-sm text-slate-300">
              {t("glossaries.import.subtitle")}
            </div>
          </div>
        </div>
        <Form form={form} layout="vertical" className="p-4">
          <div className="space-y-3">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BookOutlined />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {t("glossaries.import.detailsTitle")}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t("glossaries.import.detailsSubtitle")}
                  </div>
                </div>
              </div>
              <Form.Item
                label={t("glossaries.import.nameLabel")}
                name="name"
                rules={[
                  {
                    required: true,
                    message: t("glossaries.import.nameRequired"),
                  },
                ]}
              >
                <Input placeholder={t("glossaries.import.namePlaceholder")} />
              </Form.Item>
              <Form.Item
                label={t("glossaries.import.domainLabel")}
                name="domain"
              >
                <Input placeholder={t("glossaries.import.domainPlaceholder")} />
              </Form.Item>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("glossaries.import.languagesEyebrow")}
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {t("glossaries.import.languagesTitle")}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Form.Item
                  label={t("glossaries.import.sourceLabel")}
                  name="source"
                  rules={[
                    {
                      required: true,
                      message: t("glossaries.import.sourceRequired"),
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder={t("glossaries.import.sourcePlaceholder")}
                    optionFilterProp="label"
                    options={languageOptions}
                    onChange={handleSourceChange}
                  />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const source = getFieldValue("source");

                    return (
                      <Form.Item
                        name="target"
                        label={t("glossaries.import.targetLabel")}
                        dependencies={["source"]}
                        rules={[
                          {
                            required: true,
                            message: t("glossaries.import.targetRequired"),
                          },
                          ({ getFieldValue: getDependencyValue }) => ({
                            validator(_, value) {
                              const sourceValue = getDependencyValue("source");
                              if (
                                !value ||
                                !sourceValue ||
                                value !== sourceValue
                              ) {
                                return Promise.resolve();
                              }

                              return Promise.reject(
                                new Error(t("glossaries.import.targetDiffers")),
                              );
                            },
                          }),
                        ]}
                      >
                        <Select
                          showSearch
                          placeholder={t("glossaries.import.targetPlaceholder")}
                          optionFilterProp="label"
                          options={getTargetOptions(source)}
                          disabled={!source}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </div>
            </section>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldsValue }) => {
                const ready = isUploadReady(
                  getFieldsValue(["name", "source", "target"]),
                );

                return (
                  <section
                    className={`rounded-xl border border-dashed bg-white p-4 shadow-sm transition-opacity ${
                      ready
                        ? "border-emerald-200 opacity-100"
                        : "border-slate-200 opacity-60"
                    }`}
                  >
                    {ready ? (
                      <Dragger key="glossary-upload-enabled" {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                          <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                          {t("glossaries.import.dropText")}
                        </p>
                        <p className="ant-upload-hint">
                          {t("glossaries.import.dropHint")}
                        </p>
                      </Dragger>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="ant-upload-drag-icon">
                          <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                          {t("glossaries.import.completeText")}
                        </p>
                        <p className="ant-upload-hint">
                          {t("glossaries.import.completeHint")}
                        </p>
                      </div>
                    )}
                  </section>
                );
              }}
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ImportGlossaryButton;
