"use client";

import { useCallback } from "react";
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
import { useMemoryDetailView } from "@/components/shared/useMemoryDetailView";
import { getTextDirection } from "@/lib/locale-direction";

const { Text } = Typography;

export default function TMView({ tmId }) {
  const fetchResource = useCallback((id) => fetchTMByIdRequest(id), []);

  const fetchEntries = useCallback(async (id, { page, size, filter }) => {
    if (filter) {
      return searchTMTusRequest({
        translation_memory_id: id,
        query: filter,
      });
    }

    return fetchTMTusRequest(id, { page, size });
  }, []);

  const {
    state,
    isSearchMode,
    handleSearch,
    handleClearSearch,
    handleSearchInputChange,
    handlePaginationChange,
  } = useMemoryDetailView({
    resourceId: tmId,
    fetchResource,
    fetchEntries,
  });

  const tm = state.resource;

  const sourceDir = getTextDirection(tm?.context?.source);
  const targetDir = getTextDirection(tm?.context?.target);

  const columns = [
    {
      title: "No.",
      key: "index",
      width: 70,
      render: (_, __, index) => (
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-600">
          {isSearchMode ? index + 1 : (state.page - 1) * state.pageSize + index + 1}
        </span>
      ),
    },
    {
      title: "Source",
      dataIndex: "source_text",
      key: "source_text",
      render: (text) => (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
          <Text
            dir={sourceDir}
            style={{
              whiteSpace: "pre-wrap",
              display: "block",
              textAlign: sourceDir === "rtl" ? "right" : "left",
            }}
          >
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
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm leading-relaxed text-blue-950">
          <Text
            dir={targetDir}
            style={{
              whiteSpace: "pre-wrap",
              display: "block",
              textAlign: targetDir === "rtl" ? "right" : "left",
            }}
          >
            {text || "-"}
          </Text>
        </div>
      ),
    },
  ];

  if (state.error) {
    return <Alert type="error" message={state.error} showIcon />;
  }

  return (
    <Card loading={state.loading && !tm} className="overflow-hidden">
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

      {tm ? (
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
              {state.total}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          allowClear={false}
          value={state.searchInput}
          placeholder="Search segments..."
          onChange={(event) => handleSearchInputChange(event.target.value)}
          onPressEnter={handleSearch}
          aria-label="Search translation memory segments"
        />

        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={state.tableLoading && isSearchMode}
          disabled={!state.searchInput.trim()}
        />
        <Button
          icon={<CloseCircleOutlined />}
          onClick={handleClearSearch}
          disabled={!state.searchInput && !isSearchMode}
        />
      </div>

      {isSearchMode ? (
        <div className="mb-3">
          <Tag color="blue">Showing results for &quot;{state.searchQuery}&quot;</Tag>
        </div>
      ) : null}

      {state.entriesError ? (
        <Alert
          className="mb-4"
          type="error"
          message={state.entriesError}
          showIcon
        />
      ) : null}

      <Table
        columns={columns}
        dataSource={state.entries}
        loading={state.tableLoading}
        onChange={(pagination) => {
          handlePaginationChange(
            pagination.current ?? 1,
            pagination.pageSize ?? 100,
          );
        }}
        pagination={
          isSearchMode
            ? {
                total: state.total,
                showTotal: (total) => `${total} results`,
                hideOnSinglePage: true,
              }
            : {
                current: state.page,
                pageSize: state.pageSize,
                showSizeChanger: true,
                showTotal: (total) => `${total} segments`,
                total: state.total,
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
