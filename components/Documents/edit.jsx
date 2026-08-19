import React, { useState } from "react";

import { Modal, Button, Form, Input, Tooltip, message } from "antd";
import { EditOutlined } from "@ant-design/icons";

import { useTranslation } from "@/components/i18n/LanguageProvider";

const DocumentEdit = ({ document, save }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const showModal = () => setIsModalOpen(true);

  const handleOk = async () => {
    try {
      setSending(true);
      const values = await form.validateFields();
      await save({ documentId: document.id, ...values });
      setIsModalOpen(false);
    } catch (errorInfo) {
      if (!errorInfo?.errorFields) {
        message.error(t("documents.editError"));
      }
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => setIsModalOpen(false);

  return (
    <>
      <Tooltip title={t("documents.editTooltip")}>
        <Button
          onClick={showModal}
          size="small"
          type="text"
          icon={<EditOutlined />}
        />
      </Tooltip>
      <Modal
        title={t("documents.editModalTitle")}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={sending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("table.label")}
            name="label"
            initialValue={document.label}
          >
            <Input type="text" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DocumentEdit;
