"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserList from "../../../components/User/list";
import { userStore } from "@/store";

const Users = () => {
  const { replace } = useRouter();
  const { user } = userStore();

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "SUPER") {
      replace("/dashboard");
    }
  }, [user, replace]);

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER")) return null;

  return <UserList />;
};

export default Users;
