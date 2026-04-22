"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import WorkspaceDetail from "@/components/Workspace/detail";
import { userStore } from "@/store";

const WorkspaceDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = userStore();

  useEffect(() => {
    if (user && user.role !== "SUPER") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!id) return null;
  if (!user || user.role !== "SUPER") return null;

  return <WorkspaceDetail workspaceId={String(id)} />;
};

export default WorkspaceDetailPage;
