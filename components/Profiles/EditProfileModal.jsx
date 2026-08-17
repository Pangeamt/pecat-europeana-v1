"use client";
import { Modal } from "antd";

import { useTranslation } from "@/components/i18n/LanguageProvider";
import ProfileForm from "./ProfileForm";

export default function EditProfileModal({
  open,
  profile,
  user,
  onClose,
  onUpdated,
}) {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("profiles.editModalTitle")}
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={null}
      width={900}
    >
      {open && profile ? (
        <ProfileForm
          key={profile.id}
          user={user}
          profile={profile}
          onBack={onClose}
          onSaved={async () => {
            onClose?.();
            await onUpdated?.();
          }}
        />
      ) : null}
    </Modal>
  );
}
