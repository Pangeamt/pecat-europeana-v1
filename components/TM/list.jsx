"use client";
import { Button, Card, Modal, Space, message, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import { tmStore, userStore } from "@/store";
import {
  deleteTMRequest,
  exportTMRequest,
  fetchTMRequest,
} from "@/services/tm.services";
import TMAdd from "./add";
import CreateTmForm from "./CreateTmForm";
import EditTmModal from "./EditTmModal";

const TmList = () => {
  const { user } = userStore();
  const { tm, saveTm } = tmStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tmEdit, setTmEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tms, setTms] = useState([]);

  const fetchTms = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        setTms([]);
        return;
      }

      const query =
        user.role === "SUPER"
          ? { size: 1000 }
          : user.workspaceId
            ? { workspaceId: user.workspaceId, size: 1000 }
            : null;

      if (!query) {
        setTms([]);
        return;
      }

      const response = await fetchTMRequest(query);
      setTms(response?.docs ?? []);
    } catch (error) {
      console.error(error);
      message.error("Error fetching TMs");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchTms();
  }, [fetchTms]);

  const handleExport = async (id) => {
    try {
      message.loading({ content: "Exporting TM...", key: "export-tm" });
      await exportTMRequest(id);
      message.success({
        content: "TM exported successfully!",
        key: "export-tm",
      });
    } catch {
      message.error({ content: "Error exporting TM", key: "export-tm" });
    }
  };

  const handleDelete = async (id) => {
    try {
      message.loading({ content: "Deleting TM...", key: "delete-tm" });
      await deleteTMRequest(id);
      if (tm?.id === id) saveTm(null);
      await fetchTms();
      message.success({
        content: "TM deleted successfully!",
        key: "delete-tm",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: error?.response?.data?.error || "Error deleting TM",
        key: "delete-tm",
      });
    }
  };

  const openEditModal = (record) => {
    setTmEdit(record);
    setIsEditOpen(true);
  };

  const columns = [
    {
      title: "No.",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => (
        <code className="flex justify-center">{index + 1}</code>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Project",
      key: "project",
      render: (record) => <code>{record.context.project}</code>,
    },
    {
      title: "Domain",
      key: "domain",
      render: (record) => <code>{record.context.domain}</code>,
    },
    {
      title: "Source",
      key: "source",
      render: (record) => <code>{record.context.source}</code>,
    },
    {
      title: "Target",
      key: "target",
      render: (record) => <code>{record.context.target}</code>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <div>
          <Button
            className="ml-2"
            icon={<EditOutlined />}
            type="default"
            onClick={() => openEditModal(record)}
            size="small"
          />

          <Button
            className="ml-2"
            type="default"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(record.id)}
            size="small"
          />

          <Button
            className="ml-2 text-red-500 ant-btn-dangerous"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Translation Memories"
        style={{ marginLeft: 20 }}
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setIsCreateOpen(true)}
            >
              Create TM
            </Button>
            <TMAdd refetch={fetchTms} user={user} />
          </Space>
        }
      >
        <Table
          dataSource={tms}
          columns={columns}
          loading={loading}
          rowKey={(record) => record.id}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title="Create Translation Memory"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        width={900}
      >
        <CreateTmForm
          user={user}
          onBack={() => setIsCreateOpen(false)}
          onCreated={async () => {
            await fetchTms();
            setIsCreateOpen(false);
          }}
        />
      </Modal>

      <EditTmModal
        open={isEditOpen}
        tm={tmEdit}
        onClose={() => {
          setTmEdit(null);
          setIsEditOpen(false);
        }}
        onUpdated={async () => {
          await fetchTms();
        }}
      />
    </>
  );
};

export default TmList;
