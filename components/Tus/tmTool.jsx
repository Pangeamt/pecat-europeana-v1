"use client";

import {
  Button,
  Card,
  Divider,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import axios from "axios";
import { useParams } from "next/navigation";
import { Resizable } from "re-resizable";
import Highlighter from "react-highlight-words";
import { useHotkeys } from "react-hotkeys-hook";
import XMLViewer from "react-xml-viewer";

import {
  CheckCircleTwoTone,
  CheckOutlined,
  CloseOutlined,
  ColumnHeightOutlined,
  EditTwoTone,
  HourglassTwoTone,
  SearchOutlined,
  StopTwoTone,
  UnlockOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { LockIcon, UnlockIcon, CircleCheck, CircleX } from "lucide-react";

const TmTool = ({ tmInfo }) => {
  const columns = [
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: "40%",
    },
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      width: "40%",
    },
    {
      title: "TM Score",
      dataIndex: "tm_score",
      key: "tm_score",
    },
  ];
  return (
    <div>
      <Table dataSource={tmInfo} columns={columns} />
    </div>
  );
};
import PropTypes from "prop-types";

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
