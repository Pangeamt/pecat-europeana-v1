"use client";

import React, { useState } from "react";
import { Space, Avatar, Table, Tooltip, Button, Popconfirm, Card } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

import { useEffect } from "react";
import UserEdit from "./edit";
import UserAdd from "./add";

const saveUser = async (newUser) => {
  return await axios({
    method: "patch",
    url: "/api/users",
    data: newUser,
  });
};
const removeUser = async (userId) => {
  return await axios({
    method: "delete",
    url: `/api/users`,
    data: { userId },
  });
};

const addUser = async (newUser) => {
  return await axios({
    method: "post",
    url: "/api/users",
    data: newUser,
  });
};

const getUsers = async () => {
  return await axios({
    method: "get",
    url: "/api/users",
  });
};

const UserList = () => {
  const [requesting, setRequesting] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRequesting(true);
      const { data } = await getUsers();
      setUsers(data.users);
      setRequesting(false);
    } catch (error) {
      console.error(error);
      setRequesting(false);
    }
  };
  const save = async ({ ...values }) => {
    await saveUser(values);
    await fetchData();
  };

  const add = async ({ ...values }) => {
    try {
      console.log(values);
      await addUser(values);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const remove = async (userId) => {
    try {
      await removeUser(userId);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: "",
      dataIndex: "image",
      key: "image",
      width: 70,
      render: (value) => (
        <Space size="middle">
          {value && <Avatar src={<img src={value} alt="avatar" />} />}
          {!value && <Avatar src={"/images/Logo perfil RRSS 1.png"} />}
        </Space>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "",
      key: "action",
      width: 120,
      render: (record) => {
        return (
          <div className="flex justify-end">
            <UserEdit user={record} save={save} />

            <Popconfirm
              title="Delete the task"
              description="Are you sure to delete this task?"
              onConfirm={() => remove(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Remove">
                <Button
                  size="small"
                  type="primary"
                  shape="circle"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </div>
        );
      },
    },
  ];
  return (
    <Card
      title="Users"
      extra={<UserAdd add={add} refetch={fetchData} />}
      className="project-list-card"
      style={{ marginLeft: 20 }}
    >
      <Table
        loading={requesting}
        columns={columns}
        dataSource={users}
        rowKey={(record) => record.id}
        size="small"
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default UserList;
