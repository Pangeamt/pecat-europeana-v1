import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { NextAuthProvider } from "./providers";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PECAT EUROPEANA",
  description: "Lenguistic Tools for Europeana",
};

export default function RootLayout({ children }) {
  return (
    <NextAuthProvider>
      <html lang="en">
        <body className={inter.className}>
          <AntdRegistry>{children}</AntdRegistry>
        </body>
      </html>
    </NextAuthProvider>
  );
}
