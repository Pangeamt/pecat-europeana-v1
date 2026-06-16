"use client";
import React from "react";
import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider } from "antd";
import { SessionProvider } from "next-auth/react";

import { LanguageProvider } from "@/components/i18n/LanguageProvider";

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
        <LanguageProvider>{children}</LanguageProvider>
      </ConfigProvider>
    </SessionProvider>
  );
};
