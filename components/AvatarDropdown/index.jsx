"use client";

import { useEffect, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Avatar, Dropdown } from "antd";
import axios from "axios";
import { Building2, ChevronDown, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import { useWorkspaceScopeLabel } from "@/components/shared/useWorkspaceScopeLabel";
import { userStore } from "@/store";

const DEFAULT_AVATAR = "/images/Logo perfil RRSS 1.png";

const ROLE_STYLES = {
  SUPER: "bg-purple-100 text-purple-700 ring-purple-200/80",
  ADMIN: "bg-sky-100 text-sky-700 ring-sky-200/80",
  USER: "bg-slate-100 text-slate-600 ring-slate-200/80",
};

const getUser = async (id) => {
  return axios.get(`/api/users/${id}`);
};

const RoleBadge = ({ role }) => {
  const styles = ROLE_STYLES[role] ?? ROLE_STYLES.USER;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ${styles}`}
    >
      {role || "USER"}
    </span>
  );
};

const UserMenuSkeleton = () => (
  <div
    className="flex items-center gap-2.5 rounded-full px-2 py-1.5"
    aria-hidden="true"
  >
    <div className="size-9 animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none" />
    <div className="hidden space-y-1.5 sm:block">
      <div className="h-3 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
      <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
    </div>
  </div>
);

const AvatarDropdown = () => {
  const { data: session } = useSession();
  const { save, user } = userStore();
  const [requesting, setRequesting] = useState(true);
  const [open, setOpen] = useState(false);
  const { label: workspaceLabel, loading: workspaceLoading } =
    useWorkspaceScopeLabel(user);

  useEffect(() => {
    if (!session?.user) return undefined;

    let cancelled = false;

    const loadUser = async () => {
      try {
        setRequesting(true);
        save(session.user);
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

  const avatarSrc =
    !requesting && user?.image ? user.image : requesting ? null : DEFAULT_AVATAR;

  if (!user) return null;

  if (requesting) {
    return <UserMenuSkeleton />;
  }

  const workspaceHint =
    workspaceLoading || workspaceLabel === "—" ? "Loading workspace…" : workspaceLabel;

  const dropdownContent = (
    <div className="w-72 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={avatarSrc}
            size={48}
            className="ring-2 ring-white shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RoleBadge role={user.role} />
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200/80">
            <Building2 size={12} className="shrink-0" />
            <span className="truncate">{workspaceHint}</span>
          </span>
        </div>
      </div>
      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            void signOut();
          }}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors duration-200 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 motion-reduce:transition-none"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      placement="bottomRight"
      overlayClassName="dashboard-user-dropdown [&_.ant-dropdown-menu]:!m-0 [&_.ant-dropdown-menu]:!bg-transparent [&_.ant-dropdown-menu]:!p-0 [&_.ant-dropdown-menu]:!shadow-none"
      popupRender={() => dropdownContent}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open account menu for ${user.name}`}
        className={`group flex cursor-pointer items-center gap-2.5 rounded-full bg-transparent px-2 py-1.5 pl-1.5 transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#98C441]/40 ${
          open ? "bg-slate-50" : "hover:bg-slate-50"
        }`}
      >
        <Avatar
          src={avatarSrc}
          icon={requesting ? <LoadingOutlined /> : undefined}
          size={36}
          className="ring-2 ring-white"
        />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-semibold leading-tight text-slate-900">
            {user.name}
          </span>
          <span className="block truncate text-xs leading-tight text-slate-500">
            {workspaceHint}
          </span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`hidden shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none sm:block ${
            open ? "rotate-180" : "group-hover:text-slate-600"
          }`}
          aria-hidden="true"
        />
      </button>
    </Dropdown>
  );
};

export default AvatarDropdown;
