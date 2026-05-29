"use client";
import { Button, Form, Input, Modal, message } from "antd";
import { updateGlossaryRequest } from "@/services/glossary.services";

function EditGlossaryForm({ glossary, onClose, onUpdated }) {
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    try {
      message.loading({ content: "Updating glossary...", key: "edit-glossary" });
      await updateGlossaryRequest({
        id: glossary.id,
        name: values.name,
        project: values.project,
        domain: values.domain,
      });
      onClose?.();
      await onUpdated?.();
      form.resetFields();
      message.success({ content: "Glossary updated!", key: "edit-glossary" });
    } catch (error) {
      console.error("Failed:", error);
      message.error({ content: "Error updating glossary", key: "edit-glossary" });
    }
  };

  return (
    <Form
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      layout="horizontal"
      initialValues={{
        name: glossary.name || "",
        project: glossary.context?.project || "",
        domain: glossary.context?.domain || "",
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
      <Form.Item label="Project" name="project">
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

export default function EditGlossaryModal({ open, glossary, onClose, onUpdated }) {
  return (
    <Modal
      title="Edit Glossary"
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={null}
    >
      {open && glossary ? (
        <EditGlossaryForm
          key={glossary.id}
          glossary={glossary}
          onClose={onClose}
          onUpdated={onUpdated}
        />
      ) : null}
    </Modal>
  );
}
