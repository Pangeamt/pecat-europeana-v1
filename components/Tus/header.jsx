import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Col,
  Modal,
  Progress,
  Radio,
  Row,
  Space,
  Table,
  Typography,
} from "antd";
import axios from "axios";
import { useParams } from "next/navigation";
import PropTypes from "prop-types";
import { InfoCircleOutlined, LoadingOutlined } from "@ant-design/icons";

import TM from "../../components/TM";
import TusTm from "../../components/TM/tus";
import { tmStore, userStore } from "../../store";

const { Text } = Typography;

const getTmTus = async (params) => {
  return axios.get(`${process.env.NEXT_PUBLIC_TM_HOST}/tu`, {
    params: {
      ...params,
    },
  });
};

const HeaderTus = ({
  stats,
  percentage,
  selectedRow,
  selectedText,
  changeTextInTextarea,
  setHeight,
  requesting,
}) => {
  const params = useParams();
  const userSt = userStore();
  const tmSt = tmStore();
  const { user } = userSt;
  const { tm, tu: tmTu, saveTu } = tmSt;
  const [view, setView] = useState("tms");
  const [dataSource, setDataSource] = useState([
    {
      key: "1",
      edited: <LoadingOutlined />,
      originalAccepted: <LoadingOutlined />,
      translated_mt: <LoadingOutlined />,
      notReviewed: <LoadingOutlined />,
      rejected: <LoadingOutlined />,
      progress: (
        <Progress className="px-4" percent={0} size="small" status="active" />
      ),
    },
  ]);

  const [tmTus, setTmTus] = useState([]);
  const [tmTusText, setTmTusText] = useState([]);
  const [tmRequesting, setTmRequesting] = useState(false);

  useEffect(() => {
    if (!requesting) {
      setDataSource([
        {
          key: "1",
          edited: stats.edited,
          originalAccepted: stats.originalAccepted,
          translated_mt: stats.translated_mt,
          notReviewed: stats.notReviewed,
          rejected: stats.rejected,
          progress: (
            <Progress
              className="px-4"
              percent={percentage()}
              size="small"
              status="active"
            />
          ),
        },
      ]);
    }
  }, [
    percentage,
    requesting,
    stats.edited,
    stats.notReviewed,
    stats.originalAccepted,
    stats.rejected,
    stats.translated_mt,
  ]);

  useEffect(() => {
    if (view === "tms") {
      queryTmTus();
    }
    if (view === "tus") {
      queryTmTusText();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tm?.id, selectedRow?.srcLiteral]);

  useEffect(() => {
    if (selectedText) {
      setView("tus");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedText]);

  const columns = [
    {
      title: "Edited",
      dataIndex: "edited",
      key: "edited",
    },
    {
      title: "Accepted",
      dataIndex: "originalAccepted",
      key: "originalAccepted",
    },
    {
      title: "Not reviewed",
      dataIndex: "notReviewed",
      key: "notReviewed",
    },
    {
      title: "Rejected",
      dataIndex: "rejected",
      key: "rejected",
    },
    // {
    //   title: "Translated_mt",
    //   dataIndex: "translated_mt",
    //   key: "translated_mt",
    // },
    {
      width: 200,
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
    },
  ];

  const queryTmTus = async () => {
    try {
      setTmRequesting(true);
      if (tm?.id) {
        const { data } = await getTmTus({
          translation_memory_id: tm.id,
          source_language: tm.context.source,
          target_language: tm.context.target,
          source_text: selectedRow.srcLiteral,
          user: user ? user?.email : null,
        });
        setTmTus(data.docs);
        setTmRequesting(false);
        return data;
      }
      return null;
    } catch (error) {
      console.error(error);
      setTmRequesting(false);
    }
  };

  const queryTmTusText = async () => {
    try {
      setTmRequesting(true);
      const { data } = await getTmTus({
        translation_memory_id: tm.id,
        source_language: tm.context.source,
        target_language: tm.context.target,
        source_text: selectedText,
        user: user ? user?.email : null,
        perTerm: true,
      });
      setTmTusText(data.docs);
      setTmRequesting(false);
      return data;
    } catch (error) {
      console.error(error);
      setTmRequesting(false);
    }
  };

  const storeTmTu = (value) => {
    saveTu(value);
    setHeight(400);
  };

  const onChange = ({ target: { value } }) => {
    setView(value);
  };
  const getCount = (value) => {
    return value.length;
  };

  return (
    <Row gutter={[8, 8]}>
      <Col>
        <Table
          className="mb-2"
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          size="small"
          bordered
        />
      </Col>
      <Col>
        <TM project={params.projectId} tmRequesting={tmRequesting} />
      </Col>
      <Col>
        {tm && tm.id && (
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            onChange={onChange}
            value={view}
          >
            <Space direction="vertical">
              <Badge count={getCount(tmTus)}>
                <Radio value="tms">TMs</Radio>
              </Badge>
              <Badge count={getCount(tmTusText)}>
                <Radio value="tus">Term</Radio>
              </Badge>
            </Space>
          </Radio.Group>
        )}
        <Button
          className="ml-4"
          type="default"
          icon={<InfoCircleOutlined />}
          onClick={() =>
            Modal.info({
              title: "Shortcuts",
              content: (
                <>
                  <Row>
                    <Col span={14}>
                      <Text>Confirm Tu</Text>
                    </Col>
                    <Col span={10} className="weight-500">
                      <Text strong> (ctrl+enter)</Text>
                    </Col>
                  </Row>

                  <Row>
                    <Col span={14}>
                      <Text>Reject Tu</Text>
                    </Col>
                    <Col span={10} className="weight-500">
                      <Text strong> (ctrl+shift+enter)</Text>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={14}>
                      <Text>Next Tu</Text>
                    </Col>
                    <Col span={10} className="weight-500">
                      <Text strong> (ctrl+shift+down)</Text>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={14}>
                      <Text>Previous Tu</Text>
                    </Col>
                    <Col span={10} className="weight-500">
                      <Text strong> (ctrl+shift+up)</Text>
                    </Col>
                  </Row>
                </>
              ),
              onOk() {},
            })
          }
        >
          Info
        </Button>
      </Col>

      {tm && tm.id && view === "tms" && (
        <Col>
          <TusTm
            query={tmTus}
            queryText={null}
            selectedText={null}
            selectedTmTu={tmTu}
            setSelectedTmTu={storeTmTu}
            selectedRow={selectedRow}
            changeTextInTextarea={changeTextInTextarea}
            tmRequesting={tmRequesting}
          />
        </Col>
      )}
      {tm && tm.id && view === "tus" && (
        <Col>
          <TusTm
            query={null}
            queryText={tmTusText}
            selectedText={selectedText}
            selectedTmTu={tmTu}
            setSelectedTmTu={storeTmTu}
            selectedRow={selectedRow}
            changeTextInTextarea={changeTextInTextarea}
            tmRequesting={tmRequesting}
          />
        </Col>
      )}
    </Row>
  );
};
HeaderTus.propTypes = {
  stats: PropTypes.object.isRequired,
  percentage: PropTypes.func.isRequired,
  selectedRow: PropTypes.shape({
    srcLiteral: PropTypes.string,
  }),
  selectedText: PropTypes.string,
  changeTextInTextarea: PropTypes.func.isRequired,
  setHeight: PropTypes.func.isRequired,
  requesting: PropTypes.bool.isRequired,
};

export default HeaderTus;
