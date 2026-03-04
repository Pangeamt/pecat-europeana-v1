import axios from "axios";


export const saveUser = async (newUser) => {
  return await axios({
    method: "patch",
    url: "/api/users",
    data: newUser,
  });
};

export const removeUser = async (userId) => {
  return await axios({
    method: "delete",
    url: `/api/users`,
    data: { userId },
  });
};

export const addUser = async (newUser) => {
  return await axios({
    method: "post",
    url: "/api/users",
    data: newUser,
  });
};

export const getUsers = async () => {
  return await axios({
    method: "get",
    url: "/api/users",
  });
};