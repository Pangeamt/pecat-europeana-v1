"use client";
import { Button, Form, Input, Modal, message } from "antd";
import { useEffect } from "react";
import { updateTMRequest } from "@/services/tm.services";

export default function EditTmModal({ open, tm, onClose, onUpdated }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (tm) {
      form.setFieldsValue({
        name: tm.name || "",
        project: tm.context?.project || "",
        domain: tm.context?.domain || "",
      });
    }
  }, [tm, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.loading({ content: "Updating TM...", key: "edit-tm" });
      await updateTMRequest({
        id: tm.id,
        name: values.name,
        project: values.project,
        domain: values.domain,
      });
      onClose?.();
      await onUpdated?.();
      form.resetFields();
      message.success({ content: "TM updated!", key: "edit-tm" });
    } catch (errorInfo) {
      console.error("Failed:", errorInfo);
      onClose?.();
      message.error({ content: "Error updating TM", key: "edit-tm" });
    }
  };

  return (
    <Modal
      title="Edit TM"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Return
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Submit
        </Button>,
      ]}
    >
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        layout="horizontal"
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please introduce a name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Project"
          name="project"
          rules={[{ required: true, message: "Please introduce a project!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Domain" name="domain">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
