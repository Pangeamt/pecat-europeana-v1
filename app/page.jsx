"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Spin size="large" />
    </main>
  );
}
