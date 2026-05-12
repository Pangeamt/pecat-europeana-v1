"use client";
import {
  Button,
  Form,
  Input,
  Modal,
  Upload,
  message,
  Select,
} from "antd";
import locales from "@/lib/locales.json";
import { FileTextOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { tmStore } from "@/store";

const languages = locales;
const { Dragger } = Upload;

const languageOptions = Object.keys(languages).map((code) => ({
  value: languages[code][0],
  label: languages[code][0],
}));

const getLocaleCode = (locale) => {
  const language = Object.keys(languages).find(
    (key) => languages[key][0] === locale,
  );
  return language;
};

const checkFile = (file) => {
  const fileName = file.name.trim().replace(/\s+/g, "");
  const fileExtension = fileName.split(".").pop().toLowerCase();

  if (fileExtension === "tmx") return true;
  return false;
};

const ImportTmButton = ({ refetch, user }) => {
  const tmSt = tmStore();
  const { tm } = tmSt;
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const requiredValues = Form.useWatch(["name", "source", "target"], form);
  const isUploadEnabled = Boolean(
    requiredValues?.[0] && requiredValues?.[1] && requiredValues?.[2],
  );

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const handleOk = async () => {
    try {
      form.resetFields();
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
      setAdding(false);
    }
  };

  const props = {
    multiple: true,
    name: "file",
    action: "/api/tm/import",
    headers: {
      authorization: "authorization-text",
    },
    data: (file) => ({
      tm: tm?.id || 0,
      name: form.getFieldValue("name"),
      project: form.getFieldValue("project") ?? "",
      domain: form.getFieldValue("domain") ?? "",
      source: getLocaleCode(form.getFieldValue("source")),
      target: getLocaleCode(form.getFieldValue("target")),
    }),
    onChange: async (info) => {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        await refetch();
        setIsModalOpen(false);
        form.resetFields();
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    beforeUpload: async (file) => {
      try {
        await form.validateFields(["name", "source", "target"]);
      } catch {
        return false;
      }

      const isLt = file.size / 1024 / 1024 < 15;
      if (!isLt) {
        message.error("Files must smaller than 15MB");
        return false;
      }

      if (!checkFile(file)) {
        message.error("File type not supported");
        return false;
      }
      return true;
    },
    disabled: !isUploadEnabled,
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
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={adding}
        footer={null}
        width={760}
        centered
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-4 text-white">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/25 blur-3xl" />
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileTextOutlined />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Memory details</div>
                  <div className="text-xs text-slate-500">
                    Name, context and optional metadata.
                  </div>
                </div>
              </div>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Please introduce a name!" }]}
              >
                <Input placeholder="Memory name" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-2">
                <Form.Item label="Project" name="project">
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
                    { required: true, message: "Please select a source language" },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Select source"
                    optionFilterProp="label"
                    options={languageOptions}
                  />
                </Form.Item>
                <Form.Item
                  name="target"
                  label="Target"
                  rules={[
                    { required: true, message: "Please select a target language" },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Select target"
                    optionFilterProp="label"
                    options={languageOptions}
                  />
                </Form.Item>
              </div>
            </section>

            <section
              className={`rounded-xl border border-dashed bg-white p-4 shadow-sm ${
                isUploadEnabled ? "border-blue-200" : "border-slate-200 opacity-60"
              }`}
            >
              <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">
                  {isUploadEnabled
                    ? "Drop TMX file or browse"
                    : "Complete required fields to upload"}
                </p>
                <p className="ant-upload-hint">
                  {isUploadEnabled
                    ? "TMX only. Maximum file size 15MB."
                    : "Name, source and target are required."}
                </p>
              </Dragger>
            </section>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ImportTmButton;
