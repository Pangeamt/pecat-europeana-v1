"use client";
import React, { useEffect, useState } from "react";
import { Button, Layout, Menu, theme } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
} from "@ant-design/icons";

import AvatarDropdown from "../../components/AvatarDropdown";
import Logo from "../../components/Logo";
import { userStore } from "../../store";

const { Header, Sider, Content } = Layout;

const validateRoute = (route) => {
  const regex = /^\/dashboard\/[a-zA-Z0-9]+\/tus$/;
  return regex.test(route);
};

const App = ({ children }) => {
  const store = userStore();
  const { user } = store;
  const [collapsed, setCollapsed] = useState(true);
  const [page, setPage] = useState(["1"]);
  const [menusItems, setMenusItems] = useState([
    {
      key: "1",
      icon: <FileTextOutlined />,
      label: <Link href="/dashboard">Projects</Link>,
    },
  ]);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const pathname = usePathname();
  const isValidRoute = validateRoute(pathname);

  useEffect(() => {
    if (isValidRoute) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isValidRoute]);

  useEffect(() => {
    if (pathname === "/dashboard") {
      setPage(["1"]);
    } else if (pathname === "/dashboard/users") {
      setPage(["2"]);
    }
  }, [pathname]);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      const aux = [...menusItems];
      if (!aux.find((item) => item.key === "2")) {
        aux.push({
          key: "2",
          icon: <UserOutlined />,
          label: <Link href="/dashboard/users">Users</Link>,
        });
      }

      setMenusItems(aux);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Layout
      className={`layout-container `}
      style={{
        minHeight: "100vh",
      }}
    >
      <Header
        className="
    ant-layout-header css-dev-only-do-not-override-1kllxaf ant-pro-layout-header ant-pro-layout-header-fixed-header ant-pro-layout-header-mix ant-pro-layout-header-fixed-header-action ant-pro-layout-header-header css-dev-only-do-not-override-1svvuad
    "
        style={{
          background: colorBgContainer,
          boxShadow:
            "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex justify-between">
          <Logo />

          <AvatarDropdown />
        </div>
      </Header>
      <Layout>
        <Sider
          theme="light"
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          style={{ paddingRight: 10, background: "transparent" }}
        >
          <Button
            className="sider-collapsed-button"
            shape="circle"
            icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Menu
            mode="inline"
            selectedKeys={page}
            style={{
              background: "transparent",
              marginTop: 6,
              paddingRight: 10,
            }}
            items={menusItems}
          />
        </Sider>
        <Content
          style={{
            margin: "0px 0px 0 0px",
            padding: "15px",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
