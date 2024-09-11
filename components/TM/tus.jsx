import React, { useEffect, useState } from "react";

import { Row, Tag, Col, Table, Typography, Divider } from "antd";

import { ArrowRightOutlined } from "@ant-design/icons";
import { diffChars } from "diff";
import dayjs from "dayjs";
import Highlighter from "react-highlight-words";
const { Text } = Typography;

const getColorBySimilarity = (similarity) => {
  if (similarity >= 0.9) {
    return "#73d13d";
  } else if (similarity >= 0.8) {
    return "#fff566";
  } else if (similarity >= 0.7) {
    return "#faad14";
  } else {
    return "#f5222d";
  }
};

const TusTM = ({
  query,
  queryText,
  selectedTmTu,
  setSelectedTmTu,
  selectedRow,
  changeTextInTextarea,
  selectedText,
  tmRequesting,
}) => {
  useEffect(() => {
    if (query && query.length) {
      setSelectedTmTu(query[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, query?.length]);

  useEffect(() => {
    if (queryText && queryText.length) {
      setSelectedTmTu(queryText[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryText, queryText?.length]);

  const columns = [
    {
      title: "No.",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_, __, index) => {
        return <code className="flex justify-center">{index + 1}</code>;
      },
    },
    {
      title: "Source",
      dataIndex: "source_text",
      key: "source_text",
      render: (text) => {
        if (!selectedRow || !text) return text;

        if (query) {
          const diff = diffChars(text, selectedRow.srcLiteral);
          return (
            <div>
              {diff.map((part, index) => {
                const color = part.added
                  ? "green"
                  : part.removed
                  ? "red"
                  : "black";
                return (
                  <Text key={index} style={{ color }}>
                    {part.value}
                  </Text>
                );
              })}
            </div>
          );
        } else if (queryText) {
          return (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[selectedText]}
              autoEscape
              textToHighlight={text ? text.toString() : ""}
            />
          );
        }
      },
    },
    {
      width: 90,
      title: "Similarity",
      dataIndex: "similarity",
      key: "similarity",
      render: (text) => {
        if (text && text?.levenshtein) {
          return (
            <div className="flex justify-center">
              <Tag color={getColorBySimilarity(text.levenshtein)}>
                {text.levenshtein.toFixed(2)}
              </Tag>
            </div>
          );
        }
      },
    },
    {
      title: "Target",
      dataIndex: "translated_text",
      key: "translated_text",
      render: (text) => <Text>{text}</Text>,
    },
  ];

  if (queryText) {
    // remove Similarity column
    columns.splice(2, 1);
  }

  const getDataSource = () => {
    if (queryText) {
      return queryText;
    } else if (query) {
      return query;
    }
    return [];
  };

  return (
    <>
      <Table
        className="tm-tus-table"
        size="small"
        dataSource={getDataSource()}
        columns={columns}
        pagination={false}
        bordered
        loading={tmRequesting}
        scroll={{ y: 700 }}
        rowKey={(record) => (record ? record._id : "")}
        rowClassName={(record) => {
          if (record && selectedTmTu) {
            let className = ["cursor-pointer"];
            if (selectedTmTu.id === record.id) {
              className.push("selected-row");
            }
            if (selectedTmTu.id === record.id) {
              className.push("selected-use-row");
            }
            return className.join(" ");
          }
          return "";
        }}
        onRow={(record) => {
          return {
            onClick: () => {
              setSelectedTmTu(record);
            },
            onDoubleClick: () => {
              setSelectedTmTu(record);
              changeTextInTextarea(record.translated_text);
            },
          };
        }}
      />
      {selectedTmTu && (
        <>
          <Divider />
          <Row className="mt-1">
            <Col xs={24} md={8}>
              <Row>
                <Col>
                  <Typography.Text strong>User:</Typography.Text>
                </Col>
                <Col>
                  <Typography.Text italic>
                    {selectedTmTu ? selectedTmTu.context.user : ""}
                  </Typography.Text>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Typography.Text strong>Domain:</Typography.Text>
                </Col>
                <Col>
                  <Typography.Text italic>
                    {selectedTmTu ? selectedTmTu.context.domain : ""}
                  </Typography.Text>
                </Col>
              </Row>
            </Col>

            <Col xs={24} md={8}>
              <Row>
                <Col>
                  <Typography.Text strong>Project:</Typography.Text>
                </Col>
                <Col>
                  <Typography.Text italic>
                    {selectedTmTu ? selectedTmTu.context.project : ""}
                  </Typography.Text>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Typography.Text className="mr-1" strong>
                    Direction:
                  </Typography.Text>
                </Col>
                <Col>
                  <Tag color="red">{selectedTmTu.source_language}</Tag>
                  <ArrowRightOutlined className="mr-2" />
                  <Tag color="blue" className="ml-5">
                    {selectedTmTu.target_language}
                  </Tag>
                </Col>
              </Row>
              {selectedTmTu && selectedTmTu.similarity && (
                <>
                  <div className="mr-3">
                    <Typography.Text strong>Levenshtein:</Typography.Text>
                    <Typography.Text italic>
                      {selectedTmTu.similarity.levenshtein.toFixed(2)}
                    </Typography.Text>
                  </div>
                </>
              )}
            </Col>

            <Col xs={24} md={8}>
              <div className="mr-3">
                <Typography.Text strong>Create date:</Typography.Text>
                <Typography.Text italic>
                  {dayjs(selectedTmTu.create_date).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
                </Typography.Text>
              </div>
              <div className="mr-3">
                <Typography.Text strong>Update date:</Typography.Text>
                <Typography.Text italic>
                  {/* {dayjs(selectedTmTu.update_date)} */}
                  {dayjs(selectedTmTu.update_date).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
                </Typography.Text>
              </div>
            </Col>
          </Row>
        </>
      )}
    </>
  );
};

export default TusTM;
