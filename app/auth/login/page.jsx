"use client";

import { Suspense, useState } from "react";
import { Alert, Button, Card, Form, Input, Typography, Image } from "antd";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const LoginContent = () => {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const onFinish = async ({ email, password }) => {
    setLoading(true);
    await signIn("credentials", {
      email,
      password,
      callbackUrl,
    });
    setLoading(false);
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
          <Typography.Title level={2} style={{ marginBottom: 20 }} className="text-center font-bold">PECAT-E</Typography.Title>
         </div>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Credenciales inválidas"
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block className="text-color-primary">
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
