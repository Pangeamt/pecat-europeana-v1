"use client";

import { Suspense, useState } from "react";
import { Alert, Button, Card, Form, Input, Typography, Image } from "antd";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
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
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      setErrorMessage(
        resolveAuthErrorMessage(result?.error) ||
          "We couldn't sign you in. Please try again.",
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Connection error. Check your network and try again.");
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
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input autoComplete="email" autoFocus />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="text-color-primary"
          >
            Login
          </Button>
        </Form>
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
