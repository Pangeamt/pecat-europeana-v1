"use client";
import React from "react";
import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider } from "antd";
import { SessionProvider } from "next-auth/react";

export const NextAuthProvider = ({ children }) => {
  return (
    <SessionProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#98C441",
          },
        }}
      >
        {children}
      </ConfigProvider>
    </SessionProvider>
  );
};
