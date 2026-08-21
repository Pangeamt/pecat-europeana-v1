"use client";
import { CopyOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Modal, Popconfirm, Space, message } from "antd";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import {
  createTranslatorShareLink,
  getTranslatorShareLink,
  revokeTranslatorShareLink,
} from "@/services/document.services";

export default function TranslatorShareModal({ open, documentId, onClose }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (!open || !documentId) return;
    setLoading(true);
    getTranslatorShareLink(documentId)
      .then((data) => setToken(data?.token ?? null))
      .catch((error) => {
        console.error(error);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [open, documentId]);

  const shareUrl =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/share/tu/${token}`
      : "";

  const handleGenerate = async () => {
    try {
      setSaving(true);
      const data = await createTranslatorShareLink(documentId);
      setToken(data?.token ?? null);
      message.success(t("documents.share.created"));
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || t("documents.share.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success(t("documents.share.copied"));
    } catch (error) {
      console.error(error);
      message.error(t("documents.share.copyError"));
    }
  };

  const handleRevoke = async () => {
    try {
      setSaving(true);
      await revokeTranslatorShareLink(documentId);
      setToken(null);
      message.success(t("documents.share.revoked"));
    } catch (error) {
      console.error(error);
      message.error(
        error?.response?.data?.message || t("documents.share.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={t("documents.share.modalTitle")}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      {token ? (
        <div className="flex flex-col gap-3">
          <Alert
            type="warning"
            showIcon
            message={t("documents.share.activeWarning")}
          />
          <Space.Compact className="w-full">
            <Input readOnly value={shareUrl} />
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              {t("documents.share.copy")}
            </Button>
          </Space.Compact>
          <Popconfirm
            title={t("documents.share.revokeTitle")}
            description={t("documents.share.revokeDescription")}
            onConfirm={handleRevoke}
            okText={t("actions.yes")}
            cancelText={t("actions.no")}
          >
            <Button danger loading={saving}>
              {t("documents.share.revoke")}
            </Button>
          </Popconfirm>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-slate-500">
            {t("documents.share.description")}
          </p>
          <Button
            type="primary"
            loading={loading || saving}
            onClick={handleGenerate}
          >
            {t("documents.share.generate")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
