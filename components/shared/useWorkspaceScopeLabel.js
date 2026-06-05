"use client";

import { getWorkspace } from "@/services/workspace.services";
import { useEffect, useState } from "react";

export function useWorkspaceScopeLabel(user) {
  const [fetched, setFetched] = useState({ userId: null, name: null });

  useEffect(() => {
    if (!user || user.role === "SUPER" || !user.workspaceId || user.workspace?.name) return;

    let cancelled = false;
    getWorkspace(user.workspaceId)
      .then((data) => {
        if (!cancelled)
          setFetched({ userId: user.id, name: data.workspace?.name ?? "No workspace" });
      })
      .catch(() => {
        if (!cancelled) setFetched({ userId: user.id, name: "No workspace" });
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return { label: "—", loading: false };
  if (user.role === "SUPER") return { label: "All workspaces", loading: false };
  if (!user.workspaceId) return { label: "No workspace", loading: false };
  if (user.workspace?.name) return { label: user.workspace.name, loading: false };

  const resolvedName = fetched.userId === user.id ? fetched.name : null;
  if (!resolvedName) return { label: "—", loading: true };
  return { label: resolvedName, loading: false };
}
