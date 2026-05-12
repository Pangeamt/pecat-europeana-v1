"use client";
import {
  DatabaseOutlined,
  PlusOutlined,
  SettingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Slider,
  Tag,
  Upload,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import locales from "@/lib/locales.json";
import { checkFile } from "../../lib/utils";
import { fetchTMRequest } from "@/services/tm.services";
import { userStore } from "@/store";

const { Dragger } = Upload;

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
      <Button
        icon={<PlusOutlined />}
        type="primary"
        onClick={showModal}
        className="shadow-sm"
        style={{
          background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
          border: 0,
        }}
      >
        Add Project
      </Button>
      <Modal
        title="Add Project"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={adding}
        footer={by === "file" ? null : undefined}
        width={760}
        centered
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        <div className="relative overflow-hidden rounded-lg bg-slate-950 px-5 py-4 text-white">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="relative">
            <div className="text-lg font-semibold leading-tight">
              Configure project
            </div>
            <div className="mt-1 text-sm text-slate-300">
              Languages, TMs and upload in one step.
            </div>
          </div>
        </div>
        <Form form={form} layout="vertical" className=" p-4">
          {by === "file" && (
            <div className="space-y-3">
              {mt && (
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Languages
                      </div>
                      <div className="mt-1 font-semibold text-slate-900">
                        Source and target
                      </div>
                    </div>
                    <Tag color={src && tgt ? "green" : "default"}>
                      {src && tgt ? `${src} -> ${tgt}` : "Required"}
                    </Tag>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <DatabaseOutlined />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Translation memories
                    </div>
                    <div className="text-xs text-slate-500">
                      Filtered by language pair.
                    </div>
                  </div>
                </div>
                <Form.Item
                  name="tm_ids"
                  label="Matching TMs"
                  initialValue={tmIds}
                >
                  <Select
                    mode="multiple"
                    size="large"
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
                {src && tgt && filteredTms.length === 0 && (
                  <Alert
                    type="info"
                    showIcon
                    message="No compatible memories found"
                  />
                )}
                <div className="grid grid-cols-1 gap-2">
                  <Form.Item
                    name="tm_mode"
                    label="TM mode"
                    initialValue={tmMode}
                  >
                    <Radio.Group
                      buttonStyle="solid"
                      optionType="button"
                      onChange={(e) => setTmMode(e.target.value)}
                    >
                      <Radio.Button value="standard">Standard</Radio.Button>
                      <Radio.Button value="smart">Smart</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    name="tm_threshold"
                    label={`TM threshold: ${Math.round(tmThreshold * 100)}%`}
                    initialValue={tmThreshold}
                  >
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      marks={{ 0: "0%", 0.75: "75%", 1: "100%" }}
                      onChange={(value) => setTmThreshold(value ?? 0)}
                      value={tmThreshold}
                    />
                  </Form.Item>
                </div>
              </section>

              <section className="rounded-xl border border-dashed border-blue-200 bg-white p-4 shadow-sm">
                <Dragger {...props}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Drop file or browse</p>
                  <p className="ant-upload-hint">
                    Up to 500MB. Select languages first.
                  </p>
                </Dragger>
              </section>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ProjectAdd;
