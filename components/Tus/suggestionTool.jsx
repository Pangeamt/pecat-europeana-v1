"use client";
import { Alert, Button, Empty, Space, Spin, Tag } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { TagText } from "@/components/shared/inline-tags";

// LLM post-edit suggestion panel for the selected segment. The suggestion is
// applicable: "Apply" copies it into the target editor (the reviewer still
// confirms the segment); "Discard" hides it for good. Both persist the
// suggestionStatus so acceptance can be measured.
// The `live` prop carries the ephemeral evaluation of the CURRENT draft
// (fired when the reviewer pauses typing) and takes precedence over the
// stored suggestion while present.
const STATUS_COLORS = {
  PENDING: "gold",
  APPLIED: "green",
  DISCARDED: "default",
};

const SuggestionTool = ({
  segment,
  disabled,
  onApply,
  onDiscard,
  live,
  onApplyLive,
}) => {
  if (live?.loading) {
    return (
      <div className="flex items-center gap-2 p-2 text-slate-500">
        <Spin size="small" /> Evaluating draft (MTQE + LLM)...
      </div>
    );
  }

  if (live && !live.loading) {
    return (
      <div className="flex flex-col gap-2 p-1">
        <Space wrap>
          <Tag color="blue">LIVE</Tag>
          {typeof live.score === "number" ? (
            <Tag
              color={
                live.score >= 0.85 ? "green" : live.score >= 0.65 ? "gold" : "red"
              }
            >
              MTQE {live.score.toFixed(2)}
            </Tag>
          ) : null}
          {live.verdict === "OK" ? <Tag color="green">LLM: OK</Tag> : null}
        </Space>
        {live.suggestion ? (
          <>
            <div className="rounded border border-yellow-300 bg-yellow-50 p-2">
              <div className="mb-1 text-xs font-semibold uppercase text-yellow-600">
                LLM suggestion for your draft
              </div>
              <TagText text={live.suggestion} />
            </div>
            <Space wrap>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                disabled={disabled}
                onClick={onApplyLive}
              >
                Apply to editor
              </Button>
            </Space>
          </>
        ) : live.verdict === "OK" ? (
          <Alert
            type="success"
            showIcon
            message="The LLM has no changes to propose for your draft"
          />
        ) : (
          <Alert
            type="info"
            showIcon
            message="No LLM feedback for this draft"
          />
        )}
      </div>
    );
  }

  if (!segment?.suggestionLiteral && !segment?.llmComment) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No LLM suggestion for this segment"
      />
    );
  }

  const meta = segment.suggestionMeta ?? {};
  const pending = segment.suggestionStatus === "PENDING";

  return (
    <div className="flex flex-col gap-2 p-1">
      {segment.llmComment ? (
        <Alert type="warning" showIcon message={segment.llmComment} />
      ) : null}

      {segment.suggestionLiteral ? (
        <>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-2">
              <div className="mb-1 text-xs font-semibold uppercase text-gray-400">
                Machine translation
              </div>
              <TagText text={segment.translatedLiteral ?? ""} />
            </div>
            <div className="rounded border border-yellow-300 bg-yellow-50 p-2">
              <div className="mb-1 text-xs font-semibold uppercase text-yellow-600">
                LLM suggestion
              </div>
              <TagText text={segment.suggestionLiteral} />
            </div>
          </div>

          <Space wrap>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              disabled={disabled || !pending}
              onClick={onApply}
            >
              Apply to editor
            </Button>
            <Button
              size="small"
              icon={<CloseOutlined />}
              disabled={disabled || !pending}
              onClick={onDiscard}
            >
              Discard
            </Button>
            {segment.suggestionStatus ? (
              <Tag color={STATUS_COLORS[segment.suggestionStatus] ?? "default"}>
                {segment.suggestionStatus}
              </Tag>
            ) : null}
            {typeof meta.d_score === "number" ? (
              <Tag color="blue">term score {meta.d_score.toFixed(2)}</Tag>
            ) : null}
            {meta.llm_used ? <Tag>{meta.llm_used}</Tag> : null}
          </Space>
        </>
      ) : null}
    </div>
  );
};

export default SuggestionTool;
