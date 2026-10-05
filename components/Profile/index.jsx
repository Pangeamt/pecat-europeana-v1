"use client";

import { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Segmented,
  Tag,
  message,
} from "antd";
import { Globe, KeyRound } from "lucide-react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { updateProfile } from "@/services/user.services";
import { userStore } from "@/store";

const DEFAULT_AVATAR = "/images/Logo perfil RRSS 1.png";

const ROLE_COLORS = {
  SUPER: "purple",
  ADMIN: "blue",
  USER: "default",
};

const Profile = () => {
  const { t, language, setLanguage } = useTranslation();
  const { user } = userStore();
  const [passwordForm] = Form.useForm();
  const [savingPassword, setSavingPassword] = useState(false);

  const languageOptions = SUPPORTED_LANGUAGES.map((code) => ({
    label: t(`languages.${code}`),
    value: code,
  }));

  const handleLanguageChange = (value) => {
    // The provider persists the choice on the account and in local storage.
    setLanguage(value);
    message.success(t("profile.languageUpdated"));
  };

  const handlePasswordSubmit = async (values) => {
    setSavingPassword(true);
    try {
      await updateProfile({
        currentPassword: values.currentPassword,
        password: values.password,
      });
      message.success(t("profile.passwordUpdated"));
      passwordForm.resetFields();
    } catch (error) {
      const code = error?.response?.data?.code;
      message.error(
        code === "INVALID_CURRENT_PASSWORD"
          ? t("profile.wrongCurrentPassword")
          : t("profile.updateError"),
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      {/* Identity header: who is signed in, shown once (no separate card). */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-900 to-primary-700 p-5 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-200">
          {t("profile.title")}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <Avatar
            src={user.image || DEFAULT_AVATAR}
            size={56}
            className="shrink-0 ring-2 ring-white/40"
          />
          <div className="min-w-0 flex-1">
            <h1 className="m-0 truncate text-2xl font-semibold">{user.name}</h1>
            <p className="m-0 mt-1 truncate text-sm text-slate-300">
              {user.email}
            </p>
          </div>
          <Tag
            color={ROLE_COLORS[user.role] ?? "default"}
            className="m-0 shrink-0"
          >
            {user.role}
          </Tag>
        </div>
        <p className="m-0 mt-4 text-sm text-slate-300">
          {t("profile.subtitle")}
        </p>
      </div>

      <Card
        title={
          <span className="flex items-center gap-2">
            <Globe size={16} className="text-slate-400" />
            {t("profile.languageSection")}
          </span>
        }
      >
        <p className="mb-3 text-sm text-slate-500">{t("profile.languageHint")}</p>
        <Segmented
          value={language}
          onChange={handleLanguageChange}
          options={languageOptions}
        />
      </Card>

      <Card
        title={
          <span className="flex items-center gap-2">
            <KeyRound size={16} className="text-slate-400" />
            {t("profile.passwordSection")}
          </span>
        }
      >
        <p className="mb-4 text-sm text-slate-500">{t("profile.passwordHint")}</p>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="currentPassword"
            label={t("profile.currentPassword")}
            rules={[
              {
                required: true,
                message: t("profile.currentPasswordRequired"),
              },
            ]}
          >
            <Input.Password autoComplete="current-password" size="large" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="password"
              label={t("profile.newPassword")}
              rules={[
                { required: true, message: t("profile.newPasswordRequired") },
                { min: 6, message: t("profile.passwordTooShort") },
              ]}
            >
              <Input.Password autoComplete="new-password" size="large" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t("profile.confirmPassword")}
              dependencies={["password"]}
              rules={[
                { required: true, message: t("profile.newPasswordRequired") },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(t("profile.passwordsDoNotMatch")),
                    );
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" size="large" />
            </Form.Item>
          </div>
          <Button
            type="primary"
            htmlType="submit"
            loading={savingPassword}
            style={{ background: "var(--color-primary)", borderColor: "var(--color-primary)" }}
          >
            {t("profile.updatePassword")}
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;
