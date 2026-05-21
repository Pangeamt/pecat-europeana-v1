"use client";

import { ColumnHeightOutlined } from "@ant-design/icons";
import { Switch, Table, Tag, Button } from "antd";
import PropTypes from "prop-types";
import { Resizable } from "re-resizable";
import { useRef, useState } from "react";

const style = {
  padding: "10px 5px",
};

const MIN_TM_TOOL_HEIGHT = 120;
const DEFAULT_TM_TOOL_HEIGHT = 150;
const TM_TOOL_CHROME_HEIGHT = 72;

const TmTool = ({
  filteredTmInfo,
  showUnderThreshold,
  onShowUnderThresholdChange,
}) => {
  const [height, setHeight] = useState(DEFAULT_TM_TOOL_HEIGHT);
  const baseHeightRef = useRef(DEFAULT_TM_TOOL_HEIGHT);

  const handleResizeStart = () => {
    baseHeightRef.current = height;
  };

  const applyResize = (_, __, ___, delta) => {
    setHeight(
      Math.max(MIN_TM_TOOL_HEIGHT, baseHeightRef.current + delta.height),
    );
  };

  const tableScrollY = Math.max(60, height - TM_TOOL_CHROME_HEIGHT);

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
      width: "10%",
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
    <Resizable
      style={style}
      size={{ width: "100%", height }}
      minHeight={MIN_TM_TOOL_HEIGHT}
      enable={{
        top: false,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      onResizeStart={handleResizeStart}
      onResize={applyResize}
      onResizeStop={applyResize}
      handleStyles={{
        bottom: {
          height: 20,
          bottom: 0,
          cursor: "row-resize",
        },
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
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="mb-2 flex shrink-0 items-center gap-2">
          <Switch
            checked={showUnderThreshold}
            size="small"
            onChange={onShowUnderThresholdChange}
          />
          <span className="text-xs text-gray-500">Under Threshold</span>
        </div>
        <Table
          dataSource={filteredTmInfo}
          columns={columns}
          size="small"
          pagination={false}
          scroll={{ y: tableScrollY }}
        />
      </div>
    </Resizable>
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
