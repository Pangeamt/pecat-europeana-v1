import React, { useState } from "react";

import { Modal, Button, Form, Input, Divider, Upload, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import ImgCrop from "antd-img-crop";

const getSrcFromFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file.originFileObj);
    reader.onload = () => resolve(reader.result);
  });
};

const UserAdd = ({ add }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [by, setBy] = useState("url");
  const [adding, setAdding] = useState(false);
  const [fileList, setFileList] = useState([]);

  const onChange = ({ fileList: newFileList }) => {
    if (newFileList.length > 0) {
      setFileList([newFileList[0]]);
    } else {
      setFileList([]);
    }

    return false;
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      setAdding(true);
      const values = await form.validateFields();
      values.image = await getSrcFromFile(fileList[0]);
      await add(values);
      setAdding(false);
      form.resetFields();
      setIsModalOpen(false);
      clear();
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
      setAdding(false);
    }
  };

  const clear = () => {
    form.resetFields();
    setFileList([]);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const layout = {
    labelCol: {
      span: 8,
    },
    wrapperCol: {
      span: 16,
    },
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  return (
    <>
      <Button icon={<PlusOutlined />} type="primary" onClick={showModal}>
        Add User
      </Button>
      <Modal
        title="Add User"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={adding}
        footer={by === "file" ? null : undefined}
      >
        <Divider />
        <Form form={form} layout="horizontal" {...layout}>
          <Form.Item label="Avatar" key={"empty" || fileList[0].uid}>
            <ImgCrop showGrid rotationSlider aspectSlider showReset>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={onChange}
                multiple={false}
                beforeUpload={beforeUpload}
              >
                {fileList.length === 0 && "+ Upload"}
              </Upload>
            </ImgCrop>
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              {
                type: "email",
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select>
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="USER">User</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Please confirm your password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The new password that you entered do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserAdd;
