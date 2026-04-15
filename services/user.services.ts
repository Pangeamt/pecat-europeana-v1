import { httpClient } from "./http-client";


export const saveUser = async (newUser) => {
  return await httpClient({
    method: "patch",
    url: "/api/users",
    data: newUser,
  });
};

export const removeUser = async (userId) => {
  return await httpClient({
    method: "delete",
    url: `/api/users`,
    data: { userId },
  });
};

export const addUser = async (newUser) => {
  return await httpClient({
    method: "post",
    url: "/api/users",
    data: newUser,
  });
};

export const getUsers = async () => {
  return await httpClient({
    method: "get",
    url: "/api/users",
  });
};