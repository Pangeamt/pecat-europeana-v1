"use client";

import React, { useEffect, useState } from "react";
import {
  LogoutOutlined,
  ProfileOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Dropdown, Space, Avatar } from "antd";
import axios from "axios";

import { userStore } from "../../store";
import { useSession, signOut } from "next-auth/react";

const items = [
  {
    key: "1",
    label: "Profile",
    icon: (
      <ProfileOutlined
        style={{
          fontSize: 16,
        }}
      />
    ),
  },
  {
    key: "4",
    danger: true,
    label: "Sign out",
    icon: (
      <LogoutOutlined
        style={{
          fontSize: 16,
        }}
      />
    ),
    onClick: () => signOut(),
  },
];

const getUser = async (id) => {
  return await axios({
    method: "get",
    url: `/api/users/${id}`,
  });
};

const AvatarDropdown = () => {
  const { data: session } = useSession();
  const store = userStore();
  const { save, user } = store;

  const [requesting, setRequesting] = useState(true);

  useEffect(() => {
    if (session && session.user) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const start = async () => {
    await save(session.user);
    await fetchUser(session.user.id);
  };

  const fetchUser = async (id) => {
    try {
      setRequesting(true);
      const { data } = await getUser(id);
      save(data.user);
      setRequesting(false);
    } catch (error) {
      console.error(error);
      setRequesting(false);
    }
  };

  const getImages = (userData) => {
    if (requesting) return null;
    if (userData?.image) return userData.image;
    return "/images/Logo perfil RRSS 1.png";
  };

  if (!user) return null;
  return (
    <Dropdown
      menu={{ items }}
      placement="bottomRight"
      overlayStyle={{
        marginTop: -20,
      }}
    >
      <a onClick={(e) => e.preventDefault()}>
        <Space className="mt-4">
          <div className="flex justify-between align-middle h-full">
            {requesting ? (
              <Avatar
                icon={<LoadingOutlined />}
                style={{
                  width: 32,
                  height: 32,
                }}
              />
            ) : (
              <Avatar
                src={getImages(user)}
                style={{
                  width: 32,
                  height: 32,
                }}
              />
            )}

            <div
              className="ml-2"
              style={{
                color: "rgba(0, 0, 0, 0.45)",
              }}
            >
              <p className="w-full leading-4 font-medium text-black">
                {user.name}
              </p>
              <p className="w-full leading-4">{user.email}</p>
            </div>
          </div>
        </Space>
      </a>
    </Dropdown>
  );
};

export default AvatarDropdown;
