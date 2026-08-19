"use client";
import {
  ArrowLeftOutlined,
  BookOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import { fetchGlossariesRequest } from "@/services/glossary.services";
import {
  fetchProfileByIdRequest,
  updateProfileRequest,
} from "@/services/profiles.services";
import { fetchTMRequest } from "@/services/tm.services";

const toAssetOption = (asset) => {
  const source = asset.sourceLanguage ?? asset.context?.source ?? "-";
  const target = asset.targetLanguage ?? asset.context?.target ?? "-";
  return {
    value: asset.id,
    label: `${asset.name} (${source} → ${target})`,
  };
};

function AddAssetsModal({
  open,
  title,
  options,
  placeholder,
  notFoundText,
  okText,
  cancelText,
  onClose,
  onAdd,
}) {
  const [selected, setSelected] = useState([]);
  const [adding, setAdding] = useState(false);

  const handleClose = () => {
    setSelected([]);
    onClose?.();
  };

  const handleOk = async () => {
    try {
      setAdding(true);
      await onAdd(selected);
      setSelected([]);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleClose}
      onOk={handleOk}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ disabled: selected.length === 0 }}
      confirmLoading={adding}
      destroyOnHidden
    >
      <Select
        mode="multiple"
        showSearch
        className="w-full"
        placeholder={placeholder}
        optionFilterProp="label"
        notFoundContent={options.length === 0 ? notFoundText : undefined}
        value={selected}
        onChange={setSelected}
        options={options}
      />
    </Modal>
  );
}

