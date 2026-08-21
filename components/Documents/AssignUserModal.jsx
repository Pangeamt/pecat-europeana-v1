"use client";
import { Modal, Select, message } from "antd";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { assignDocumentUser } from "@/services/document.services";
import { getMembersOfWorkspace } from "@/services/workspace.services";

export default function AssignUserModal({
  open,
  documentId,
  role,
  workspaceId,
  currentUserId,
  onClose,
  onSaved,
}) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !workspaceId) return;
    setSelectedUserId(currentUserId ?? null);
    setLoadingMembers(true);
    getMembersOfWorkspace(workspaceId)
      .then((data) => setMembers(data?.members ?? []))
      .catch((error) => {
        console.error(error);
        setMembers([]);
      })
      .finally(() => setLoadingMembers(false));
  }, [open, workspaceId, currentUserId]);

  const handleOk = async () => {
    try {
      setSaving(true);
      await assignDocumentUser(documentId, role, selectedUserId ?? null);
      message.success(t("documents.assign.saved"));
      onSaved?.();
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || t("documents.assign.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const roleLabel =
    role === "translator"
      ? t("documents.assign.translator")
      : t("documents.assign.reviewer");

  return (
    <Modal
      title={t("documents.assign.modalTitle", { role: roleLabel })}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      destroyOnHidden
    >
      <Select
        className="w-full"
        showSearch
        allowClear
        loading={loadingMembers}
        placeholder={t("documents.assign.selectPlaceholder")}
        optionFilterProp="label"
        value={selectedUserId}
        onChange={setSelectedUserId}
        options={members.map((member) => ({
          value: member.id,
          label: `${member.name} · ${member.email}`,
        }))}
      />
    </Modal>
  );
}
