"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import WorkspaceDetail from "@/components/Workspace/detail";
import { userStore } from "@/store";

const WorkspaceDetailPage = () => {
  const { id } = useParams();
  const { replace } = useRouter();
  const { user } = userStore();

  useEffect(() => {
    if (user && user.role !== "SUPER") {
      replace("/dashboard");
    }
  }, [user, replace]);

  if (!id) return null;
  if (!user || user.role !== "SUPER") return null;

  return <WorkspaceDetail workspaceId={String(id)} />;
};

export default WorkspaceDetailPage;
