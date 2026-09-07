"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Popconfirm,
  Segmented,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { ListChecks, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

import {
  actOnQueueJob,
  getQueuesOverview,
  listQueueJobs,
} from "@/services/queues.services";
import { userStore } from "@/store";

const { Text } = Typography;

const STATES = ["failed", "active", "waiting", "delayed", "completed"];

const STATE_COLOR = {
  failed: "red",
  active: "blue",
  waiting: "gold",
  delayed: "purple",
  completed: "green",
  paused: "default",
};

const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString() : "—");

// SUPER-only monitor of the BullMQ queues (project-import and mtqe-v2).
// The API enforces the role; the client just mirrors it for UX.
const QueuesMonitor = () => {
  const { user } = userStore();
  const [messageApi, contextHolder] = message.useMessage();

  const [overview, setOverview] = useState([]);
  const [activeQueue, setActiveQueue] = useState(null);
  const [state, setState] = useState("failed");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const isSuper = user?.role === "SUPER";

  const refresh = useCallback(async () => {
    if (!isSuper) return;
    try {
      setLoading(true);
      const data = await getQueuesOverview();
      setOverview(data.queues);
      const queueName = activeQueue ?? data.queues[0]?.name ?? null;
      if (!activeQueue && queueName) setActiveQueue(queueName);
      if (queueName) {
        const result = await listQueueJobs(queueName, state, page, pageSize);
        setJobs(result.jobs);
        setTotal(result.total);
      }
    } catch (error) {
      console.error(error);
      messageApi.error(
        error?.response?.data?.message || "Could not load the queues",
      );
    } finally {
      setLoading(false);
    }
  }, [isSuper, activeQueue, state, page, pageSize, messageApi]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh || !isSuper) return undefined;
    const timer = setInterval(refresh, 5_000);
    return () => clearInterval(timer);
  }, [autoRefresh, isSuper, refresh]);

  const runAction = async (jobId, action) => {
    try {
      await actOnQueueJob(activeQueue, jobId, action);
      messageApi.success(action === "retry" ? "Job re-enqueued" : "Job removed");
      await refresh();
    } catch (error) {
      console.error(error);
      messageApi.error(
        error?.response?.data?.message || "Queue action failed",
      );
    }
  };

  const columns = useMemo(
    () => [
      { title: "Job", dataIndex: "id", width: 90 },
      { title: "Type", dataIndex: "name", width: 150 },
      {
        title: "Document",
        width: 240,
        render: (_, record) => (
          <Text code copyable={{ text: record.data?.projectId ?? "" }}>
            {record.data?.projectId ?? "—"}
          </Text>
        ),
      },
      {
        title: "Attempts",
        width: 100,
        render: (_, record) => (
          <Tag color={record.attemptsMade >= record.attempts ? "red" : "default"}>
            {record.attemptsMade}/{record.attempts}
          </Tag>
        ),
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        width: 170,
        render: fmtTime,
      },
      {
        title: "Finished",
        dataIndex: "finishedOn",
        width: 170,
        render: fmtTime,
      },
      {
        title: "Error",
        dataIndex: "failedReason",
        ellipsis: true,
        render: (text) =>
          text ? (
            <Tooltip title={text}>
              <Text type="danger" className="text-xs">
                {text}
              </Text>
            </Tooltip>
          ) : (
            "—"
          ),
      },
      {
        title: "",
        width: 90,
        render: (_, record) => (
          <Space size={4}>
            {record.state === "failed" ? (
              <Tooltip title="Retry job">
                <Button
                  size="small"
                  type="text"
                  icon={<RotateCcw size={15} />}
                  onClick={() => runAction(record.id, "retry")}
                />
              </Tooltip>
            ) : null}
            <Popconfirm
              title="Remove this job?"
              onConfirm={() => runAction(record.id, "remove")}
            >
              <Button
                size="small"
                type="text"
                danger
                icon={<Trash2 size={15} />}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeQueue],
  );

  if (!isSuper) {
    return (
      <Card style={{ marginLeft: 20 }}>
        <Alert
          type="warning"
          showIcon
          message="Only SUPER users can access the job queues."
        />
      </Card>
    );
  }

  const countsFor = (name) =>
    overview.find((queue) => queue.name === name)?.counts ?? {};

  return (
    <Card style={{ marginLeft: 20 }}>
      {contextHolder}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks size={20} className="text-primary" />
          <h2 className="m-0 text-lg font-semibold">Job queues</h2>
        </div>
        <Space>
          <span className="text-xs text-slate-500">Auto-refresh (5s)</span>
          <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
          <Button
            size="small"
            icon={<RefreshCw size={14} />}
            loading={loading}
            onClick={refresh}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeQueue ?? undefined}
        onChange={(key) => {
          setActiveQueue(key);
          setPage(1);
        }}
        items={overview.map((queue) => ({
          key: queue.name,
          label: (
            <span>
              {queue.name}{" "}
              <Badge
                size="small"
                count={queue.counts?.failed ?? 0}
                color="red"
                offset={[2, -2]}
              />
            </span>
          ),
        }))}
      />

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Segmented
          size="small"
          value={state}
          onChange={(value) => {
            setState(value);
            setPage(1);
          }}
          options={STATES.map((s) => ({
            label: (
              <span>
                {s}{" "}
                <Tag
                  bordered={false}
                  color={STATE_COLOR[s]}
                  className="ml-1 px-1 text-[11px]"
                >
                  {countsFor(activeQueue)?.[s] ?? 0}
                </Tag>
              </span>
            ),
            value: s,
          }))}
        />
      </div>

      <Table
        size="small"
        rowKey="id"
        loading={loading && jobs.length === 0}
        columns={columns}
        dataSource={jobs}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
      />
    </Card>
  );
};

export default QueuesMonitor;
