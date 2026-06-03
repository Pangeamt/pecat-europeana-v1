"use client";

import { getWorkspace } from "@/services/workspace.services";
import { useEffect, useState } from "react";

export function useWorkspaceScopeLabel(user) {
  const [resolvedName, setResolvedName] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setResolvedName(null);
      setLoading(false);
      return undefined;
    }

    if (user.role === "SUPER") {
      setResolvedName("All workspaces");
      setLoading(false);
      return undefined;
    }

    if (!user.workspaceId) {
      setResolvedName("No workspace");
      setLoading(false);
      return undefined;
    }

    if (user.workspace?.name) {
      setResolvedName(user.workspace.name);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    getWorkspace(user.workspaceId)
      .then((data) => {
        if (cancelled) return;
        setResolvedName(data.workspace?.name ?? "No workspace");
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedName("No workspace");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.workspaceId, user?.workspace?.name]);

  if (!user) {
    return { label: "—", loading: false };
  }

  if (user.role === "SUPER") {
    return { label: "All workspaces", loading: false };
  }

  if (!user.workspaceId) {
    return { label: "No workspace", loading: false };
  }

  if (user.workspace?.name) {
    return { label: user.workspace.name, loading: false };
  }

  if (loading || !resolvedName) {
    return { label: "—", loading: true };
  }

  return { label: resolvedName, loading: false };
}
