import { ALLOWED_FILE_EXTENSIONS, checkFile } from "../../lib/utils";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Upload,
  message,
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import React, { useState } from "react";

import { EUROPEAN_LANGUAGES } from "../../lib/utils";

const ProjectAdd = ({ add, refetch }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [by, setBy] = useState("url");
  const [mt, setMt] = useState(false);

  const [src, setSrc] = useState(null);
  const [tgt, setTgt] = useState(null);

  const [adding, setAdding] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      setAdding(true);
      const values = await form.validateFields();
      await add(values);
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
    data: {
      mt,
      src,
      tgt,
    },
    onChange(info) {
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
        refetch();
        setIsModalOpen(false);
        form.resetFields();
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    beforeUpload: (file) => {
      const isLt = file.size / 1024 / 1024 < 500;
      if (!isLt) {
        message.error("Files must smaller than 500MB");
        return false;
      }
      const extension = checkFile(file);
      if (!extension) {
        message.error("Only files with correct format (JSON or XLF)");
        return false;
      }
      return true;
    },
    disabled: mt && (!src || !tgt),
  };

  const onChangeSrc = (value) => {
    setSrc(value);
  };

  const onChangeTgt = (value) => {
    setTgt(value);
  };

  const getTgtOptions = (src) => {
    if (src) {
      return Object.keys(EUROPEAN_LANGUAGES)
        .filter((key) => key !== src)
        .map((key) => ({
          value: key,
          label: EUROPEAN_LANGUAGES[key],
        }));
    }
    return [];
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
            <>
              <Form.Item name="mt" label="Add MT" initialValue={mt}>
                <Radio.Group onChange={(e) => setMt(e.target.value)}>
                  <Radio value={false}> No </Radio>
                  <Radio value={true}> Yes </Radio>
                </Radio.Group>
              </Form.Item>
              {mt && (
                <>
                  <Form.Item
                    label="Source language"
                    name="src"
                    rules={[
                      {
                        required: true,
                        message: "Please input source language!",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="Select a language"
                      optionFilterProp="label"
                      onChange={onChangeSrc}
                      // onSearch={onSearch}
                      options={Object.keys(EUROPEAN_LANGUAGES).map((key) => ({
                        value: key,
                        label: EUROPEAN_LANGUAGES[key],
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Target language"
                    name="tgt"
                    rules={[
                      {
                        required: true,
                        message: "Please input target language!",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="Select a language"
                      optionFilterProp="label"
                      onChange={onChangeTgt}
                      // onSearch={onSearch}
                      options={getTgtOptions(src)}
                      disabled={!src}
                    />
                  </Form.Item>
                </>
              )}
              <Form.Item label="File" name="file">
                <Upload {...props}>
                  <Button
                    disabled={mt && (!src || !tgt)}
                    icon={<UploadOutlined />}
                  >
                    Select File
                  </Button>
                </Upload>
              </Form.Item>
            </>
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
