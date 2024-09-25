"use client";
import React, { useEffect, useRef, useState } from "react";
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
} from "@ant-design/icons";

import CustomTextArea from "../../components/CustomTextArea";
import HeaderTus from "../../components/Tus/header";
import { tmStore, userStore } from "../../store";

const style = {
  border: "solid 2px #ddd",
  background: "#f0f0f0",
  padding: "15px 5px",
};

const confirmTu = async (data) => {
  return await axios({
    method: "post",
    url: "/api/tus",
    data: data,
  });
};

const confirmTuTm = async (data) => {
  return await axios({
    method: "post",
    url: `${process.env.NEXT_PUBLIC_TM_HOST}/tu`,
    data: data,
  });
};

const updateTuTm = async (data) => {
  return await axios({
    method: "patch",
    url: `${process.env.NEXT_PUBLIC_TM_HOST}/tu`,
    data: data,
  });
};

const getTus = async (projectId) => {
  return await axios({
    method: "get",
    url: "/api/tus",
    params: { projectId },
  });
};

const stripHTML = (html) => {
  let temporalDiv = document.createElement("div");
  temporalDiv.innerHTML = html;
  return temporalDiv.textContent || temporalDiv.innerText || "";
};

const TusList = () => {
  const params = useParams();
  const [open, setOpen] = useState(false);
  const tmSt = tmStore();
  const userSt = userStore();
  const { tm, tu: tmTu, config } = tmSt;
  const { user } = userSt;
  const [messageApi, contextHolder] = message.useMessage();
  const tblRef = React.useRef(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [requesting, setRequesting] = useState(true);
  const [data, setData] = useState([]);
  const [xmlData, setXmlData] = useState(null);

  const [stats, setStats] = React.useState({
    notReviewed: 0,
    rejected: 0,
    originalAccepted: 0,
    edited: 0,
    translated_mt: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [height, setHeight] = useState(110);
  const [xmlRequesting, setXmlRequesting] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
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
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
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
      width: 90,
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
      title: "S P",
      width: 70,
      dataIndex: "translationScorePercent",
      key: "translationScorePercent",
      sorter: (a, b) => a.translationScorePercent - b.translationScorePercent,
      render: (text) => (
        <div className="absolute top-2 left-2">
          <Tag bordered={false} color="geekblue">
            {text ? parseFloat(text).toFixed(2) : ""}
          </Tag>
        </div>
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
            style={{
              fontSize: "25px",
            }}
          />
        );
        if (text === "REJECTED") {
          cpm = (
            <StopTwoTone
              style={{
                fontSize: "25px",
              }}
              twoToneColor="#f5222d"
            />
          );
        }
        if (text === "ACCEPTED") {
          cpm = (
            <CheckCircleTwoTone
              twoToneColor="#52c41a"
              style={{
                fontSize: "25px",
              }}
            />
          );
        }
        if (text === "EDITED") {
          cpm = (
            <EditTwoTone
              twoToneColor="#4096ff"
              style={{
                fontSize: "25px",
              }}
            />
          );
        }
        return <div className="absolute top-2 left-2">{cpm}</div>;
      },
    },
    {
      title: "Actions",
      key: "action",
      width: 150,
      render: (record) => {
        if (selectedRow && selectedRow.id !== record.id) return null;
        return (
          <div className="absolute top-2 left-2">
            {selectedRow?.exampleXml && (
              <Button
                onClick={() => {
                  loadXml(record);
                }}
                style={{ fontSize: "11px", lineHeight: "1.5" }}
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
                shape="circle"
                type="primary"
                icon={<CheckOutlined />}
                size="small"
              ></Button>
            </Tooltip>
            <Tooltip title="Reject Tu (ctrl+shift+enter)">
              <Button
                className="ml-2"
                shape="circle"
                onClick={reject}
                type="primary"
                danger
                icon={<CloseOutlined />}
                size="small"
              ></Button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const newColumns = columns.map((item) => {
    if (item.key === "action") {
      return item;
    }

    return {
      ...item,
    };
  });

  const fetchData = async () => {
    try {
      setRequesting(true);
      const { data } = await getTus(params.projectId);
      setData(data.docs);

      setRequesting(false);
      return data;
    } catch (error) {
      console.error(error);
      setRequesting(false);
    }
  };

  useEffect(() => {
    if (!requesting && data.length > 0) {
      data.forEach((doc) => {
        if (doc.Status === "NOT_REVIEWED" || doc.Status === "TRANSLATED_MT") {
          setStats((prev) => ({ ...prev, notReviewed: prev.notReviewed + 1 }));
        } else if (doc.Status === "REJECTED") {
          setStats((prev) => ({ ...prev, rejected: prev.rejected + 1 }));
        } else if (doc.Status === "ACCEPTED") {
          setStats((prev) => ({
            ...prev,
            originalAccepted: prev.originalAccepted + 1,
          }));
        } else if (doc.Status === "EDITED") {
          setStats((prev) => ({ ...prev, edited: prev.edited + 1 }));
        }
      });
      if (!selectedRow) setSelectedRow(data[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requesting]);

  const confirm = async ({ tuId, reviewLiteral, action }) => {
    try {
      await confirmTu({
        tuId,
        reviewLiteral,
        action,
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const confirmTm = async ({
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    user,
    project,
    domain,
  }) => {
    try {
      await confirmTuTm({
        translation_memory_id,
        source_language,
        target_language,
        source_text,
        translated_text,
        user,
        project,
        domain,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const updateTm = async ({
    translation_unit_id,
    translation_memory_id,
    source_language,
    target_language,
    source_text,
    translated_text,
    user,
    project,
    domain,
  }) => {
    try {
      await updateTuTm({
        translation_unit_id,
        translation_memory_id,
        source_language,
        target_language,
        source_text,
        translated_text,
        user,
        project,
        domain,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const movePrevious = () => {
    const index = data.findIndex((doc) => doc.id === selectedRow.id);
    if (index > 0) {
      setSelectedRow(data[index - 1]);
      const el = document.getElementById(`textarea-${selectedRow.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      tblRef.current?.scrollTo({ index: index - 1 });
    }
  };

  const moveNext = () => {
    const index = data.findIndex((doc) => doc.id === selectedRow.id);
    if (index < data.length - 1) {
      setSelectedRow(data[index + 1]);

      tblRef.current?.scrollTo({ index: index });
    }
  };

  const save = async (str) => {
    messageApi.open({
      key: "loading",
      type: "loading",
      content: "saving...",
    });

    await confirm({
      tuId: selectedRow.id,
      reviewLiteral: str || selectedRow.reviewLiteral,
      action: "approve",
    });

    if (tm && config.update) {
      if (config.value === 1 && tmTu) {
        await updateTm({
          translation_unit_id: tmTu.id,
          translation_memory_id: tm.id,
          source_language: tm.context.source,
          target_language: tm.context.target,
          source_text: selectedRow.srcLiteral,
          translated_text: str || selectedRow.reviewLiteral,
          user: user ? user?.email : null,
          project: tm.context.project,
          domain: tm.context.domain,
        });
      } else {
        await confirmTm({
          translation_memory_id: tm.id,
          source_language: tm.context.source,
          target_language: tm.context.target,
          source_text: selectedRow.srcLiteral,
          translated_text: str || selectedRow.reviewLiteral,
          user: user ? user?.email : null,
          project: tm.context.project,
          domain: tm.context.domain,
        });
      }
    }
    moveNext();
    messageApi.open({
      key: "loading",
      type: "success",
      content: "Successful save!",
      duration: 2,
    });
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
    const aux = selectedRow;
    const html = stripHTML(text);
    if (aux.reviewLiteral !== html) {
      aux.reviewLiteral = html;
      setSelectedRow(aux);
    }
  };

  const percentage = () => {
    return parseFloat(
      (
        (100 *
          (stats.edited +
            stats.originalAccepted +
            stats.rejected +
            stats.translated_mt)) /
        data.length
      ).toFixed(2)
    );
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

  return (
    <div>
      {contextHolder}

      <Resizable
        style={style}
        size={{ height }}
        onResizeStop={(_, __, ___, d) => {
          setHeight(height + d.height);
        }}
        className="overflow-x-hidden overflow-y-auto"
        enable={{
          top: true,
          right: false,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        handleComponent={{
          bottom: (
            <Button
              type="primary"
              shape="circle"
              icon={<ColumnHeightOutlined />}
              size="small"
              className="cursor-row-resize"
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
              }}
            />
          ),
        }}
      >
        <HeaderTus
          stats={stats}
          percentage={percentage}
          selectedRow={selectedRow}
          selectedText={searchText}
          changeTextInTextarea={changeTextInTextarea}
          setHeight={setHeight}
          requesting={requesting}
        />
      </Resizable>
      <Divider className="my-2" />
      <Card id="tus-list">
        <Modal
          title="XML Example"
          centered
          open={open}
          onCancel={() => setOpen(false)}
          width={1000}
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
          columns={newColumns}
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
            if (selectedRow) {
              if (record.Status === "REJECTED") {
                return "cursor-pointer rejected selected-row";
              }
              if (record.Status === "ACCEPTED") {
                return "cursor-pointer original-accepted selected-row";
              }
              if (record.Status === "EDITED") {
                return "cursor-pointer edited selected-row";
              }
            }
            if (record.Status === "REJECTED") {
              return "cursor-pointer rejected";
            }
            if (record.Status === "ACCEPTED") {
              return "cursor-pointer original-accepted";
            }
            if (record.Status === "EDITED") {
              return "cursor-pointer edited";
            }

            return "cursor-pointer";
          }}
          pagination={{
            position: ["bottomCenter"],
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            defaultPageSize: pageSize,
            onShowSizeChange: (_, size) => {
              setPageSize(size);
            },
            onChange: (page) => {
              setPage(page);
            },
          }}
          scroll={{ x: "100%", y: "calc(100vh - 360px)" }}
        />
      </Card>
    </div>
  );
};

export default TusList;
