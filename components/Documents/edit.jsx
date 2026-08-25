import React, { useState } from "react";

import { Modal, Form, Input, message } from "antd";

import { useTranslation } from "@/components/i18n/LanguageProvider";

// Controlled label-edit modal: the row's actions dropdown opens it by setting
// the target document; there is no inline trigger button anymore.
const DocumentEdit = ({ document, save, open, onClose }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);

  const handleOk = async () => {
    try {
      setSending(true);
      const values = await form.validateFields();
      await save({ documentId: document.id, ...values });
      onClose?.();
    } catch (errorInfo) {
      if (!errorInfo?.errorFields) {
        message.error(t("documents.editError"));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title={t("documents.editModalTitle")}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={sending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t("table.label")}
          name="label"
          initialValue={document?.label}
        >
          <Input type="text" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DocumentEdit;
