"use client";
import {
  CheckCircleTwoTone,
  EditTwoTone,
  HourglassTwoTone,
  SearchOutlined,
  StopTwoTone,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Divider,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import axios from "axios";
import { CircleCheck, CircleX, LockIcon, UnlockIcon } from "lucide-react";
import { useParams } from "next/navigation";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Highlighter from "react-highlight-words";
import { useHotkeys } from "react-hotkeys-hook";
import XMLViewer from "react-xml-viewer";

import { StatsTus, TmTool } from "@/components/Tus";
import { getProject } from "@/services/project.services";
import { appendTu, confirmTu, getTus } from "@/services/tus.services";
import { userStore } from "@/store";
import CustomTextArea from "../../components/CustomTextArea";

const stripHTML = (html) => {
  let temporalDiv = document.createElement("div");
  temporalDiv.innerHTML = html;
  return temporalDiv.textContent || temporalDiv.innerText || "";
};

const EMPTY_STATS = {
  notReviewed: 0,
  rejected: 0,
  originalAccepted: 0,
  edited: 0,
  translated_mt: 0,
  porcent: 0,
  notMatch: 0,
  fuzzy100: 0,
  fuzzy95: 0,
  fuzzy85: 0,
  fuzzy75: 0,
  fuzzy50: 0,
};

const TusList = () => {
  const { projectId } = useParams();
  const [data, setData] = useState([]);
  const [projectConfig, setProjectConfig] = useState(null);
  const [showUnderThreshold, setShowUnderThreshold] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);

  const [open, setOpen] = useState(false);
  const userSt = userStore();
  const { user } = userSt;
  const [messageApi, contextHolder] = message.useMessage();
  const tblRef = React.useRef(null);

  const [requesting, setRequesting] = useState(true);

  const [xmlData, setXmlData] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [xmlRequesting, setXmlRequesting] = useState(null);
  const pendingScrollIndexRef = useRef(null);

  const isSegmentBlocked = (doc) => Boolean(doc?.block);

  useEffect(() => {
    if (pendingScrollIndexRef.current == null) return;

    const indexOnPage = pendingScrollIndexRef.current;
    pendingScrollIndexRef.current = null;
    tblRef.current?.scrollTo({ index: indexOnPage });
  }, [page, pageSize]);

  useEffect(() => {
    const get = async () => {
      try {
        setRequesting(true);
        const response = await getTus(projectId);
        console.log("response", response);
        const docs = response.data.docs || [];
        setData(docs);
        setSelectedRow((prev) => prev || docs[0] || null);
        setRequesting(false);
      } catch (error) {
        console.error(error);
        messageApi.error(
          error?.response?.data?.error?.message || "Project is not ready yet",
        );
        setData([]);
        setSelectedRow(null);
        setRequesting(false);
      }
    };
    if (projectId) get();
  }, [projectId, messageApi]);

  useEffect(() => {
    const getProjectConfig = async () => {
      try {
        const response = await getProject(projectId);
        setProjectConfig(response.data);
      } catch (error) {
        console.error(error);
        messageApi.error(
          error?.response?.data?.error?.message ||
            "Error getting project config",
        );
        setProjectConfig(null);
      }
    };
    getProjectConfig();
  }, [projectId, messageApi]);

  const stats = (() => {
    if (requesting || data.length === 0) return EMPTY_STATS;

    const newStats = { ...EMPTY_STATS };
    let totalStats = 0;

    data.forEach((doc) => {
      if (doc.Status === "NOT_REVIEWED" || doc.Status === "TRANSLATED_MT") {
        newStats.notReviewed += 1;
      } else if (doc.Status === "REJECTED") {
        newStats.rejected += 1;
        totalStats += 1;
      } else if (doc.Status === "ACCEPTED") {
        newStats.originalAccepted += 1;
        totalStats += 1;
      } else if (doc.Status === "EDITED") {
        newStats.edited += 1;
        totalStats += 1;
      }

      const ld = doc.levenshteinDistance;
      if (ld == null || ld < 0.5) newStats.notMatch += 1;
      else if (ld >= 0.5 && ld < 0.75) newStats.fuzzy50 += 1;
      else if (ld >= 0.75 && ld < 0.85) newStats.fuzzy75 += 1;
      else if (ld >= 0.85 && ld < 0.95) newStats.fuzzy85 += 1;
      else if (ld >= 0.95 && ld < 1) newStats.fuzzy95 += 1;
      else if (ld === 1) newStats.fuzzy100 += 1;
    });

    newStats.porcent = parseFloat(
      ((100 * totalStats) / data.length).toFixed(2),
    );
    return newStats;
  })();

  const tmThreshold = projectConfig?.tmThreshold ?? 0;

  const filteredTmInfo = useMemo(() => {
    const info = selectedRow?.tmInfo ?? [];
    if (showUnderThreshold) return info;
    return info.filter((item) => item.tm_score >= tmThreshold);
  }, [selectedRow?.tmInfo, showUnderThreshold, tmThreshold]);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{ padding: 8 }}
        onKeyDown={(e) => e.stopPropagation()}
        role="search"
        className="text-gray-500"
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block", color: "#666" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      if (record[dataIndex]) {
        return record[dataIndex]
          ? record[dataIndex]
              .toString()
              .toLowerCase()
              .includes(value.toString().toLowerCase())
          : "";
      }
      return false;
    },
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        <>{text}</>
      ),
  });

  const columns = [
    {
      title: "No.",
      dataIndex: "index",
      key: "index",
      width: 50,
      render: (_, __, index) => {
        if (selectedRow && selectedRow.id === __.id) {
          return (
            <div className="absolute top-2 left-2">
              <Tag color="#faad14">{(page - 1) * pageSize + index + 1}</Tag>
            </div>
          );
        }
        return (
          <code className="absolute top-2 left-4">
            {(page - 1) * pageSize + index + 1}
          </code>
        );
      },
    },
    {
      title: "Source",
      dataIndex: "srcLiteral",
      key: "srcLiteral",
      width: "40%",
      minWidth: 400,
      ...getColumnSearchProps("srcLiteral"),
    },
    {
      title: "Review",
      dataIndex: "reviewLiteral",
      key: "reviewLiteral",
      width: "40%",
      ...getColumnSearchProps("reviewLiteral"),
      render: (text, record) => {
        const aux = text || record.translatedLiteral || "";

        if (record.block) return <p className="text-gray-500">{aux}</p>;

        if (selectedRow && record.id === selectedRow.id) {
          return (
            <CustomTextArea
              value={selectedRow.reviewLiteral || selectedRow.translatedLiteral}
              setValue={changeTextInTextarea}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  save(selectedRow.reviewLiteral);
                }
                if (e.key === "Enter" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  reject();
                }
                if (e.key === "ArrowDown" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  moveNext();
                }
                if (e.key === "ArrowUp" && e.ctrlKey && e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  movePrevious();
                }
              }}
            />
          );
        } else {
          const reviewLiteral = getColumnSearchProps("reviewLiteral");
          return reviewLiteral.render(aux);
        }
      },
    },
    {
      title: <LockIcon size={16} className="text-gray-800" />,
      width: 80,
      dataIndex: "block",
      key: "block",
      render: (value) => {
        if (value) {
          return <LockIcon size={16} className="text-gray-800" />;
        } else {
          return <UnlockIcon size={16} className="text-gray-400" />;
        }
      },
    },
    {
      title: "Fuzzy",
      width: 80,
      dataIndex: "levenshteinDistance",
      key: "levenshteinDistance",
      sorter: (a, b) =>
        (Number(a.levenshteinDistance) || 0) -
        (Number(b.levenshteinDistance) || 0),
      render: (value) => (
        <Tag
          bordered={false}
          color={value == 1 ? "green" : value == 0 ? "red" : "yellow"}
        >
          {value != null && value !== ""
            ? Number.parseFloat(String(value)).toFixed(2)
            : "—"}
        </Tag>
      ),
    },
    {
      title: "QE",
      width: 100,
      dataIndex: "translationScorePercent",
      key: "translationScorePercent",
      sorter: (a, b) => a.translationScorePercent - b.translationScorePercent,
      render: (text) => (
        <Tag bordered={false} color="geekblue">
          {text ? parseFloat(text).toFixed(2) : ""}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "status",
      width: 90,
      filters: [
        {
          text: "REJECTED",
          value: "REJECTED",
        },
        {
          text: "ACCEPTED",
          value: "ACCEPTED",
        },
        {
          text: "EDITED",
          value: "EDITED",
        },
        {
          text: "NOT_REVIEWED",
          value: "NOT_REVIEWED",
        },
      ],
      onFilter: (value, record) => record.Status.indexOf(value) === 0,
      render: (text) => {
        let cpm = (
          <HourglassTwoTone
            twoToneColor="#faad14"
            style={{ fontSize: "18px" }}
          />
        );
        if (text === "REJECTED") {
          cpm = (
            <StopTwoTone style={{ fontSize: "18px" }} twoToneColor="#f5222d" />
          );
        }
        if (text === "ACCEPTED") {
          cpm = (
            <CheckCircleTwoTone
              twoToneColor="#52c41a"
              style={{ fontSize: "18px" }}
            />
          );
        }
        if (text === "EDITED") {
          cpm = (
            <EditTwoTone twoToneColor="#4096ff" style={{ fontSize: "18px" }} />
          );
        }
        return <div className="absolute top-2 left-2">{cpm}</div>;
      },
    },
    {
      title: "Actions",
      key: "action",
      width: 100,
      render: (record) => {
        if (record.block) return null;
        if (selectedRow && selectedRow.id !== record.id) return null;
        return (
          <div className="absolute top-2 left-2">
            {selectedRow?.exampleXml && (
              <Button
                onClick={() => {
                  loadXml(record);
                }}
                className="text-xs"
                style={{ lineHeight: "1.5" }}
                shape="circle"
                type="primary"
                size="small"
                loading={xmlRequesting && xmlRequesting.id === record.id}
              >
                {!xmlRequesting && <code>Xml</code>}
              </Button>
            )}

            <Tooltip title="Confirm Tu (ctrl+enter)">
              <Button
                className="ml-2"
                onClick={() => {
                  save(null);
                }}
                variant="text"
                color="green"
                icon={<CircleCheck size={24} strokeWidth={2} />}
                size="small"
              ></Button>
            </Tooltip>

            <Tooltip title="Reject Tu (ctrl+shift+enter)">
              <Button
                className="ml-2"
                shape="circle"
                onClick={reject}
                variant="text"
                color="red"
                icon={<CircleX size={24} strokeWidth={2} />}
                size="small"
              ></Button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const confirm = async ({ tuId, reviewLiteral, action }) => {
    const response = await confirmTu({ tuId, reviewLiteral, action });
    const { tu, alsoUpdated = [] } = response.data;
    const updatedById = new Map(
      [tu, ...alsoUpdated].map((item) => [item.id, item]),
    );

    setData((prev) =>
      prev.map((doc) =>
        updatedById.has(doc.id) ? { ...doc, ...updatedById.get(doc.id) } : doc,
      ),
    );
    setSelectedRow((prev) =>
      prev && updatedById.has(prev.id)
        ? { ...prev, ...updatedById.get(prev.id) }
        : prev,
    );
  };

  const goToRowIndex = (index) => {
    if (index < 0 || index >= data.length) return;

    const targetPage = Math.floor(index / pageSize) + 1;
    const indexOnPage = index % pageSize;

    setSelectedRow(data[index]);

    if (targetPage === page) {
      tblRef.current?.scrollTo({ index: indexOnPage });
      return;
    }

    pendingScrollIndexRef.current = indexOnPage;
    setPage(targetPage);
  };

  const movePrevious = () => {
    if (!selectedRow) return;
    const currentIndex = data.findIndex((doc) => doc.id === selectedRow.id);
    if (currentIndex <= 0) return;

    goToRowIndex(currentIndex - 1);
  };

  const moveNext = ({ skipBlocked = false } = {}) => {
    if (!selectedRow) return;
    const currentIndex = data.findIndex((doc) => doc.id === selectedRow.id);
    if (currentIndex < 0 || currentIndex >= data.length - 1) return;

    let nextIndex = currentIndex + 1;

    if (skipBlocked && !isSegmentBlocked(selectedRow)) {
      while (nextIndex < data.length && isSegmentBlocked(data[nextIndex])) {
        nextIndex += 1;
      }
    }

    if (nextIndex < data.length) {
      goToRowIndex(nextIndex);
    }
  };

  const save = async (str) => {
    if (!selectedRow) return;

    const currentRow = selectedRow;
    const reviewLiteral =
      str ?? currentRow.reviewLiteral ?? currentRow.translatedLiteral ?? "";

    messageApi.open({
      key: "loading",
      type: "loading",
      content: "saving...",
    });

    try {
      if (!isSegmentBlocked(currentRow)) {
        await confirm({
          tuId: currentRow.id,
          reviewLiteral,
          action: "approve",
        });

        moveNext({ skipBlocked: true });

        if (projectConfig?.tmIds?.length) {
          appendTu({
            tmIds: projectConfig.tmIds,
            source: currentRow.srcLiteral,
            target: reviewLiteral,
          }).catch((appendError) => {
            console.error(appendError);
            messageApi.warning("Segment saved, but TM update failed");
          });
        }
      } else {
        moveNext();
      }

      messageApi.open({
        key: "loading",
        type: "success",
        content: "Successful save!",
        duration: 2,
      });
    } catch (error) {
      messageApi.error("Error saving TU");
      console.error(error);
    }
  };

  const reject = async () => {
    messageApi.open({
      key: "loading",
      type: "loading",
      content: "Rejecting...",
    });

    await confirm({
      tuId: selectedRow.id,
      reviewLiteral: null,
      action: "reject",
    });
    moveNext();
    messageApi.open({
      key: "loading",
      type: "success",
      content: "Rejected!",
      duration: 2,
    });
  };

  const changeTextInTextarea = (text) => {
    const html = stripHTML(text);
    if (selectedRow && selectedRow.reviewLiteral !== html) {
      setSelectedRow((prev) => ({
        ...prev,
        reviewLiteral: html,
      }));
    }
  };

  const loadXml = async (record) => {
    try {
      setXmlRequesting({
        id: record.id,
      });
      const { data } = await axios.get(record.exampleXml, {
        headers: {
          "Content-Type": "application/xml",
        },
        responseType: "text",
      });
      setXmlData(data);
      setOpen(true);
      setXmlRequesting(null);
    } catch (error) {
      messageApi.error("Error loading XML");
      console.error(error);
    }
  };

  useHotkeys("ctrl+enter", async () => {
    save(null);
  });
  useHotkeys("ctrl+shift+enter", () => {
    reject();
  });
  useHotkeys("ctrl+shift+down", () => {
    moveNext();
  });
  useHotkeys("ctrl+shift+up", () => {
    movePrevious();
  });

  return (
    <div>
      {contextHolder}
      <div
        className="mb-2"
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          width: "100%",
          zIndex: 10,
        }}
      >
        <StatsTus
          stats={stats}
          percentage={stats.porcent}
          requesting={requesting}
          totalSegments={data.length}
          mode={projectConfig?.tmMode}
          tmThreshold={projectConfig?.tmThreshold}
          tms={projectConfig?.tmNames?.length ?? projectConfig?.tmIds?.length}
          tmNames={projectConfig?.tmNames}
        />
      </div>

      <div className="mb-2">
        <Tabs
          type="card"
          defaultActiveKey="1"
          headers={{
            style: {
              padding: "0px 0px",
            },
          }}
          items={[
            {
              key: "1",
              label: (
                <>
                  <span>TMs</span> <Badge count={filteredTmInfo.length} />
                </>
              ),
              children: (
                <TmTool
                  filteredTmInfo={filteredTmInfo}
                  showUnderThreshold={showUnderThreshold}
                  onShowUnderThresholdChange={setShowUnderThreshold}
                />
              ),
            },
          ]}
        />
      </div>

      <Divider />

      <Card id="tus-list">
        <Modal
          title="XML Example"
          centered
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
        >
          <XMLViewer
            xml={xmlData}
            theme={{
              attributeKeyColor: "#0074D9",
              attributeValueColor: "#2ECC40",
            }}
            collapsible
          />
        </Modal>
        <Table
          loading={requesting}
          columns={columns}
          dataSource={data}
          rowKey={(record) => {
            return record?.id;
          }}
          size="small"
          ref={tblRef}
          onRow={(record) => {
            return {
              onClick: () => {
                if (!selectedRow || selectedRow.id !== record.id) {
                  setSelectedRow(record);
                }
              },
            };
          }}
          rowClassName={(record) => {
            const classes = ["cursor-pointer"];

            if (record.block) classes.push("blocked");

            if (record.Status === "REJECTED") classes.push("rejected");
            else if (record.Status === "ACCEPTED")
              classes.push("original-accepted");
            else if (record.Status === "EDITED") classes.push("edited");

            if (selectedRow?.id === record.id) classes.push("selected-row");

            return classes.join(" ");
          }}
          pagination={{
            position: ["bottomCenter"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            current: page,
            pageSize,
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setPage(1);
            },
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              if (nextPageSize && nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
              }
            },
          }}
          scroll={{ x: "100%", y: "calc(100vh - 460px)" }}
        />
      </Card>
    </div>
  );
};

export default TusList;
