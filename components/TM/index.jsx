import {
  AuditOutlined,
  CloseCircleTwoTone,
  PieChartOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Table,
  message,
} from "antd";
import React, { useEffect, useState } from "react";
import { tmStore, userStore } from "../../store";

import axios from "axios";
import locales from "../../lib/locales.json";

const languages = locales;

const TM_HOST = process.env.NEXT_PUBLIC_TM_HOST;

const getLocaleCode = (locale) => {
  const language = Object.keys(languages).find(
    (key) => languages[key][0] === locale
  );
  return language;
};

const addTMRequest = async (tm) => {
  return await axios({
    method: "post",
    url: `${TM_HOST}/tm`,
    data: tm,
  });
};

const TM = ({ project, tmRequesting }) => {
  const userSt = userStore();
  const tmSt = tmStore();
  const { user } = userSt;
  const { tm, saveTm, clear, config, setConfig } = tmSt;

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tms, setTms] = useState([]);
  const [view, setView] = useState("list");

  const [requesting, setRequesting] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTm(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!tmRequesting) {
      handleCancel();
    }
  }, [tmRequesting]);

  const fetchTm = async (user) => {
    setFetching(true);
    const { data } = await axios.get(`${TM_HOST}/tm`, {
      params: {
        user: user,
      },
    });
    setTms(data.docs);
    setFetching(false);
  };

  const add = (tm) => {
    return addTMRequest(tm);
  };

  const addTM = async () => {
    try {
      const values = await form.validateFields();
      const userEmail = user ? user?.email : "";
      const data = {
        name: values.name,
        user: userEmail,
        project: values.project,
        domain: values.domain,
        source: getLocaleCode(values.source),
        target: getLocaleCode(values.target),
      };
      message.loading({ content: "Creating TM...", key: "add-tm" });
      await add(data);
      await fetchTm(userEmail);
      form.resetFields();
      message.success({ content: "TM created!", key: "add-tm" });
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
      message.error({ content: "Error creating TM", key: "add-tm" });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onChange = (e) => {
    console.log(`checked = ${e.target.checked}`);
    setConfig({ ...config, update: e.target.checked });
  };

  const onChangeRadio = (e) => {
    console.log("radio checked", e.target.value);
    setConfig({ ...config, value: e.target.value });
  };

  const columns = [
    {
      title: "No.",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => {
        return <code className="flex justify-center">{index + 1}</code>;
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Project",
      key: "project",
      render: (record) => {
        return <code>{record.context.project}</code>;
      },
    },
    {
      title: "Domain",
      key: "domain",
      render: (record) => {
        return <code>{record.context.domain}</code>;
      },
    },
    {
      title: "Source",
      key: "source",
      render: (record) => {
        return <code>{record.context.source}</code>;
      },
    },
    {
      title: "Target",
      key: "target",
      render: (record) => {
        return <code>{record.context.target}</code>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => {
        // Use it
        return (
          <Button
            type={tm && tm.id === record.id ? "primary" : "default"}
            onClick={() => {
              saveTm(record);
            }}
            size="small"
          >
            {tm && tm.id === record.id ? "Selected" : "Select"}
          </Button>
        );
      },
    },
  ];

  const getStats = async () => {
    setRequesting(true);
    try {
      const response = await axios.get(`/api/projects/logs`, {
        params: {
          projectId: project,
          tmId: tm.id,
        },
      });
      const stats = response.data.stats;

      Modal.info({
        title: "TM Analysis",
        width: 500,
        content: (
          <>
            <Divider className="my-1" />

            <Row gutter={[8, 8]}>
              <Col span={24} className="flex justify-between">
                <strong>No match </strong> {stats["noMatch"]}
              </Col>
              <Col span={24} className="flex justify-between">
                <strong>50% - 74% </strong> {stats["50To74"]}
              </Col>
              <Col span={24} className="flex justify-between">
                <strong>75% - 84%</strong> {stats["75To84"]}
              </Col>
              <Col span={24} className="flex justify-between">
                <strong>85% - 94% </strong> {stats["85To94"]}
              </Col>
              <Col span={24} className="flex justify-between">
                <strong>95% - 99% </strong> {stats["95To99"]}
              </Col>
              <Col span={24} className="flex justify-between">
                <strong>100% </strong> {stats["100"]}
              </Col>
            </Row>
            <Divider className="my-1" />
          </>
        ),
        onOk() {},
      });
    } catch (error) {
      console.error(error.message);
    }
    setRequesting(false);
  };
  return (
    <>
      <div className="mb-2">
        <Button
          className="ml-2"
          icon={<AuditOutlined />}
          type="primary"
          onClick={showModal}
        >
          Translation Memories
        </Button>

        {tm && (
          <div className="flex justify-center">
            <Button
              className="ml-2 mr-2 mt-1"
              icon={<PieChartOutlined />}
              type="primary"
              onClick={getStats}
              loading={requesting}
            />
            <div className="relative mt-4">
              <code className="text-blue-500 underline underline-offset-1 ">
                {tm.name} - {tm.context.source} - {tm.context.target}
              </code>
              <CloseCircleTwoTone
                onClick={() => clear()}
                className="ml-2 mb-1 "
                twoToneColor="#f5222d"
              />
            </div>
          </div>
        )}
      </div>

      <Modal
        title={view === "list" ? "Translation Memories" : "Create New TM"}
        open={isModalOpen}
        footer={null}
        width={1000}
        onCancel={handleCancel}
      >
        {view === "list" && (
          <>
            <div className="flex justify-between">
              <div className="flex justify-start tm-checkbox">
                <Checkbox checked={config.update} onChange={onChange}>
                  Update Translation Memories
                </Checkbox>
                {config.update && (
                  <div className="mb-2 border p-1 rounded-lg">
                    <Radio.Group onChange={onChangeRadio} value={config.value}>
                      <Radio value={1}>Update Tu</Radio>
                      <Radio value={2}>Append Tu</Radio>
                    </Radio.Group>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  setView("form");
                }}
                className="mb-2 float-right"
              >
                Create New TM
              </Button>
            </div>

            <Table
              loading={fetching}
              dataSource={tms}
              columns={columns}
              size="small"
            />
          </>
        )}
        {view === "form" && (
          <>
            <Button
              onClick={async () => {
                await fetchTm(user.email);
                setView("list");
              }}
              className="mb-2 float-right"
            >
              Go to List
            </Button>
            <Divider />
            <Form
              form={form}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
              layout="horizontal"
              onFinish={addTM}
            >
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Please introduce a name!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Project"
                name="project"
                rules={[
                  {
                    required: true,
                    message: "Please introduce a project!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="Domain" name="domain">
                <Input />
              </Form.Item>
              <Form.Item
                label="Source"
                name="source"
                rules={[
                  {
                    required: true,
                    message: "Please select a source language",
                  },
                ]}
              >
                <Select showSearch>
                  {Object.keys(languages).map((locale) => (
                    <Select.Option key={locale} value={languages[locale][0]}>
                      {languages[locale][0]}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="target"
                label="Target"
                rules={[
                  {
                    required: true,
                    message: "Please select a target language",
                  },
                ]}
              >
                <Select showSearch>
                  {Object.keys(languages).map((locale) => (
                    <Select.Option key={locale} value={languages[locale][0]}>
                      {languages[locale][0]}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
                <Button type="primary" htmlType="submit">
                  Create
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </>
  );
};

export default TM;
