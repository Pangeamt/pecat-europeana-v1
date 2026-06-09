"use client";
import { Button, Form, Input, Modal, message } from "antd";
import { updateTMRequest } from "@/services/tm.services";

function EditTmForm({ tm, onClose, onUpdated }) {
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    try {
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
    } catch (error) {
      console.error("Failed:", error);
      message.error({ content: "Error updating TM", key: "edit-tm" });
    }
  };

  return (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      layout="horizontal"
      initialValues={{
        name: tm.name || "",
        project: tm.context?.project || "",
        domain: tm.context?.domain || "",
      }}
      onFinish={handleFinish}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Please introduce a name!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Document" name="project">
        <Input />
      </Form.Item>
      <Form.Item label="Domain" name="domain">
        <Input />
      </Form.Item>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </div>
    </Form>
  );
}

export default function EditTmModal({ open, tm, onClose, onUpdated }) {
  return (
    <Modal
      title="Edit TM"
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={null}
    >
      {open && tm ? (
        <EditTmForm key={tm.id} tm={tm} onClose={onClose} onUpdated={onUpdated} />
      ) : null}
    </Modal>
  );
}
