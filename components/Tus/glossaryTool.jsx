"use client";

import { ColumnHeightOutlined } from "@ant-design/icons";
import { Button, Table } from "antd";
import PropTypes from "prop-types";
import { Resizable } from "re-resizable";
import { useRef, useState } from "react";

const style = { padding: "10px 5px" };

const MIN_HEIGHT = 120;
const DEFAULT_HEIGHT = 150;
const CHROME_HEIGHT = 48;

const columns = [
  { title: "Source", dataIndex: "source", key: "source", width: "50%" },
  { title: "Target", dataIndex: "target", key: "target", width: "50%" },
];

const GlossaryTool = ({ glossaryInfo }) => {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const baseHeightRef = useRef(DEFAULT_HEIGHT);

  const handleResizeStart = () => {
    baseHeightRef.current = height;
  };

  const applyResize = (_, __, ___, delta) => {
    setHeight(Math.max(MIN_HEIGHT, baseHeightRef.current + delta.height));
  };

  const tableScrollY = Math.max(60, height - CHROME_HEIGHT);

  return (
    <Resizable
      style={style}
      size={{ width: "100%", height }}
      minHeight={MIN_HEIGHT}
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
      handleStyles={{ bottom: { height: 20, bottom: 0, cursor: "row-resize" } }}
      handleComponent={{
        bottom: (
          <Button
            type="primary"
            shape="circle"
            icon={<ColumnHeightOutlined />}
            size="small"
            className="cursor-row-resize"
            style={{ position: "absolute", bottom: 12, right: 12 }}
          />
        ),
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <Table
          dataSource={glossaryInfo}
          columns={columns}
          rowKey={(_, index) => index}
          size="small"
          pagination={false}
          scroll={{ y: tableScrollY }}
        />
      </div>
    </Resizable>
  );
};

GlossaryTool.propTypes = {
  glossaryInfo: PropTypes.arrayOf(
    PropTypes.shape({
      source: PropTypes.string,
      target: PropTypes.string,
    }),
  ).isRequired,
};

export default GlossaryTool;
