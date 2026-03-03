"use client";
import React from "react";
import "@ant-design/v5-patch-for-react-19";
import { SessionProvider } from "next-auth/react";

export const NextAuthProvider = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
