"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Layout, Menu } from "antd";
import {
  ApartmentOutlined,
  BookOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

import AvatarDropdown from "@/components/AvatarDropdown";
import Logo from "@/components/Logo";
import { userStore } from "@/store";

const { Header, Sider, Content } = Layout;

const MENU_KEYS = {
  projects: "projects",
  tms: "tms",
  glossaries: "glossaries",
  users: "users",
  workspaces: "workspaces",
};

const isTusRoute = (pathname) => /^\/dashboard\/[^/]+\/tus$/.test(pathname);

const getSelectedKey = (pathname) => {
  if (pathname.startsWith("/dashboard/users")) return MENU_KEYS.users;
  if (pathname.startsWith("/dashboard/workspaces")) return MENU_KEYS.workspaces;
  if (pathname.startsWith("/dashboard/tms")) return MENU_KEYS.tms;
  if (pathname.startsWith("/dashboard/glossaries")) return MENU_KEYS.glossaries;
  return MENU_KEYS.projects;
};

const buildMenuItems = (role) => {
  const items = [
    {
      key: MENU_KEYS.projects,
      icon: <FileTextOutlined />,
      label: <Link href="/dashboard">Projects</Link>,
    },
    {
      key: MENU_KEYS.tms,
      icon: <DatabaseOutlined />,
      label: <Link href="/dashboard/tms">TMs</Link>,
    },
    {
      key: MENU_KEYS.glossaries,
      icon: <BookOutlined />,
      label: <Link href="/dashboard/glossaries">Glossaries</Link>,
    },
  ];

  if (role === "ADMIN" || role === "SUPER") {
    items.push({
      key: MENU_KEYS.users,
      icon: <UserOutlined />,
      label: <Link href="/dashboard/users">Users</Link>,
    });
  }

  if (role === "SUPER") {
    items.push({
      key: MENU_KEYS.workspaces,
      icon: <ApartmentOutlined />,
      label: <Link href="/dashboard/workspaces">Workspaces</Link>,
    });
  }

  return items;
};

const HEADER_STYLE = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  height: 64,
  lineHeight: "64px",
  paddingInline: 20,
  background: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
  boxShadow:
    "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
};

const CONTENT_STYLE = { padding: 15 };

const SIDER_STYLE = { paddingRight: 10, background: "transparent" };

const MENU_STYLE = {
  background: "transparent",
  marginTop: 6,
  paddingRight: 10,
};

const DashboardShell = ({ initialUser, children }) => {
  const pathname = usePathname();
  const storeUser = userStore((state) => state.user);
  const user = storeUser ?? initialUser;

  const routeKey = isTusRoute(pathname) ? "tus" : "default";
  const [collapsedState, setCollapsedState] = useState(() => ({
    key: routeKey,
    value: isTusRoute(pathname),
  }));

  if (collapsedState.key !== routeKey) {
    setCollapsedState({ key: routeKey, value: routeKey === "tus" });
  }

  const collapsed = collapsedState.value;
  const setCollapsed = (valueOrUpdater) => {
    setCollapsedState((prev) => ({
      ...prev,
      value:
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(prev.value)
          : valueOrUpdater,
    }));
  };

  const menuItems = useMemo(() => buildMenuItems(user?.role), [user?.role]);
  const selectedKeys = useMemo(() => [getSelectedKey(pathname)], [pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={HEADER_STYLE}>
        <div className="flex h-full items-center justify-between gap-4">
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
          style={SIDER_STYLE}
        >
          <Button
            className="sider-collapsed-button"
            shape="circle"
            icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          />
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            style={MENU_STYLE}
            items={menuItems}
          />
        </Sider>
        <Content style={CONTENT_STYLE}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default DashboardShell;
