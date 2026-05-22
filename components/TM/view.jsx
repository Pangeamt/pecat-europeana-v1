"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  fetchTMByIdRequest,
  fetchTMTusRequest,
  searchTMTusRequest,
} from "@/services/tm.services";

const { Text } = Typography;

export default function TMView({ tmId }) {
  const [tm, setTm] = useState(null);
  const [tus, setTus] = useState([]);
  const [totalTus, setTotalTus] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segmentsError, setSegmentsError] = useState(null);

  const isSearchMode = Boolean(searchQuery);

  useEffect(() => {
    if (!tmId) return undefined;

    let isMounted = true;

    const fetchTm = async () => {
      try {
        setLoading(true);
        setError(null);
        const tmData = await fetchTMByIdRequest(tmId);
        if (!isMounted) return;
        setTm(tmData);
      } catch (fetchError) {
        if (!isMounted) return;
        console.error(fetchError);
        setError(
          fetchError?.response?.data?.message ||
            "Error loading translation memory",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchTm();

    return () => {
      isMounted = false;
    };
  }, [tmId]);

  useEffect(() => {
    setSearchInput("");
    setSearchQuery(null);
    setPage(1);
    setSegmentsError(null);
  }, [tmId]);

  const loadAllTus = useCallback(
    async (nextPage = page, nextPageSize = pageSize) => {
      if (!tmId) return;

      try {
        setTableLoading(true);
        setSegmentsError(null);
        const tusData = await fetchTMTusRequest(tmId, {
          page: nextPage,
          size: nextPageSize,
        });
        setTus(tusData?.docs ?? []);
        setTotalTus(tusData?.total ?? 0);
      } catch (fetchError) {
        console.error(fetchError);
        setSegmentsError(
          fetchError?.response?.data?.message ||
            "Error loading translation memory segments",
        );
      } finally {
        setTableLoading(false);
      }
    },
    [tmId, page, pageSize],
  );

  const runSearch = useCallback(
    async (query) => {
      if (!tmId) return;

      try {
        setTableLoading(true);
        setSegmentsError(null);
        const tusData = await searchTMTusRequest({
          translation_memory_id: tmId,
          query,
        });
        setTus(tusData?.docs ?? []);
        setTotalTus(tusData?.total ?? 0);
      } catch (fetchError) {
        console.error(fetchError);
        setSegmentsError(
          fetchError?.response?.data?.message ||
            "Error searching translation memory segments",
        );
      } finally {
        setTableLoading(false);
      }
    },
    [tmId],
  );

  useEffect(() => {
    if (!tmId || isSearchMode) return undefined;

    void loadAllTus(page, pageSize);

    return undefined;
  }, [tmId, page, pageSize, isSearchMode, loadAllTus]);

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;

    setSearchQuery(trimmed);
    setPage(1);
    void runSearch(trimmed);
  };

  const handleClear = () => {
    setSearchInput("");
    setSearchQuery(null);
    setPage(1);
    setSegmentsError(null);
  };

  const columns = [
    {
      title: "No.",
      key: "index",
      width: 70,
      render: (_, __, index) => (
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
          {isSearchMode ? index + 1 : (page - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      title: "Source",
      dataIndex: "source_text",
      key: "source_text",
      render: (text) => (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
          <Text style={{ whiteSpace: "pre-wrap" }}>{text}</Text>
        </div>
      ),
    },
    {
      title: "Target",
      dataIndex: "translated_text",
      key: "translated_text",
      render: (text) => (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm leading-relaxed text-blue-950">
          <Text style={{ whiteSpace: "pre-wrap" }}>{text || "-"}</Text>
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
              {isSearchMode ? "Search results" : "Total segments"}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {totalTus}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          allowClear={false}
          value={searchInput}
          placeholder="Search segments..."
          onChange={(event) => setSearchInput(event.target.value)}
          onPressEnter={handleSearch}
          aria-label="Search translation memory segments"
        />

        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={tableLoading && isSearchMode}
          disabled={!searchInput.trim()}
        />
        <Button
          icon={<CloseCircleOutlined />}
          onClick={handleClear}
          disabled={!searchInput && !isSearchMode}
        />
      </div>

      {isSearchMode ? (
        <div className="mb-3">
          <Tag color="blue">Showing results for &quot;{searchQuery}&quot;</Tag>
        </div>
      ) : null}

      {segmentsError ? (
        <Alert className="mb-4" type="error" message={segmentsError} showIcon />
      ) : null}

      <Table
        columns={columns}
        dataSource={tus}
        loading={tableLoading}
        onChange={(pagination) => {
          if (isSearchMode) return;
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? 100);
        }}
        pagination={
          isSearchMode
            ? {
                total: totalTus,
                showTotal: (total) => `${total} results`,
                hideOnSinglePage: true,
              }
            : {
                current: page,
                pageSize,
                showSizeChanger: true,
                showTotal: (total) => `${total} segments`,
                total: totalTus,
              }
        }
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                isSearchMode
                  ? "No segments match your search"
                  : "No segments found"
              }
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
