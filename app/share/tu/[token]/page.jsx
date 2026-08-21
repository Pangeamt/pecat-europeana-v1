"use client";
import { useParams } from "next/navigation";

import { TusList } from "@/components/Tus";

// Standalone, no-login "share as translator" editor. Deliberately outside
// `/dashboard` so it never inherits DashboardShell (sidebar/menu/session
// chrome) — the visitor only ever sees this one document's segments.
const SharedTusPage = () => {
  const { token } = useParams();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4">
      <TusList shareToken={token} />
    </div>
  );
};

export default SharedTusPage;
