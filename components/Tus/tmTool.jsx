"use client";

import { Button, Table, Tag } from "antd";
import { Resizable } from "re-resizable";
import { useState } from "react";
import { ColumnHeightOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const style = {
  padding: "10px 5px",
};

const TmTool = ({ tmInfo, threshold }) => {
  const [height, setHeight] = useState(150);

  const columns = [
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: "45%",
    },
    {
      title: "Similarity",
      dataIndex: "tm_score",
      key: "tm_score",
      render: (value) => {
        return (
          <Tag
            bordered={false}
            color={value == 1 ? "green" : value == 0 ? "red" : "yellow"}
          >
            {value != null && value !== ""
              ? Number.parseFloat(String(value)).toFixed(2)
              : "—"}
          </Tag>
        );
      },
    },
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      width: "45%",
    },
  ];

  return (
    <>
      <Resizable
        style={style}
        size={{ height }}
        onResizeStop={(_, __, ___, d) => {
          setHeight(height + d.height);
        }}
        className="overflow-x-hidden overflow-y-auto"
        enable={{
          top: true,
          right: false,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        handleComponent={{
          bottom: (
            <Button
              type="primary"
              shape="circle"
              icon={<ColumnHeightOutlined />}
              size="small"
              className="cursor-row-resize"
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
              }}
            />
          ),
        }}
      >
        <Table dataSource={tmInfo} columns={columns} size="small" />
      </Resizable>
    </>
  );
};

TmTool.propTypes = {
  tmInfo: PropTypes.arrayOf(
    PropTypes.shape({
      tm_item_id: PropTypes.string.isRequired,
      tm_score: PropTypes.number.isRequired,
      tm_id: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
      target: PropTypes.string.isRequired,
      best: PropTypes.bool.isRequired,
    }),
  ).isRequired,
};

export default TmTool;
