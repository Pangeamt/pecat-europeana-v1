"use client";

import { ColumnHeightOutlined } from "@ant-design/icons";
import { Button, Switch, Table, Tag } from "antd";
import PropTypes from "prop-types";
import { Resizable } from "re-resizable";
import { useState } from "react";

const style = {
  padding: "10px 5px",
};

const TmTool = ({
  filteredTmInfo,
  showUnderThreshold,
  onShowUnderThresholdChange,
}) => {
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
      width: "100px",
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
          setHeight((prev) => prev + d.height);
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
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={showUnderThreshold}
            size="small"
            onChange={onShowUnderThresholdChange}
          />
          <span className="text-xs text-gray-500">under threshold</span>
        </div>
        <Table dataSource={filteredTmInfo} columns={columns} size="small" />
      </Resizable>
    </>
  );
};

TmTool.propTypes = {
  filteredTmInfo: PropTypes.arrayOf(
    PropTypes.shape({
      tm_item_id: PropTypes.string.isRequired,
      tm_score: PropTypes.number.isRequired,
      tm_id: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
      target: PropTypes.string.isRequired,
      best: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  showUnderThreshold: PropTypes.bool.isRequired,
  onShowUnderThresholdChange: PropTypes.func.isRequired,
};

export default TmTool;
