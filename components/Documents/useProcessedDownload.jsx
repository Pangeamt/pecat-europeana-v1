"use client";

import { Modal, message } from "antd";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { getDocumentShareLink } from "@/services/document.services";
import { userStore } from "@/store";

// "Download processed", the same everywhere it is offered. The server only
// hands the file out when every segment is locked or confirmed; otherwise it
// answers with what is missing. An admin is then asked whether to take a
// PARTIAL delivery anyway; everybody else is told what is left.
export const useProcessedDownload = (baseURL) => {
  const { t } = useTranslation();
  const { user } = userStore();
  const isAdmin = ["ADMIN", "SUPER"].includes(user?.role);

  const download = async (documentId, { partial = false, onBusy } = {}) => {
    try {
      onBusy?.(true);
      const link = await getDocumentShareLink(documentId, baseURL, { partial });
      window.location.assign(link);
    } catch (error) {
      const body = error?.response?.data;
      if (body?.code !== "DOCUMENT_INCOMPLETE") {
        console.error(error);
        message.error(body?.message || t("documents.downloadError"));
        return;
      }
      const counts = body.data ?? {};
      const missing = t(
        counts.rejected ? "documents.incompleteWithRejected" : "documents.incomplete",
        { pending: counts.pending ?? "?", total: counts.total ?? "?", rejected: counts.rejected ?? 0 },
      );
      if (!isAdmin || partial) {
        message.warning(missing);
        return;
      }
      Modal.confirm({
        title: t("documents.partialTitle"),
        content: `${missing} ${t("documents.partialQuestion")}`,
        okText: t("documents.partialOk"),
        cancelText: t("documents.partialCancel"),
        onOk: () => download(documentId, { partial: true, onBusy }),
      });
    } finally {
      onBusy?.(false);
    }
  };

  return download;
};
