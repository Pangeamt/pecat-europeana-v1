"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserList from "../../../components/User/list";
import { userStore } from "@/store";

const Users = () => {
  const router = useRouter();
  const { user } = userStore();

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "SUPER") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER")) return null;

  return <UserList />;
};

export default Users;
