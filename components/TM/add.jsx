import { Button, Divider, Form, Modal, Upload, message } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { tmStore } from "../../store";

const checkFile = (file) => {
    const fileName = file.name.trim().replace(/\s+/g, "");
    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (fileExtension === "tmx") return true
    return false;
};

const TMAdd = ({refetch, user}) => {
  const tmSt = tmStore();
  const { tm } = tmSt;
  const [ form] = Form.useForm();
  const [ isModalOpen, setIsModalOpen] = useState(false);
  const [ adding, setAdding] = useState(false);

  const showModal = () => { setIsModalOpen(true) }
  const handleCancel = () => { 
    form.resetFields();
    setIsModalOpen(false) 
  }

  const handleOk = async () => {
    try {
      form.resetFields();
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
      setAdding(false);
    }
  };

  const props = {
    multiple: true,
    name: "file",
    action: "/api/tm/import",
    headers: {
      authorization: "authorization-text",
    },
    data: (file) => ({
      tm: tm?.id,  // aquí se pasa dinámicamente
    }),
    onChange: async (info) => {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        await refetch(); 
        setIsModalOpen(false);
        form.resetFields();
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    beforeUpload: (file) => {
      const isLt = file.size / 1024 / 1024 < 15;
      if (!isLt) {
        message.error("Files must smaller than 15MB");
        return false;
      }
      
      if (!checkFile(file)) {
        message.error("File type not supported"); 
        return false;
      }
      return true;
    },
    disabled: false,
  };

  return (
    <>
      <Button icon={<PlusOutlined />} type="default" onClick={showModal}>
        {tm ? "Update TM" : "Import TM"}
      </Button>
      <Modal
        title={tm ? "Update TM" : "Import TM"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={adding}
        // footer={null}
      >
        <Divider />
        <Form
          form={form}
          layout="horizontal"
          labelCol={{
            span: 7,
          }}
          wrapperCol={{
            span: 14,
            offset: 2,
          }}
        >
            <Form.Item label="File" >
                <Upload {...props}>
                  <Button
                    icon={<UploadOutlined />}
                  >
                    Select your TMX file
                  </Button>
                </Upload>
            </Form.Item>
          <Divider />
        </Form>
      </Modal>
    </>
  );
};

export default TMAdd;
