"use client";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
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
  Slider,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import locales from "@/lib/locales.json";
import { checkFile } from "../../lib/utils";
import { fetchTMRequest } from "@/services/tm.services";
import { userStore } from "@/store";

const languageOptions = Object.keys(locales).map((code) => ({
  value: code,
  label: locales[code][0],
}));

const ProjectAdd = ({ add, refetch }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [by, setBy] = useState("file");
  const [mt, setMt] = useState(true);
  const [tmMode, setTmMode] = useState("standart");
  const [tmThreshold, setTmThreshold] = useState(0.75);
  const [tmIds, setTmIds] = useState([]);
  const [tms, setTms] = useState([]);
  const [src, setSrc] = useState(null);
  const [tgt, setTgt] = useState(null);
  const [adding, setAdding] = useState(false);
  const { user } = userStore();
  const filteredTms = useMemo(() => {
    if (!src || !tgt) return [];

    return tms.filter((tm) => {
      const tmSource = tm.sourceLanguage ?? tm.context?.source;
      const tmTarget = tm.targetLanguage ?? tm.context?.target;
      return tmSource === src && tmTarget === tgt;
    });
  }, [src, tgt, tms]);

  useEffect(() => {
    if (!isModalOpen || !user) return;

    const query =
      user.role === "SUPER"
        ? { size: 1000 }
        : user.workspaceId
          ? { workspaceId: user.workspaceId, size: 1000 }
          : null;

    if (!query) return;

    fetchTMRequest(query)
      .then((response) => setTms(response?.docs ?? []))
      .catch((error) => {
        console.error(error);
        setTms([]);
      });
  }, [isModalOpen, user]);

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const syncTmSelection = (nextSrc, nextTgt) => {
    const validTmIds = new Set(
      tms
        .filter((tm) => {
          const tmSource = tm.sourceLanguage ?? tm.context?.source;
          const tmTarget = tm.targetLanguage ?? tm.context?.target;
          return (
            nextSrc && nextTgt && tmSource === nextSrc && tmTarget === nextTgt
          );
        })
        .map((tm) => tm.id),
    );
    const nextTmIds = tmIds.filter((id) => validTmIds.has(id));
    setTmIds(nextTmIds);
    form.setFieldValue("tm_ids", nextTmIds);
  };
  const onChangeSrc = (value) => {
    setSrc(value);
    syncTmSelection(value, tgt);
  };
  const onChangeTgt = (value) => {
    setTgt(value);
    syncTmSelection(src, value);
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

  const props = {
    multiple: true,
    name: "file",
    action: "/api/projects",
    headers: {
      authorization: "authorization-text",
    },
    data: () => ({
      mt,
      src,
      tgt,
      tm_mode: tmMode,
      tm_threshold: tmThreshold,
      tm_ids: JSON.stringify(tmIds),
    }),
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
        message.error("File type not supported");
        return false;
      }
      return true;
    },
    disabled: mt && (!src || !tgt),
  };

  const getTgtOptions = (src) => {
    if (src) {
      return languageOptions.filter((option) => option.value !== src);
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
          {by === "file" && (
            <>
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
                      options={languageOptions}
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
                      disabled={!src}
                      options={getTgtOptions(src)}
                    />
                  </Form.Item>
                </>
              )}

              <Form.Item name="tm_ids" label="TMs" initialValue={tmIds}>
                <Select
                  mode="multiple"
                  placeholder="Select translation memories"
                  disabled={!src || !tgt}
                  notFoundContent={
                    src && tgt
                      ? "No matching memories for this language pair"
                      : "Select source and target first"
                  }
                  optionFilterProp="label"
                  onChange={setTmIds}
                  options={filteredTms.map((tm) => ({
                    value: tm.id,
                    label: tm.name,
                  }))}
                />
              </Form.Item>

              <Form.Item name="tm_mode" label="TM mode" initialValue={tmMode}>
                <Radio.Group onChange={(e) => setTmMode(e.target.value)}>
                  <Radio value="standart">Standart</Radio>
                  <Radio value="smart">Smart</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="tm_threshold"
                label="TM threshold"
                initialValue={tmThreshold}
              >
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => setTmThreshold(value ?? 0)}
                  value={tmThreshold}
                />
              </Form.Item>

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
