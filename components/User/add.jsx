"use client";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Upload,
  message,
} from "antd";
import ImgCrop from "antd-img-crop";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { userStore } from "@/store";

const getCompressedDataUrlFromFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file.originFileObj);
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 256;
        const ratio = Math.min(
          maxSize / image.width,
          maxSize / image.height,
          1,
        );
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

const UserAdd = ({ add }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [fileList, setFileList] = useState([]);
  const { user } = userStore();

  const onChange = ({ fileList: newFileList }) => {
    if (newFileList.length > 0) {
      setFileList([newFileList[0]]);
    } else {
      setFileList([]);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      setAdding(true);
      const values = await form.validateFields();
      delete values.confirm;

      if (fileList[0]?.originFileObj) {
        values.image = await getCompressedDataUrlFromFile(fileList[0]);
      }

      const response = await add(values);
      if (response?.status === 201) {
        message.success(t("users.add.addSuccess"));
      } else {
        message.error(t("users.add.addError"));
      }
      setAdding(false);
      form.resetFields();
      setIsModalOpen(false);
      clear();
    } catch (errorInfo) {
      const errorMessage =
        errorInfo?.response?.data?.message || t("users.add.addError");
      message.error(errorMessage);
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
      message.error(t("users.add.avatarTypeError"));
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(t("users.add.avatarSizeError"));
    }
    if (!isJpgOrPng || !isLt2M) {
      return Upload.LIST_IGNORE;
    }

    // Prevent auto upload; file is sent only on form submit.
    return false;
  };

  return (
    <>
      <Button icon={<PlusOutlined />} type="primary" onClick={showModal}>
        {t("users.add.trigger")}
      </Button>
      <Modal
        title={t("users.add.modalTitle")}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={adding}
      >
        <Divider />
        <Form form={form} layout="horizontal" {...layout}>
          <Form.Item
            label={t("users.add.avatarLabel")}
            key={"empty" || fileList[0].uid}
          >
            <ImgCrop showGrid rotationSlider aspectSlider showReset>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={onChange}
                multiple={false}
                beforeUpload={beforeUpload}
              >
                {fileList.length === 0 && t("users.add.uploadAvatar")}
              </Upload>
            </ImgCrop>
          </Form.Item>

          <Form.Item
            name="name"
            label={t("users.add.nameLabel")}
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
            label={t("users.add.emailLabel")}
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
            label={t("users.add.roleLabel")}
            name="role"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select>
              {user?.role !== "ADMIN" && (
                <Select.Option value="SUPER">
                  {t("users.add.roleSuper")}
                </Select.Option>
              )}
              <Select.Option value="ADMIN">
                {t("users.add.roleAdmin")}
              </Select.Option>
              <Select.Option value="USER">
                {t("users.add.roleUser")}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={t("users.add.passwordLabel")}
            rules={[
              {
                required: true,
                message: t("users.add.passwordRequired"),
              },
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm"
            label={t("users.add.confirmLabel")}
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: t("users.add.confirmRequired"),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(t("users.add.passwordMismatch")),
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
