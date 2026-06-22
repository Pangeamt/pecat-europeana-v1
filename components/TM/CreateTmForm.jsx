"use client";
import { FileTextOutlined, GlobalOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, message } from "antd";
import locales from "@/lib/locales.json";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { addTMRequest } from "@/services/tm.services";

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

export default function CreateTmForm({ user, onBack, onCreated }) {
  const { t } = useTranslation();
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
      messageApi.loading({
        content: t("tms.create.creating"),
        key: "add-tm",
      });
      await addTMRequest(data);
      await onCreated?.();
      form.resetFields();
      messageApi.success({ content: t("tms.create.created"), key: "add-tm" });
    } catch (error) {
      console.error("Failed:", error);
      messageApi.error({
        content: t("tms.create.createError"),
        key: "add-tm",
      });
    }
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileTextOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("tms.create.detailsTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("tms.create.detailsSubtitle")}
                </div>
              </div>
            </div>
            <Form.Item
              label={t("tms.create.nameLabel")}
              name="name"
              rules={[
                { required: true, message: t("tms.create.nameRequired") },
              ]}
            >
              <Input placeholder={t("tms.create.namePlaceholder")} />
            </Form.Item>
            <Form.Item label={t("tms.create.domainLabel")} name="domain">
              <Input placeholder={t("tms.create.optional")} />
            </Form.Item>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <GlobalOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("tms.create.languagesTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("tms.create.languagesSubtitle")}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Form.Item
                label={t("tms.create.sourceLabel")}
                name="source"
                rules={[
                  { required: true, message: t("tms.create.sourceRequired") },
                ]}
              >
                <Select
                  showSearch
                  placeholder={t("tms.create.sourcePlaceholder")}
                  optionFilterProp="label"
                  options={languageOptions}
                />
              </Form.Item>
              <Form.Item
                name="target"
                label={t("tms.create.targetLabel")}
                rules={[
                  { required: true, message: t("tms.create.targetRequired") },
                ]}
              >
                <Select
                  showSearch
                  placeholder={t("tms.create.targetPlaceholder")}
                  optionFilterProp="label"
                  options={languageOptions}
                />
              </Form.Item>
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button onClick={onBack}>{t("common.cancel")}</Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
                border: 0,
              }}
            >
              {t("tms.create.submit")}
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
