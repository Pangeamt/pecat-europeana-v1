"use client";
import { BookOutlined, GlobalOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, message } from "antd";
import locales from "@/lib/locales.json";
import { addGlossaryRequest } from "@/services/glossary.services";

const languages = locales;
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

export default function CreateGlossaryForm({ user, onBack, onCreated }) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values) => {
    try {
      const userEmail = user?.email || "";
      const data = {
        name: values.name,
        user: userEmail,
        project: values.project,
        domain: values.domain,
        source: getLocaleCode(values.source),
        target: getLocaleCode(values.target),
      };
      messageApi.loading({ content: "Creating glossary...", key: "add-glossary" });
      await addGlossaryRequest(data);
      await onCreated?.();
      form.resetFields();
      messageApi.success({ content: "Glossary created!", key: "add-glossary" });
    } catch (error) {
      console.error("Failed:", error);
      messageApi.error({ content: "Error creating glossary", key: "add-glossary" });
    }
  };

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BookOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Glossary details</div>
                <div className="text-xs text-slate-500">
                  Name, project and domain metadata.
                </div>
              </div>
            </div>
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Please introduce a name!" }]}
            >
              <Input placeholder="Glossary name" />
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
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <GlobalOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Languages</div>
                <div className="text-xs text-slate-500">
                  Select the source and target language pair.
                </div>
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

          <div className="flex justify-end gap-2">
            <Button onClick={onBack}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: "linear-gradient(135deg, #111827 0%, #059669 100%)",
                border: 0,
              }}
            >
              Create Glossary
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
