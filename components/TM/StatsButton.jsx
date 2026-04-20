"use client";
import { PieChartOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Modal, Row } from "antd";
import { useState } from "react";
import { getLogsRequest } from "@/services/tm.services";

const ranges = [
  ["No match", "noMatch"],
  ["50% - 74%", "50To74"],
  ["75% - 84%", "75To84"],
  ["85% - 94%", "85To94"],
  ["95% - 99%", "95To99"],
  ["100%", "100"],
];

export default function StatsButton({ projectId, tmId }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await getLogsRequest(projectId, tmId);
      const stats = response.stats;

      Modal.info({
        title: "TM Analysis",
        width: 500,
        content: (
          <>
            <Divider className="my-1" />
            <Row gutter={[8, 8]}>
              {ranges.map(([label, key]) => (
                <Col key={key} span={24} className="flex justify-between">
                  <strong>{label} </strong> {stats[key]}
                </Col>
              ))}
            </Row>
            <Divider className="my-1" />
          </>
        ),
        onOk() {},
      });
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="ml-2 mr-2 mt-1"
      icon={<PieChartOutlined />}
      type="primary"
      onClick={handleClick}
      loading={loading}
    />
  );
}
