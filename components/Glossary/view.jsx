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
  SearchOutlined,
} from "@ant-design/icons";
import {
  fetchGlossaryByIdRequest,
  fetchGlossaryEntriesRequest,
} from "@/services/glossary.services";
import { useMemoryDetailView } from "@/components/shared/useMemoryDetailView";

const { Text } = Typography;

export default function GlossaryView({ glossaryId }) {
  const fetchResource = useCallback(
    (id) => fetchGlossaryByIdRequest(id),
    [],
  );

  const fetchEntries = useCallback(
    (id, pagination) => fetchGlossaryEntriesRequest(id, pagination),
    [],
  );

  const {
    state,
    isSearchMode,
    handleSearch,
    handleClearSearch,
    handleSearchInputChange,
    handlePaginationChange,
  } = useMemoryDetailView({
    resourceId: glossaryId,
    fetchResource,
    fetchEntries,
  });

  const glossary = state.resource;

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
          <Text style={{ whiteSpace: "pre-wrap" }}>{text}</Text>
        </div>
      ),
    },
    {
      title: "Target",
      dataIndex: "translated_text",
      key: "translated_text",
      render: (text) => (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-950">
          <Text style={{ whiteSpace: "pre-wrap" }}>{text || "-"}</Text>
        </div>
      ),
    },
  ];

  if (state.error) {
    return <Alert type="error" message={state.error} showIcon />;
  }

  return (
    <Card loading={state.loading && !glossary} className="overflow-hidden">
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Glossary
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">
              {glossary?.name || "Glossary"}
            </h2>
            <p className="m-0 text-sm text-slate-300">
              Review the terms stored in this glossary.
            </p>
          </div>
          {glossary ? (
            <Space>
              <Tag color="geekblue" className="rounded-full uppercase">
                {glossary.context?.source}
              </Tag>
              <ArrowRightOutlined className="text-slate-400" />
              <Tag color="cyan" className="rounded-full uppercase">
                {glossary.context?.target}
              </Tag>
            </Space>
          ) : null}
        </div>
      </div>

      {glossary ? (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Domain
            </div>
            <div className="mt-2 truncate font-semibold text-slate-900">
              {glossary.context?.domain || "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Project
            </div>
            <div className="mt-2 truncate font-semibold text-slate-900">
              {glossary.context?.project || "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              {isSearchMode ? "Search results" : "Total entries"}
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
          placeholder="Search terms..."
          onChange={(event) => handleSearchInputChange(event.target.value)}
          onPressEnter={handleSearch}
          aria-label="Search glossary entries"
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
          <Tag color="green">
            Showing results for &quot;{state.searchQuery}&quot;
          </Tag>
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
                showTotal: (total) => `${total} entries`,
                total: state.total,
              }
        }
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                isSearchMode
                  ? "No terms match your search"
                  : "No entries found"
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
