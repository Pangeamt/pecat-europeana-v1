"use client";
import { Button, Checkbox, Divider, Modal, Radio } from "antd";
import { useState } from "react";
import { tmStore } from "@/store";
import TMAdd from "./add";
import TmTable from "./TmTable";
import CreateTmForm from "./CreateTmForm";

export default function TmListModal({
  open,
  onClose,
  tms,
  fetching,
  user,
  selectedTmId,
  onSelectTm,
  onEditTm,
  onExportTm,
  onDeleteTm,
  onRefetch,
}) {
  const tmSt = tmStore();
  const { config, setConfig } = tmSt;
  const [view, setView] = useState("list");

  const onChangeRadio = (e) =>
    setConfig({ ...config, value: e.target.value });
  const onChange = (e) => setConfig({ ...config, update: e.target.checked });

  const backToList = async () => {
    await onRefetch?.();
    setView("list");
  };

  return (
    <Modal
      title={view === "list" ? "Translation Memories" : "Create New TM"}
      open={open}
      footer={null}
      width={1000}
      onCancel={onClose}
    >
      {view === "list" && (
        <>
          <div className="flex justify-between">
            <div className="flex justify-start tm-checkbox">
              <Checkbox checked={config.update} onChange={onChange}>
                Update Translation Memories
              </Checkbox>
              {config.update && (
                <div className="mb-2 border p-1 rounded-lg">
                  <Radio.Group onChange={onChangeRadio} value={config.value}>
                    <Radio value={1}>Update Tu</Radio>
                    <Radio value={2}>Append Tu</Radio>
                  </Radio.Group>
                </div>
              )}
            </div>
            <div>
              <Button onClick={() => setView("form")} className="mb-2 mr-2">
                Create New TM
              </Button>
              <TMAdd refetch={onRefetch} user={user} />
            </div>
          </div>

          <TmTable
            tms={tms}
            fetching={fetching}
            selectedTmId={selectedTmId}
            onSelect={onSelectTm}
            onEdit={onEditTm}
            onExport={onExportTm}
            onDelete={onDeleteTm}
          />
        </>
      )}

      {view === "form" && (
        <CreateTmForm
          user={user}
          onBack={backToList}
          onCreated={async () => {
            await onRefetch?.();
            setView("list");
          }}
        />
      )}
    </Modal>
  );
}
