"use client";
import { useState, useEffect } from "react";
import { Alert, Card, Space, Table, Tag, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { fetchTMByIdRequest, fetchTMTusRequest } from "@/services/tm.services";

export default function TMView({ tmId }) {
  const [tm, setTm] = useState(null);
  const [tus, setTus] = useState([]);
  const [totalTus, setTotalTus] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTm = async () => {
      try {
        setLoading(true);
        setError(null);
        const tmData = await fetchTMByIdRequest(tmId);
        if (!isMounted) return;
        setTm(tmData);
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        setError(
          error?.response?.data?.message || "Error loading translation memory",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (tmId) void fetchTm();

    return () => {
      isMounted = false;
    };
  }, [tmId]);

  useEffect(() => {
    let isMounted = true;

    const fetchTus = async () => {
      try {
        setTableLoading(true);
        setError(null);
        const tusData = await fetchTMTusRequest(tmId, {
          page,
          size: pageSize,
        });

        if (!isMounted) return;
        setTus(tusData?.docs ?? []);
        setTotalTus(tusData?.total ?? 0);
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        setError(
          error?.response?.data?.message ||
            "Error loading translation memory segments",
        );
      } finally {
        if (isMounted) setTableLoading(false);
      }
    };

    if (tmId) void fetchTus();

    return () => {
      isMounted = false;
    };
  }, [tmId, page, pageSize]);

  const columns = [
    {
      title: "No.",
      key: "index",
      width: 70,
      render: (_, __, index) => (
        <code className="flex justify-center">
          {(page - 1) * pageSize + index + 1}
        </code>
      ),
    },
    {
      title: "Source",
      dataIndex: "source_text",
      key: "source_text",
      render: (text) => (
        <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
          {text}
        </Typography.Text>
      ),
    },
    {
      title: "Target",
      dataIndex: "translated_text",
      key: "translated_text",
      render: (text) => (
        <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
          {text}
        </Typography.Text>
      ),
    },
  ];

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  return (
    <Card
      title={tm?.name || "Translation Memory"}
      loading={loading && !tm}
      extra={
        tm ? (
          <Space>
            <Tag color="red">{tm.context?.source}</Tag>
            <ArrowRightOutlined />
            <Tag color="blue">{tm.context?.target}</Tag>
          </Space>
        ) : null
      }
    >
      {tm && (
        <Space className="mb-4" size="large" wrap>
          <Typography.Text type="secondary">
            Domain: <Typography.Text>{tm.context?.domain || "-"}</Typography.Text>
          </Typography.Text>
          <Typography.Text type="secondary">
            Project:{" "}
            <Typography.Text>{tm.context?.project || "-"}</Typography.Text>
          </Typography.Text>
          <Typography.Text type="secondary">
            Total segments: <Typography.Text>{totalTus}</Typography.Text>
          </Typography.Text>
        </Space>
      )}

      <Table
        bordered
        columns={columns}
        dataSource={tus}
        loading={tableLoading}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? 100);
        }}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          showTotal: (total) => `${total} segments`,
          total: totalTus,
        }}
        rowKey={(record) => record.id}
        scroll={{ x: 900 }}
        size="small"
      />
    </Card>
  );
}
