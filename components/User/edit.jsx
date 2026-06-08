import React, { useState } from "react";

import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Tabs,
  Tooltip,
  Upload,
  message,
} from "antd";
import { EditOutlined } from "@ant-design/icons";

import ImgCrop from "antd-img-crop";

const getCompressedDataUrlFromFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file.originFileObj);
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 256;
        const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      image.src = reader.result;
    };
  });
};

const INFO_TAB = "info";
const PASSWORD_TAB = "password";

const UserEdit = ({ user, save }) => {
  const [infoForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState(INFO_TAB);
  const [fileList, setFileList] = useState([]);

  const onChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.length > 0 ? [newFileList[0]] : []);
    return false;
  };

  const showModal = () => {
    passwordForm.resetFields();
    setFileList([]);
    setActiveTab(INFO_TAB);
    setIsModalOpen(true);
  };

  const handleCancel = () => setIsModalOpen(false);

  const submitInfo = async () => {
    const values = await infoForm.validateFields();
    const payload = { userId: user.id, ...values };
    if (fileList[0]?.originFileObj) {
      payload.image = await getCompressedDataUrlFromFile(fileList[0]);
    }
    await save(payload);
  };

  const submitPassword = async () => {
    const values = await passwordForm.validateFields();
    await save({ userId: user.id, password: values.password });
  };

  const handleOk = async () => {
    try {
      setSending(true);
      if (activeTab === INFO_TAB) {
        await submitInfo();
      } else {
        await submitPassword();
      }
      setIsModalOpen(false);
      message.success("User updated successfully");
    } catch (error) {
      if (error?.errorFields) {
        // Validation error — antd already highlights it.
        return;
      }
      console.error(error);
      message.error(
        error?.response?.data?.error || "Failed to update user",
      );
    } finally {
      setSending(false);
    }
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
    }
    if (!isJpgOrPng || !isLt2M) return Upload.LIST_IGNORE;
    return false;
  };

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };

  const items = [
    {
      key: INFO_TAB,
      label: "Change Info",
      children: (
        <Form
          form={infoForm}
          layout="horizontal"
          {...layout}
          initialValues={{ name: user.name, email: user.email, role: user.role }}
        >
          <Form.Item label="Avatar">
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
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="SUPER">Super</Select.Option>
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="USER">User</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: PASSWORD_TAB,
      label: "Change Password",
      children: (
        <Form form={passwordForm} layout="horizontal" {...layout}>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
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
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The passwords you entered do not match!"),
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      ),
    },
  ];

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
        title="Edit User"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={sending}
        destroyOnClose
      >
        <Divider />
        <Tabs activeKey={activeTab} items={items} onChange={setActiveTab} />
      </Modal>
    </>
  );
};

export default UserEdit;
