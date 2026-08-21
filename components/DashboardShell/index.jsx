"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Layout, Menu } from "antd";
import {
  ApartmentOutlined,
  BookOutlined,
  FolderOutlined,
  IdcardOutlined,
  LeftOutlined,
  RightOutlined,
  SlidersOutlined,
  UserOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

import AvatarDropdown from "@/components/AvatarDropdown";
import Logo from "@/components/Logo";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { userStore } from "@/store";

const { Header, Sider, Content } = Layout;

const MENU_KEYS = {
  projects: "projects",
  tms: "tms",
  glossaries: "glossaries",
  profiles: "profiles",
  users: "users",
  workspaces: "workspaces",
  profile: "profile",
};

const isTusRoute = (pathname) => /^\/dashboard\/[^/]+\/tus$/.test(pathname);
// The project detail page (where the documents table lives).
const isProjectDetailRoute = (pathname) =>
  /^\/dashboard\/projects\/[^/]+$/.test(pathname);

// Both routes need more horizontal room for their tables, so the sidebar
// starts collapsed on entry; the user can still expand it manually and it
// stays expanded while navigating within the same route family.
const getAutoCollapseKey = (pathname) => {
  if (isTusRoute(pathname)) return "tus";
  if (isProjectDetailRoute(pathname)) return "documents";
  return "default";
};

const getSelectedKey = (pathname) => {
  // "profiles" must be matched before the "profile" (account) prefix.
  if (pathname.startsWith("/dashboard/profiles")) return MENU_KEYS.profiles;
  if (pathname.startsWith("/dashboard/profile")) return MENU_KEYS.profile;
  if (pathname.startsWith("/dashboard/users")) return MENU_KEYS.users;
  if (pathname.startsWith("/dashboard/workspaces")) return MENU_KEYS.workspaces;
  if (pathname.startsWith("/dashboard/tms")) return MENU_KEYS.tms;
  if (pathname.startsWith("/dashboard/glossaries")) return MENU_KEYS.glossaries;
  return MENU_KEYS.projects;
};

// The document review editor (/dashboard/{docId}/tus) is reached from inside
// a project, but there is no project id in that URL — keep it under the
// "Projects" nav entry rather than adding a false project match.

const buildMenuItems = (role, t) => {
  // USER is a restricted translator/reviewer role: it only works the
  // documents it's assigned to, so Profiles/TMs/Glossaries (workspace-wide
  // asset management) are hidden — matches the server-side 403s in
  // assertWorkspaceAssetAccess.
  const items = [
    {
      key: MENU_KEYS.projects,
      icon: <FolderOutlined />,
      label: <Link href="/dashboard">{t("nav.projects")}</Link>,
    },
  ];

  if (role === "ADMIN" || role === "SUPER") {
    items.push(
      {
        key: MENU_KEYS.profiles,
        icon: <SlidersOutlined />,
        label: <Link href="/dashboard/profiles">{t("nav.profiles")}</Link>,
      },
      {
        key: MENU_KEYS.tms,
        icon: <DatabaseOutlined />,
        label: <Link href="/dashboard/tms">{t("nav.tms")}</Link>,
      },
      {
        key: MENU_KEYS.glossaries,
        icon: <BookOutlined />,
        label: <Link href="/dashboard/glossaries">{t("nav.glossaries")}</Link>,
      },
      {
        key: MENU_KEYS.users,
        icon: <UserOutlined />,
        label: <Link href="/dashboard/users">{t("nav.users")}</Link>,
      },
    );
  }

  if (role === "SUPER") {
    items.push({
      key: MENU_KEYS.workspaces,
      icon: <ApartmentOutlined />,
      label: <Link href="/dashboard/workspaces">{t("nav.workspaces")}</Link>,
    });
  }

  // Always available, regardless of role.
  items.push({
    key: MENU_KEYS.profile,
    icon: <IdcardOutlined />,
    label: <Link href="/dashboard/profile">{t("account.profile")}</Link>,
  });

  return items;
};

const HEADER_STYLE = {
  position: "sticky",
  top: 0,
  zIndex: 100,
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

// Pinned below the sticky header so it never scrolls out of view with a
// tall main content area; scrolls internally if the menu itself ever grows
// taller than the viewport.
const SIDER_STYLE = {
  paddingRight: 10,
  background: "transparent",
  position: "sticky",
  top: HEADER_STYLE.height,
  height: `calc(100vh - ${HEADER_STYLE.height}px)`,
  overflowY: "auto",
  alignSelf: "flex-start",
};

const MENU_STYLE = {
  background: "transparent",
  marginTop: 6,
  paddingRight: 10,
};

const DashboardShell = ({ initialUser, children }) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const storeUser = userStore((state) => state.user);
  const user = storeUser ?? initialUser;

  const routeKey = getAutoCollapseKey(pathname);
  const [collapsedState, setCollapsedState] = useState(() => ({
    key: routeKey,
    value: routeKey !== "default",
  }));

  if (collapsedState.key !== routeKey) {
    setCollapsedState({ key: routeKey, value: routeKey !== "default" });
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

  const menuItems = useMemo(
    () => buildMenuItems(user?.role, t),
    [user?.role, t],
  );
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
