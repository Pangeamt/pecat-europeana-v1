"use client";

import { Suspense, useState } from "react";
import { Alert, Button, Card, Form, Input, Segmented, Typography, Image } from "antd";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

const AUTH_ERROR_MESSAGES = {
  CredentialsSignin: "Invalid credentials.",
  "Password is required.": "Password is required.",
  "User not found.": "No account found with that email.",
  "User data is incomplete for authentication.":
    "This account has no credentials set up. Please contact an administrator.",
  "Invalid email and password combination":
    "Incorrect email or password.",
};

const resolveAuthErrorMessage = (error) => {
  if (!error) return null;
  return AUTH_ERROR_MESSAGES[error] || error;
};

const LoginContent = () => {
  const { t, language, setLanguage } = useTranslation();
  const { push, refresh } = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(() =>
    resolveAuthErrorMessage(searchParams.get("error")),
  );

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        push(callbackUrl);
        refresh();
        return;
      }

      setErrorMessage(
        resolveAuthErrorMessage(result?.error) || t("login.genericError"),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(t("login.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card style={{ width: 380 }}>
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/images/pglogo-light.svg"
            alt="logo"
            width={100}
            height={34}
            preview={false}
            style={{
              height: 34,
              width: 100,
              marginTop: 7,
            }}
          />
        </div>

        <div className="flex items-center justify-center mb-4">
          <Typography.Title
            level={2}
            style={{ marginBottom: 20 }}
            className="text-center font-bold"
          >
            PECAT-E
          </Typography.Title>
        </div>

        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Form
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label={t("login.email")}
            rules={[
              { required: true, message: t("login.emailRequired") },
              { type: "email", message: t("login.emailRequired") },
            ]}
          >
            <Input autoComplete="email" placeholder={t("login.emailPlaceholder")} />
          </Form.Item>

          <Form.Item
            name="password"
            label={t("login.password")}
            rules={[{ required: true, message: t("login.passwordRequired") }]}
          >
            <Input.Password
              autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="text-color-primary"
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </Button>
        </Form>

        <div className="mt-5 flex justify-center">
          <Segmented
            size="small"
            value={language}
            onChange={setLanguage}
            options={SUPPORTED_LANGUAGES.map((code) => ({
              label: t(`languages.${code}`),
              value: code,
            }))}
          />
        </div>
      </Card>
    </main>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