const ProfileDetail = ({ profileId }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState({ tms: [], glossaries: [] });
  const [isAddTmOpen, setIsAddTmOpen] = useState(false);
  const [isAddGlossaryOpen, setIsAddGlossaryOpen] = useState(false);

  const formalityOptions = [
    { value: "FORMAL", label: t("profiles.form.formalityFormal") },
    { value: "NEUTRO", label: t("profiles.form.formalityNeutral") },
    { value: "INFORMAL", label: t("profiles.form.formalityInformal") },
  ];

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetchProfileByIdRequest(profileId);
      setProfile(response?.profile ?? null);
    } catch (error) {
      console.error(error);
      message.error(t("profiles.messages.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [profileId, t]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profile?.workspaceId) return;
    const query = { workspaceId: profile.workspaceId, size: 1000 };
    Promise.all([fetchTMRequest(query), fetchGlossariesRequest(query)])
      .then(([tmResponse, glossaryResponse]) => {
        setAssets({
          tms: tmResponse?.docs ?? [],
          glossaries: glossaryResponse?.docs ?? [],
        });
      })
      .catch((error) => {
        console.error(error);
        message.error(t("profiles.form.assetsError"));
      });
  }, [profile?.workspaceId, t]);

  const attachedTmIds = profile?.tms?.map((tm) => tm.id) ?? [];
  const attachedGlossaryIds =
    profile?.glossaries?.map((glossary) => glossary.id) ?? [];

  const availableTms = assets.tms.filter(
    (tm) => !attachedTmIds.includes(tm.id),
  );
  const availableGlossaries = assets.glossaries.filter(
    (glossary) => !attachedGlossaryIds.includes(glossary.id),
  );

  const applyUpdate = async (payload) => {
    try {
      message.loading({
        content: t("profiles.messages.updating"),
        key: "update-profile",
      });
      const response = await updateProfileRequest(profileId, payload);
      setProfile(response?.profile ?? null);
      message.success({
        content: t("profiles.messages.updated"),
        key: "update-profile",
      });
      return true;
    } catch (error) {
      console.error(error);
      message.error({
        content:
          error?.response?.data?.message || t("profiles.messages.updateError"),
        key: "update-profile",
      });
      return false;
    }
  };

  const handleSaveDetails = async (values) => {
    setSaving(true);
    await applyUpdate({
      name: values.name,
      domain: values.domain,
      description: values.description,
      formality: values.formality,
      instructions: values.instructions,
    });
    setSaving(false);
  };

  const handleAddTms = async (selectedIds) => {
    const done = await applyUpdate({
      tmIds: [...attachedTmIds, ...selectedIds],
    });
    if (done) setIsAddTmOpen(false);
  };

  const handleRemoveTm = async (tmId) => {
    await applyUpdate({
      tmIds: attachedTmIds.filter((id) => id !== tmId),
    });
  };

  const handleAddGlossaries = async (selectedIds) => {
    const done = await applyUpdate({
      glossaryIds: [...attachedGlossaryIds, ...selectedIds],
    });
    if (done) setIsAddGlossaryOpen(false);
  };

  const handleRemoveGlossary = async (glossaryId) => {
    await applyUpdate({
      glossaryIds: attachedGlossaryIds.filter((id) => id !== glossaryId),
    });
  };

  const assetColumns = ({ removeTitle, removeDescription, onRemove }) => [
    {
      title: t("table.name"),
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <span className="font-semibold text-slate-900">{name}</span>
          {record.domain ? (
            <div className="mt-1 text-xs text-slate-400">{record.domain}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: t("table.languages"),
      key: "languages",
      width: 170,
      render: (record) => (
        <Space size={6}>
          <Tag color="geekblue" className="rounded-full uppercase">
            {record.sourceLanguage}
          </Tag>
          <span className="text-slate-300">→</span>
          <Tag color="cyan" className="rounded-full uppercase">
            {record.targetLanguage}
          </Tag>
        </Space>
      ),
    },
    {
      title: t("table.actions"),
      key: "actions",
      width: 80,
      render: (record) => (
        <Popconfirm
          title={removeTitle}
          description={removeDescription}
          onConfirm={() => onRemove(record.id)}
          okText={t("actions.yes")}
          cancelText={t("actions.no")}
        >
          <Tooltip title={t("actions.remove")}>
            <Button danger type="text" icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  if (loading) {
    return (
      <Card style={{ marginLeft: 20 }}>
        <div className="flex min-h-[300px] items-center justify-center">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card style={{ marginLeft: 20 }}>
        <Empty description={t("profiles.detail.notFound")} />
        <div className="mt-4 flex justify-center">
          <Link href="/dashboard/profiles">
            <Button icon={<ArrowLeftOutlined />}>{t("common.back")}</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginLeft: 20 }} className="overflow-hidden">
      <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              {t("profiles.eyebrow")}
            </div>
            <h2 className="mb-1 mt-2 text-2xl font-semibold">{profile.name}</h2>
            <p className="m-0 text-sm text-slate-300">
              {t("profiles.detail.subtitle")}
            </p>
          </div>
          <Space wrap>
            <Link href="/dashboard/profiles">
              <Button icon={<ArrowLeftOutlined />}>{t("common.back")}</Button>
            </Link>
          </Space>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <DatabaseOutlined />
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {t("profiles.form.detailsTitle")}
            </div>
            <div className="text-xs text-slate-500">
              {t("profiles.form.detailsSubtitle")}
            </div>
          </div>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveDetails}
          initialValues={{
            name: profile.name,
            domain: profile.domain ?? "",
            description: profile.description ?? "",
            formality: profile.formality ?? "FORMAL",
            instructions: profile.instructions ?? "",
          }}
        >
          <Form.Item
            label={t("profiles.form.nameLabel")}
            name="name"
            rules={[
              { required: true, message: t("profiles.form.nameRequired") },
            ]}
          >
            <Input placeholder={t("profiles.form.namePlaceholder")} />
          </Form.Item>

          <Form.Item
            label={t("profiles.form.descriptionLabel")}
            name="description"
          >
            <Input.TextArea
              rows={2}
              placeholder={t("profiles.form.descriptionPlaceholder")}
            />
          </Form.Item>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              label={t("profiles.form.formalityLabel")}
              name="formality"
              rules={[
                {
                  required: true,
                  message: t("profiles.form.formalityRequired"),
                },
              ]}
            >
              <Select options={formalityOptions} />
            </Form.Item>
            <Form.Item label={t("profiles.form.domainLabel")} name="domain">
              <Input placeholder={t("profiles.form.optional")} />
            </Form.Item>
          </div>
          <Form.Item
            label={t("profiles.form.instructionsLabel")}
            name="instructions"
          >
            <Input.TextArea
              rows={3}
              placeholder={t("profiles.form.instructionsPlaceholder")}
            />
          </Form.Item>
          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              style={{
                background: "linear-gradient(135deg, #111827 0%, #2563eb 100%)",
                border: 0,
              }}
            >
              {t("common.save")}
            </Button>
          </div>
        </Form>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <DatabaseOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("profiles.form.tmsTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("profiles.form.tmsSubtitle")}
                </div>
              </div>
            </div>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              size="small"
              onClick={() => setIsAddTmOpen(true)}
            >
              {t("profiles.detail.add")}
            </Button>
          </div>
          <Table
            dataSource={profile.tms}
            columns={assetColumns({
              removeTitle: t("profiles.detail.removeTmTitle"),
              removeDescription: t("profiles.detail.removeTmDescription"),
              onRemove: handleRemoveTm,
            })}
            rowKey={(record) => record.id}
            size="small"
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("profiles.detail.emptyTms")}
                />
              ),
            }}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <BookOutlined />
              </div>
              <div>
                <div className="font-semibold text-slate-900">
                  {t("profiles.form.glossariesTitle")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("profiles.form.glossariesSubtitle")}
                </div>
              </div>
            </div>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              size="small"
              onClick={() => setIsAddGlossaryOpen(true)}
            >
              {t("profiles.detail.add")}
            </Button>
          </div>
          <Table
            dataSource={profile.glossaries}
            columns={assetColumns({
              removeTitle: t("profiles.detail.removeGlossaryTitle"),
              removeDescription: t("profiles.detail.removeGlossaryDescription"),
              onRemove: handleRemoveGlossary,
            })}
            rowKey={(record) => record.id}
            size="small"
            pagination={false}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("profiles.detail.emptyGlossaries")}
                />
              ),
            }}
          />
        </section>
      </div>

      <AddAssetsModal
        open={isAddTmOpen}
        title={t("profiles.detail.addTmsTitle")}
        options={availableTms.map(toAssetOption)}
        placeholder={t("profiles.form.tmsPlaceholder")}
        notFoundText={t("profiles.detail.noAvailableTms")}
        okText={t("profiles.detail.add")}
        cancelText={t("common.cancel")}
        onClose={() => setIsAddTmOpen(false)}
        onAdd={handleAddTms}
      />

      <AddAssetsModal
        open={isAddGlossaryOpen}
        title={t("profiles.detail.addGlossariesTitle")}
        options={availableGlossaries.map(toAssetOption)}
        placeholder={t("profiles.form.glossariesPlaceholder")}
        notFoundText={t("profiles.detail.noAvailableGlossaries")}
        okText={t("profiles.detail.add")}
        cancelText={t("common.cancel")}
        onClose={() => setIsAddGlossaryOpen(false)}
        onAdd={handleAddGlossaries}
      />
    </Card>
  );
};

export default ProfileDetail;
