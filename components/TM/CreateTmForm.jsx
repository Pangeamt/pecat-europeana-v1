"use client";
import { Button, Divider, Form, Input, Select, message } from "antd";
import locales from "@/lib/locales.json";
import { addTMRequest } from "@/services/tm.services";

const languages = locales;

const getLocaleCode = (locale) => {
  const language = Object.keys(languages).find(
    (key) => languages[key][0] === locale,
  );
  return language;
};

export default function CreateTmForm({ user, onBack, onCreated }) {
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
      messageApi.loading({ content: "Creating TM...", key: "add-tm" });
      await addTMRequest(data);
      await onCreated?.();
      form.resetFields();
      messageApi.success({ content: "TM created!", key: "add-tm" });
    } catch (error) {
      console.error("Failed:", error);
      messageApi.error({ content: "Error creating TM", key: "add-tm" });
    }
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        layout="horizontal"
        onFinish={onFinish}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please introduce a name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Project" name="project">
          <Input placeholder="Optional" />
        </Form.Item>
        <Form.Item label="Domain" name="domain">
          <Input />
        </Form.Item>
        <Form.Item
          label="Source"
          name="source"
          rules={[
            { required: true, message: "Please select a source language" },
          ]}
        >
          <Select showSearch>
            {Object.keys(languages).map((locale) => (
              <Select.Option key={locale} value={languages[locale][0]}>
                {languages[locale][0]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="target"
          label="Target"
          rules={[
            { required: true, message: "Please select a target language" },
          ]}
        >
          <Select showSearch>
            {Object.keys(languages).map((locale) => (
              <Select.Option key={locale} value={languages[locale][0]}>
                {languages[locale][0]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
