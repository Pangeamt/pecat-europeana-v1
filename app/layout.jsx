import { Plus_Jakarta_Sans } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { NextAuthProvider } from "./providers";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: "PECAT-E",
  description: "Linguistic Tools for PECAT-E",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
    android: "/android-chrome-192x192.png",
    androidLarge: "/android-chrome-512x512.png",
    favicon: "/favicon-32x32.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <NextAuthProvider>
      <html lang="en">
        <body className={`${jakarta.variable} ${jakarta.className}`}>
          <AntdRegistry>{children}</AntdRegistry>
        </body>
      </html>
    </NextAuthProvider>
  );
}
