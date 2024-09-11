import React, { useState } from "react";

import {
  Modal,
  Button,
  Form,
  Input,
  Divider,
  Tooltip,
  message,
  Select,
  Upload,
  Tabs,
} from "antd";
import { EditOutlined } from "@ant-design/icons";

import ImgCrop from "antd-img-crop";

const getSrcFromFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file.originFileObj);
    reader.onload = () => resolve(reader.result);
  });
};

const UserEdit = ({ user, save }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [passView, setPassView] = useState("1");

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
      setSending(true);
      const values = await form.validateFields();
      if (passView === "1") {
        values.image = await getSrcFromFile(fileList[0]);
      } else {
        delete values.confirm;
      }

      await save({ userId: user.id, ...values });
      setSending(false);
      form.resetFields();
      setIsModalOpen(false);
      clear();
      message.success("User updated successfully");
    } catch (errorInfo) {
      message.error("Failed to update user");
      setSending(false);
    }
  };

  const clear = () => {
    form.resetFields();
    setFileList([]);
    setPassView("1");
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

  const onChangeTab = (key) => {
    setPassView(key);
  };
  const items = [
    {
      key: "1",
      label: "Change Info",
      children: (
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
            initialValue={user.name}
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
            initialValue={user.email}
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
            initialValue={user.role}
          >
            <Select>
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="USER">User</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: "Change Password",
      children: (
        <Form form={form} layout="horizontal" {...layout}>
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
      >
        <Divider />
        <Tabs
          defaultActiveKey={passView}
          items={items}
          onChange={onChangeTab}
        />
      </Modal>
    </>
  );
};

export default UserEdit;
