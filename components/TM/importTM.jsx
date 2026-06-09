"use client";

import { Button, Form, Input, Modal, Upload, message, Select } from "antd";
import locales from "@/lib/locales.json";
import {
  FileTextOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useCallback, useState } from "react";
import { tmStore } from "@/store";

const { Dragger } = Upload;

const languageOptions = Object.keys(locales).map((code) => ({
  value: code,
  label: locales[code][0],
}));

const checkFile = (file) => {
  const fileName = file.name.trim().replace(/\s+/g, "");
  const fileExtension = fileName.split(".").pop().toLowerCase();
  return fileExtension === "tmx";
};

const getTargetOptions = (source) => {
  if (!source) return languageOptions;
  return languageOptions.filter((option) => option.value !== source);
};

const isUploadReady = ({ name, source, target }) =>
  Boolean(name?.trim() && source && target && source !== target);

const ImportTmButton = ({ refetch }) => {
  const tmSt = tmStore();
  const { tm } = tmSt;
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
    multiple: true,
    name: "file",
    action: "/api/tm/import",
    accept: ".tmx",
    data: () => ({
      tm: tm?.id || 0,
      name: form.getFieldValue("name"),
      project: form.getFieldValue("project") ?? "",
      domain: form.getFieldValue("domain") ?? "",
      source: form.getFieldValue("source"),
      target: form.getFieldValue("target"),
    }),
    onChange: async (info) => {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        await refetch();
        setIsModalOpen(false);
        resetFormState();
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    beforeUpload: async (file) => {
      try {
        await form.validateFields(["name", "source", "target"]);
      } catch {
        message.error("Complete name, source and target before uploading.");
        return Upload.LIST_IGNORE;
      }

      const { source, target } = form.getFieldsValue(["source", "target"]);
      if (source === target) {
        message.error("Source and target must be different.");
        return Upload.LIST_IGNORE;
      }

      const isLt = file.size / 1024 / 1024 < 15;
      if (!isLt) {
        message.error("Files must smaller than 15MB");
        return Upload.LIST_IGNORE;
      }

      if (!checkFile(file)) {
        message.error("File type not supported");
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
          background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
          border: 0,
        }}
      >
        Import TM
      </Button>
      <Modal
        title="Import TM"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={760}
        centered
        destroyOnHidden
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-4 text-white">
          <div className="absolute -right-10 -top-10 size-28 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="relative">
            <div className="text-lg font-semibold leading-tight">
              Import translation memory
            </div>
            <div className="mt-1 text-sm text-slate-300">
              Define metadata and upload a TMX file.
            </div>
          </div>
        </div>
        <Form
          form={form}
          layout="vertical"
          className="p-4"
        >
          <div className="space-y-3">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileTextOutlined />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    Memory details
                  </div>
                  <div className="text-xs text-slate-500">
                    Name, context and optional metadata.
                  </div>
                </div>
              </div>
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  { required: true, message: "Please introduce a name!" },
                ]}
              >
                <Input placeholder="Memory name" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-2">
                <Form.Item label="Document" name="project">
                  <Input placeholder="Optional" />
                </Form.Item>
                <Form.Item label="Domain" name="domain">
                  <Input placeholder="Optional" />
                </Form.Item>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Languages
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  Source and target
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Form.Item
                  label="Source"
                  name="source"
                  rules={[
                    {
                      required: true,
                      message: "Please select a source language",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Select source"
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
                        label="Target"
                        dependencies={["source"]}
                        rules={[
                          {
                            required: true,
                            message: "Please select a target language",
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
                                new Error("Target must differ from source"),
                              );
                            },
                          }),
                        ]}
                      >
                        <Select
                          showSearch
                          placeholder="Select target"
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
                const ready = isUploadReady(getFieldsValue([
                  "name",
                  "source",
                  "target",
                ]));

                return (
                  <section
                    className={`rounded-xl border border-dashed bg-white p-4 shadow-sm transition-opacity ${
                      ready
                        ? "border-blue-200 opacity-100"
                        : "border-slate-200 opacity-60"
                    }`}
                  >
                    {ready ? (
                      <Dragger key="tm-upload-enabled" {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                          <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Drop TMX file or browse
                        </p>
                        <p className="ant-upload-hint">
                          TMX only. Maximum file size 15MB.
                        </p>
                      </Dragger>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="ant-upload-drag-icon">
                          <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Complete required fields to upload
                        </p>
                        <p className="ant-upload-hint">
                          Name, source and target are required (and must differ).
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

export default ImportTmButton;
