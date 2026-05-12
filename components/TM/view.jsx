"use client";
import { useState, useEffect } from "react";
import { Alert, Card, Empty, Space, Table, Tag, Typography } from "antd";
import {
  ArrowRightOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { fetchTMByIdRequest, fetchTMTusRequest } from "@/services/tm.services";

const { Text } = Typography;

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
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
          {(page - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      title: "Source",
      dataIndex: "source_text",
      key: "source_text",
      render: (text) => (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
          <Text style={{ whiteSpace: "pre-wrap" }}>
          {text}
          </Text>
        </div>
      ),
    },
    {
      title: "Target",
      dataIndex: "translated_text",
      key: "translated_text",
      render: (text) => (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm leading-relaxed text-slate-900">
          <Text style={{ whiteSpace: "pre-wrap" }}>
            {text || "-"}
          </Text>
        </div>
      ),
    },
  ];

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  return (
    <Card loading={loading && !tm} className="overflow-hidden">
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Translation memory
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">
              {tm?.name || "Translation Memory"}
            </h2>
            <p className="m-0 text-sm text-slate-300">
              Review the segments stored in this memory.
            </p>
          </div>
          {tm ? (
            <Space>
              <Tag color="geekblue" className="rounded-full uppercase">
                {tm.context?.source}
              </Tag>
              <ArrowRightOutlined className="text-slate-400" />
              <Tag color="cyan" className="rounded-full uppercase">
                {tm.context?.target}
              </Tag>
            </Space>
          ) : null}
        </div>
      </div>

      {tm && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              <DatabaseOutlined />
              Domain
            </div>
            <div className="truncate font-semibold text-slate-900">
              {tm.context?.domain || "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              <FileTextOutlined />
              Project
            </div>
            <div className="truncate font-semibold text-slate-900">
              {tm.context?.project || "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Total segments
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {totalTus}
            </div>
          </div>
        </div>
      )}

      <Table
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
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No segments found"
            />
          ),
        }}
        rowKey={(record) => record.id}
        scroll={{ x: 900 }}
        size="small"
        rowClassName="align-top"
      />
    </Card>
  );
}
