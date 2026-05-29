"use client";

import React, { useEffect, useState } from "react";
import {
  LogoutOutlined,
  ProfileOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Dropdown, Space, Avatar } from "antd";
import axios from "axios";

import { userStore } from "@/store";
import { useSession, signOut } from "next-auth/react";

const items = [
  // {
  //   key: "1",
  //   label: "Profile",
  //   icon: (
  //     <ProfileOutlined
  //       style={{
  //         fontSize: 16,
  //       }}
  //     />
  //   ),
  // },
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
    if (!session?.user) return undefined;

    let cancelled = false;

    const loadUser = async () => {
      try {
        setRequesting(true);
        await save(session.user);
        const { data } = await getUser(session.user.id);
        if (cancelled) return;
        save(data.user);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setRequesting(false);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [session, save]);

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
      <button
        type="button"
        className="mt-4 cursor-pointer border-0 bg-transparent p-0 text-left"
        aria-label="Open user menu"
      >
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
      </button>
    </Dropdown>
  );
};

export default AvatarDropdown;
