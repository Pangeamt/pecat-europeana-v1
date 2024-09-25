"use client";

import {
  Avatar,
  Button,
  Card,
  List,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";
import { capitalize, formatDate } from "../../lib/utils";

import Link from "next/link";
import ProjectAdd from "../Project/add";
import ProjectEdit from "../Project/edit";
import axios from "axios";
import { useEffect } from "react";

const { Title } = Typography;

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

const saveProject = async (newProject) => {
  return await axios({
    method: "patch",
    url: "/api/projects",
    data: newProject,
  });
};
const removeProject = async (projectId) => {
  return await axios({
    method: "delete",
    url: `/api/projects`,
    data: { projectId },
  });
};

const addProject = async (newProject) => {
  console.log("newProject", newProject);
  let METHOD = "post";
  if (newProject.url) {
    METHOD = "put";
  }
  return await axios({
    method: METHOD,
    url: "/api/projects",
    data: newProject,
  });
};

const getProjects = async () => {
  return await axios({
    method: "get",
    url: "/api/projects",
  });
};

const ProjectList = () => {
  const [requesting, setRequesting] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRequesting(true);
      const { data } = await getProjects();
      setData(data.docs);
      setRequesting(false);
    } catch (error) {
      console.error(error);
      setRequesting(false);
    }
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

  function verificarPermisoPortapapeles() {
    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state === "granted" || result.state === "prompt") {
        // Permiso concedido o el navegador mostrará un diálogo de solicitud de permiso
        copiarAlPortapapeles("Texto para copiar");
      } else {
        console.log("Permiso para escribir en el portapapeles denegado.");
        // Notificar al usuario o tomar otra acción
      }
    });
  }

  async function copyTextToClipboard(textToCopy) {
    // verificarPermisoPortapapeles();
    const navigator = window.navigator;
    const clipboard = navigator.clipboard;

    if (!clipboard || !clipboard.writeText) {
      console.error(
        "La API del portapapeles no es compatible con este navegador"
      );
      return;
    }

    await clipboard.writeText(textToCopy);
  }

  const getDownloadLink = async (projectId) => {
    try {
      setRequesting(projectId);
      const link = `${baseURL}/api/file/${projectId}`;
      const { data } = await axios.get(link);
      await copyTextToClipboard(
        `${baseURL}/api/file?uuid=${data.uuid}&projectId=${projectId}`
      );

      // await copyTextToClipboard(
      //   `${baseURL}/api/file?uuid=${1}&projectId=${projectId}`
      // );
      message.success("Link copied to clipboard");
      setRequesting("");
    } catch (error) {
      console.error(error);
      setRequesting("");
    }
  };

  const columns = [
    {
      title: "Filename",
      dataIndex: "filename",
      key: "name",
      render: (text, record) => (
        <Link href={`/dashboard/${record.id}/tus`}>{text}</Link>
      ),
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => formatDate(text),
      width: 180,
    },

    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space size="middle">
          <Avatar icon={<UserOutlined />} />
          <strong>{record.User.email}</strong>
        </Space>
      ),
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
        const percentage = parseFloat(
          (((record.totalCount - aux) * 100) / record.totalCount).toFixed(2)
        );

        return <Progress percent={percentage} size="small" />;
      },
    },
    {
      title: "Stats",
      key: "stats",
      render: (record) => {
        return (
          <List size="small" bordered>
            {record.countByStatus.map((status) => {
              return (
                // <div key={status.Status} className="flex justify-between">
                //   <span className="text-xs">
                //     {capitalize({ str: status.Status })}
                //   </span>
                //   <code className="text-black font-semibold">
                //     {status._count}
                //   </code>
                // </div>
                <List.Item
                  key={status.Status}
                  style={{
                    padding: "0 0.5rem",
                  }}
                >
                  <div className="w-full flex justify-between">
                    {capitalize({
                      str:
                        status.Status === "TRANSLATED_MT"
                          ? "NOT REVIEWED"
                          : status.Status,
                    })}
                    <code className="text-black font-semibold">
                      {status._count}
                    </code>
                  </div>
                </List.Item>
              );
            })}
          </List>
          // <div className="">
          //   {record.countByStatus.map((status) => {
          //     return (
          //       <div key={status.Status} className="flex justify-between">
          //         <span className="text-xs">
          //           {capitalize({ str: status.Status })}
          //         </span>
          //         <code className="text-black font-semibold">
          //           {status._count}
          //         </code>
          //       </div>
          //     );
          //   })}
          //   <div key="total" className="flex justify-between">
          //     <span className="text-xs">TOTAL</span>
          //     <code className="text-black font-semibold">
          //       {record.totalCount}
          //     </code>
          //   </div>
          // </div>
        );
      },
    },

    {
      title: "",
      key: "action",
      width: 120,
      render: (record) => {
        return (
          <div className="flex justify-end">
            <Tooltip title="Generate Download link">
              <Button
                size="small"
                type="default"
                shape="circle"
                icon={<DownloadOutlined />}
                onClick={() => getDownloadLink(record.id)}
                loading={requesting === record.id}
                className="mr-2"
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
      title="Projects"
      extra={<ProjectAdd add={add} refetch={fetchData} />}
      className="project-list-card"
      style={{ marginLeft: 20 }}
    >
      {/* <div className="mb-4">
        <Title level={5}>Projects</Title>
      </div> */}
      <Table
        loading={requesting}
        columns={columns}
        dataSource={data}
        rowKey={(record) => record.id}
        size="small"
        scroll={{ x: 800 }}
      />
    </Card>
  );
};

export default ProjectList;
