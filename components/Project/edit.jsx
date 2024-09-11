import React, { useState } from "react";

import { Modal, Button, Form, Input, Divider, Tooltip, message } from "antd";
import { EditOutlined } from "@ant-design/icons";

const ProjectEdit = ({ project, save }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      setSending(true);
      const values = await form.validateFields();

      await save({ projectId: project.id, ...values });
      setSending(false);
      form.resetFields();
      setIsModalOpen(false);
    } catch (errorInfo) {
      message.error("Failed to update project");
      setSending(false);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Tooltip title="Edit">
        <Button
          onClick={showModal}
          size="small"
          type="primary"
          shape="circle"
          icon={<EditOutlined />}
          className="mr-2"
        />
      </Tooltip>
      <Modal
        title="Edit Project"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={sending}
      >
        <Divider />
        <Form form={form} layout="horizontal">
          <Form.Item label="Label" name="label" initialValue={project.label}>
            <Input type="text" />
          </Form.Item>
          <Divider />
        </Form>
      </Modal>
    </>
  );
};

export default ProjectEdit;
