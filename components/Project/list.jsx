"use client";
import ProjectAdd from "@/components/Project/add";
import ProjectEdit from "@/components/Project/edit";
import { formatDate } from "@/lib/utils";
import {
  addProject,
  getProjects,
  getProjectShareLink,
  removeProject,
  saveProject,
} from "@/services/project.services";
import { tmStore } from "@/store";
import {
  DeleteOutlined,
  DownloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { StatCard, StatCardGrid } from "@/components/shared/StatCard";
import { Building2, CircleCheck, FolderKanban, Loader2 } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  message,
  Popconfirm,
  Progress,
  Space,
  Tag,
  Table,
  Tooltip,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
const READY_PROJECT_STATUS = "READY";

const PROJECT_STATUS_CONFIG = {
  UPLOADED: { label: "Uploaded", color: "default" },
  PROCESSING: { label: "Processing", color: "blue" },
  FILE_PROCESSING: { label: "File Processing", color: "geekblue" },
  MTQE_PROCESSING: { label: "MTQE", color: "cyan" },
  READY: { label: "Ready", color: "green" },
  FILE_ERROR: { label: "File Error", color: "red" },
  MTQE_ERROR: { label: "MTQE Error", color: "volcano" },
};

const ProjectList = () => {
  const [requesting, setRequesting] = useState(true);
  const [data, setData] = useState([]);
  const clear = tmStore((state) => state.clear);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getProjects();
      setData(data.docs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const hasPendingProjects = data.some(
      (project) =>
        project.status &&
        project.status !== READY_PROJECT_STATUS &&
        !project.status.endsWith("_ERROR"),
    );

    if (!hasPendingProjects) return;

    const timer = setInterval(() => {
      fetchDataRef.current();
    }, 5000);

    return () => clearInterval(timer);
  }, [data]);

  const getProjectStatusTag = (status) => {
    const config = PROJECT_STATUS_CONFIG[status] ?? {
      label: status || "Unknown",
      color: "default",
    };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const save = async ({ ...values }) => {
    try {
      await saveProject(values);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const add = async ({ ...values }) => {
    try {
      await addProject(values);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const remove = async (projectId) => {
    try {
      await removeProject(projectId);
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // function verificarPermisoPortapapeles() {
  //   navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
  //     if (result.state === "granted" || result.state === "prompt") {
  //       // Permiso concedido o el navegador mostrará un diálogo de solicitud de permiso
  //       copiarAlPortapapeles("Texto para copiar");
  //     } else {
  //       console.log("Permiso para escribir en el portapapeles denegado.");
  //       // Notificar al usuario o tomar otra acción
  //     }
  //   });
  // }

  const getDownloadLink = async (projectId) => {
    try {
      setRequesting(projectId);
      const shareLink = await getProjectShareLink(projectId, baseURL);
      window.location.assign(shareLink);
      setRequesting("");
    } catch (error) {
      console.error(error);
      message.error("Could not download file");
      setRequesting("");
    }
  };

  const labelFilters = useMemo(
    () =>
      [...new Set(data.map((p) => p.label).filter(Boolean))].map((l) => ({
        text: l,
        value: l,
      })),
    [data],
  );

  const readyProjects = data.filter(
    (project) => project.status === READY_PROJECT_STATUS,
  ).length;
  const pendingProjects = data.filter(
    (project) =>
      project.status &&
      project.status !== READY_PROJECT_STATUS &&
      !project.status.endsWith("_ERROR"),
  ).length;
  const errorProjects = data.filter((project) =>
    project.status?.endsWith("_ERROR"),
  ).length;
  const deletedProjects = data.filter((project) => project.deletedAt).length;
  const workspaceCount = new Set(
    data.flatMap((project) =>
      project.workspace?.id ? [project.workspace.id] : [],
    ),
  ).size;
  const readyPercent =
    data.length > 0 ? Math.round((readyProjects / data.length) * 100) : 0;

  const columns = [
    {
      title: "Filename",
      dataIndex: "filename",
      key: "name",
      render: (text, record) => {
        const isReady =
          record.status === READY_PROJECT_STATUS && !record.deletedAt;
        if (!isReady) {
          return (
            <Tooltip title="Document is still processing">
              <div>
                <span className="font-semibold text-slate-500">{text}</span>
                <div className="mt-1 text-xs text-slate-400">{record.id}</div>
              </div>
            </Tooltip>
          );
        }
        return (
          <div>
            <Link
              href={`/dashboard/${record.id}/tus`}
              className="font-semibold text-slate-900 hover:text-blue-600"
            >
              {text}
            </Link>
            <div className="mt-1 text-xs text-slate-400">{record.id}</div>
          </div>
        );
      },
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      filters: labelFilters,
      onFilter: (value, record) => record.label === value,
      render: (label) =>
        label ? (
          <Tag className="rounded-full">{label}</Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: "Workspace",
      key: "workspace",
      render: (record) =>
        record.workspace?.name ? (
          <Tag color="geekblue" className="rounded-full">
            {record.workspace.name}
          </Tag>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) =>
        record.deletedAt ? (
          <Tag color="red" className="rounded-full">
            Deleted
          </Tag>
        ) : (
          getProjectStatusTag(status)
        ),
    },
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space size={8}>
          <Avatar size="small" icon={<UserOutlined />} />
          <span className="text-sm font-medium text-slate-700">
            {record.User.email}
          </span>
        </Space>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (text) => (
        <span className="text-sm text-slate-600">{formatDate(text)}</span>
      ),
      width: 180,
    },
    {
      title: "Progress",
      key: "progress",
      width: 120,
      render: (record) => {
        const NOT_REVIEWED = record.countByStatus.find((item) => {
          if (
            item.Status === "NOT_REVIEWED" ||
            item.Status === "TRANSLATED_MT"
          ) {
            return true;
          }
        });

        const aux = NOT_REVIEWED ? NOT_REVIEWED._count : 0;
        if (!record.totalCount) {
          return <Progress percent={0} size="small" />;
        }
        const percentage = parseFloat(
          (((record.totalCount - aux) * 100) / record.totalCount).toFixed(2),
        );

        return <Progress percent={percentage} size="small" />;
      },
    },
    {
      title: "",
      key: "action",
      width: 120,
      render: (record) => {
        return (
          <Space size={6}>
            <Tooltip title="Download file">
              <Button
                size="small"
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => getDownloadLink(record.id)}
                loading={requesting === record.id}
              />
            </Tooltip>
            <ProjectEdit key={record.label} project={record} save={save} />

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
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      className="project-list-card overflow-hidden"
      style={{ marginLeft: 20 }}
    >
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Document workspace
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">Documents</h2>
            <p className="m-0 text-sm text-slate-300">
              Upload, track and review translation documents.
            </p>
          </div>
          <ProjectAdd add={add} refetch={fetchData} />
        </div>
      </div>

      <StatCardGrid ariaLabel="Document statistics">
        <StatCard
          label="Total"
          value={loading ? "—" : data.length}
          hint="All uploaded documents"
          icon={FolderKanban}
          theme="slate"
        />
        <StatCard
          label="Workspaces"
          value={loading ? "—" : workspaceCount}
          hint="Distinct workspaces in use"
          icon={Building2}
          theme="violet"
        />
        <StatCard
          label="Ready"
          value={loading ? "—" : readyProjects}
          hint={
            loading || data.length === 0
              ? "Available for translation"
              : `${readyPercent}% ready to open`
          }
          icon={CircleCheck}
          theme="emerald"
        />
        <StatCard
          label="Processing"
          value={loading ? "—" : pendingProjects}
          hint="Pending pipeline jobs"
          icon={Loader2}
          theme="sky"
          iconSpin={!loading && pendingProjects > 0}
          badges={[
            ...(errorProjects > 0
              ? [{ label: `${errorProjects} errors`, tone: "warning" }]
              : []),
            ...(deletedProjects > 0
              ? [{ label: `${deletedProjects} deleted`, tone: "danger" }]
              : []),
          ]}
        />
      </StatCardGrid>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey={(record) => record.id}
        size="small"
        scroll={{ x: 800 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No projects yet"
            />
          ),
        }}
        rowClassName="align-top"
      />
    </Card>
  );
};

export default ProjectList;
