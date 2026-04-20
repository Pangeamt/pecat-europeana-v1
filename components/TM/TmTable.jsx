"use client";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Button, Table } from "antd";

const buildColumns = ({
  selectedTmId,
  onSelect,
  onEdit,
  onExport,
  onDelete,
}) => [
  {
    title: "No.",
    dataIndex: "index",
    key: "index",
    render: (_, __, index) => (
      <code className="flex justify-center">{index + 1}</code>
    ),
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Project",
    key: "project",
    render: (record) => <code>{record.context.project}</code>,
  },
  {
    title: "Domain",
    key: "domain",
    render: (record) => <code>{record.context.domain}</code>,
  },
  {
    title: "Source",
    key: "source",
    render: (record) => <code>{record.context.source}</code>,
  },
  {
    title: "Target",
    key: "target",
    render: (record) => <code>{record.context.target}</code>,
  },
  {
    title: "Actions",
    key: "actions",
    render: (record) => (
      <div>
        <Button
          type={selectedTmId === record.id ? "primary" : "default"}
          onClick={() => onSelect(record)}
          size="small"
        >
          {selectedTmId === record.id ? "Selected" : "Select"}
        </Button>

        <Button
          className="ml-2"
          icon={<EditOutlined />}
          type="default"
          onClick={() => onEdit(record)}
          size="small"
        />

        <Button
          className="ml-2"
          type="default"
          icon={<DownloadOutlined />}
          onClick={() => onExport(record.id)}
          size="small"
        />

        <Button
          className="ml-2 text-red-500 ant-btn-dangerous"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(record.id)}
          size="small"
        />
      </div>
    ),
  },
];

export default function TmTable({
  tms,
  fetching,
  selectedTmId,
  onSelect,
  onEdit,
  onExport,
  onDelete,
}) {
  const columns = buildColumns({
    selectedTmId,
    onSelect,
    onEdit,
    onExport,
    onDelete,
  });

  return (
    <Table
      loading={fetching}
      dataSource={tms}
      columns={columns}
      size="small"
    />
  );
}
