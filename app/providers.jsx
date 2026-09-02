"use client";
import React from "react";
import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider } from "antd";
import { SessionProvider } from "next-auth/react";

import { LanguageProvider } from "@/components/i18n/LanguageProvider";

// Brand design tokens — single source of truth for AntD.
// Mirrored in tailwind.config.js (colors.primary scale) and app/globals.css
// (:root CSS vars). Keep the three in sync. See design-system/MASTER.md.
const BRAND = {
  // primary green-700: AA contrast (4.7:1) with white button text.
  primary: "#5E7D26",
  // The historical Pangeanic lime (#98C441) stays as the bright accent:
  // hovers, soft fills, badges — never as text on white.
  bright: "#98C441",
  bgLayout: "#F8FAF5",
  text: "#1C2617",
};

export const NextAuthProvider = ({ children }) => {
  return (
    <SessionProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: BRAND.primary,
            colorLink: BRAND.primary,
            colorInfo: BRAND.primary,
            colorSuccess: "#4D7C0F",
            // Explicit light steps: antd derives these from colorSuccess and
            // a dark olive seed yields a grayish, washed-out background for
            // Tag color="success" (TM/glossary "Ready"). Pin them to the
            // brand scale instead (primary-100 / primary-300).
            colorSuccessBg: "#EAF3D3",
            colorSuccessBorder: "#C0DB7F",
            colorWarning: "#D97706",
            colorError: "#DC2626",
            colorTextBase: BRAND.text,
            colorBgLayout: BRAND.bgLayout,
            borderRadius: 8,
            fontFamily:
              "var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, sans-serif",
            fontSize: 14,
          },
          components: {
            Button: { fontWeight: 500 },
            Menu: {
              itemSelectedBg: "#EAF3D3",
              itemSelectedColor: "#384C16",
            },
            Table: { headerBg: "#F3F7EA" },
          },
        }}
      >
        <LanguageProvider>{children}</LanguageProvider>
      </ConfigProvider>
    </SessionProvider>
  );
};
