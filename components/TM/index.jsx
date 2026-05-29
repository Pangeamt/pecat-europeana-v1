"use client";
import { AuditOutlined, CloseCircleTwoTone } from "@ant-design/icons";
import { Button, message } from "antd";
import { useState } from "react";
import { tmStore, userStore } from "@/store";
import { deleteTMRequest, exportTMRequest } from "@/services/tm.services";
import { useTmList } from "./hooks/use-tm-list";
import TmListModal from "./TmListModal";
import EditTmModal from "./EditTmModal";
import StatsButton from "./StatsButton";

const TM = ({ project, tmRequesting }) => {
  const userSt = userStore();
  const tmSt = tmStore();
  const { user } = userSt;
  const { tm, saveTm, clear } = tmSt;
  const { tms, fetching, refetch } = useTmList();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [tmEdit, setTmEdit] = useState(null);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const [prevTmRequesting, setPrevTmRequesting] = useState(tmRequesting);
  if (tmRequesting !== prevTmRequesting) {
    setPrevTmRequesting(tmRequesting);
    if (!tmRequesting && isModalOpen) {
      setIsModalOpen(false);
    }
  }

  const openModalEdit = (record) => {
    setIsModalOpen(false);
    setTmEdit(record);
    setIsModalEditOpen(true);
  };

  const handleCancelEdit = () => {
    setTmEdit(null);
    setIsModalEditOpen(false);
  };

  const handleExport = async (id) => {
    try {
      message.loading({ content: "Export TM...", key: "export-tm" });
      await exportTMRequest(id);
      message.success({
        content: "Export TM successfully!",
        key: "export-tm",
      });
    } catch {
      message.error("Error exporting TM");
    }
  };

  const handleDelete = async (id) => {
    try {
      message.loading({ content: "Updating TM...", key: "del-tm" });
      await deleteTMRequest(id);
      await refetch();
      message.success({ content: "TM deleted successfully!", key: "del-tm" });
    } catch {
      message.error("Error deleting TM");
    }
  };

  return (
    <>
      <div className="mb-2">
        <Button
          className="ml-2"
          icon={<AuditOutlined />}
          type="primary"
          onClick={showModal}
        >
          Translation Memories
        </Button>

        {tm && (
          <div className="flex justify-center">
            <StatsButton projectId={project} tmId={tm.id} />
            <div className="relative mt-4">
              <code className="text-blue-500 underline underline-offset-1">
                {tm.name} - {tm.context.source} - {tm.context.target}
              </code>
              <CloseCircleTwoTone
                onClick={() => clear()}
                className="ml-2 mb-1"
                twoToneColor="#f5222d"
              />
            </div>
          </div>
        )}
      </div>

      <TmListModal
        open={isModalOpen}
        onClose={handleCancel}
        tms={tms}
        fetching={fetching}
        user={user}
        selectedTmId={tm?.id}
        onSelectTm={saveTm}
        onEditTm={openModalEdit}
        onExportTm={handleExport}
        onDeleteTm={handleDelete}
        onRefetch={refetch}
      />

      <EditTmModal
        open={isModalEditOpen}
        tm={tmEdit}
        onClose={handleCancelEdit}
        onUpdated={refetch}
      />
    </>
  );
};

export default TM;
