"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceList from "@/components/Workspace/list";
import { userStore } from "@/store";

const WorkspacesPage = () => {
  const { replace } = useRouter();
  const { user } = userStore();

  useEffect(() => {
    if (user && user.role !== "SUPER") {
      replace("/dashboard");
    }
  }, [user, replace]);

  if (!user || user.role !== "SUPER") return null;

  return <WorkspaceList />;
};

export default WorkspacesPage;
