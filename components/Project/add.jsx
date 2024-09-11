import React, { useState } from "react";

import {
  Modal,
  Button,
  Form,
  Input,
  Radio,
  Divider,
  Upload,
  message,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

const ProjectAdd = ({ add, refetch }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [by, setBy] = useState("url");
  const [adding, setAdding] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      setAdding(true);
      const values = await form.validateFields();
      await add.mutateAsync(values);
      setAdding(false);
      form.resetFields();
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
      setAdding(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const props = {
    multiple: true,
    name: "file",
    action: "/api/projects",
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        refetch();
        setIsModalOpen(false);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <>
      <Button icon={<PlusOutlined />} type="primary" onClick={showModal}>
        Add Project
      </Button>
      <Modal
        title="Add Project"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={adding}
        footer={by === "file" ? null : undefined}
      >
        <Divider />
        <Form form={form} layout="horizontal">
          <Form.Item label="By">
            <Radio.Group
              defaultValue={by}
              onChange={(event) => setBy(event.target.value)}
            >
              <Radio value="url">Url</Radio>

              <Radio value="file">File/s</Radio>
            </Radio.Group>
          </Form.Item>
          {by === "file" && (
            <Form.Item label="File" name="file">
              <Upload {...props}>
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
            </Form.Item>
          )}
          {by === "url" && (
            <Form.Item
              label="Mint Url"
              name="url"
              rules={[
                { required: true, type: "url", message: "Please input Url!" },
              ]}
            >
              <Input type="url" />
            </Form.Item>
          )}
          <Divider />
        </Form>
      </Modal>
    </>
  );
};

export default ProjectAdd;
