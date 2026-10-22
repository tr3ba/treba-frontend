"use client";

import { useState } from "react";
import { useAuth, UserProfile } from "../../context/AuthContext";
import styles from "./AccountIdentityCard.module.css";

// Верхня картка кабінету
export default function AccountIdentityCard() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draft, setDraft] = useState({
    phone: user?.phone ?? "",
    lastName: user?.lastName ?? "",
    firstName: user?.firstName ?? "",
    patronymic: user?.patronymic ?? "",
  });

  if (!user) return null;

  function startEditing() {
    setSaveError("");
    setDraft({
      phone: user!.phone ?? "",
      lastName: user!.lastName ?? "",
      firstName: user!.firstName ?? "",
      patronymic: user!.patronymic ?? "",
    });
    setIsEditing(true);
  }

  async function save() {
    if (saving) return;
    const patch: UserProfile = { ...draft };
    setSaving(true); setSaveError("");
    try { await updateProfile(patch); setIsEditing(false); }
    catch (error) { setSaveError(error instanceof Error ? error.message : "Не вдалося зберегти профіль."); }
    finally { setSaving(false); }
  }

  return (
    <section className={styles.card}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Мій акаунт TREBA</h1>
        {isEditing ? (
          <div className={styles.actionsRow}>
            <button type="button" className={styles.saveButton} onClick={save} disabled={saving}>
              {saving ? "Зберігаємо…" : "Зберегти"}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setIsEditing(false)}
              disabled={saving}
            >
              Скасувати
            </button>
          </div>
        ) : (
          <button type="button" className={styles.editButton} onClick={startEditing}>
            Редагувати
          </button>
        )}
      </div>

      {saveError && <p role="alert">{saveError}</p>}

      <div className={styles.loginBlock}>
        <span className={styles.fieldLabel}>Логін (email)</span>
        <p className={styles.loginValue}>{user.email}</p>
      </div>

      {isEditing ? (
        <div className={styles.fieldsGrid}>
          <label className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>Телефон</span>
            <input
              type="text"
              className={styles.input}
              placeholder="+38 (0__) ___ __ __"
              value={draft.phone}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
            />
          </label>
          <label className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>Прізвище</span>
            <input
              type="text"
              className={styles.input}
              value={draft.lastName}
              onChange={(e) => setDraft((p) => ({ ...p, lastName: e.target.value }))}
            />
          </label>
          <label className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>Ім&apos;я</span>
            <input
              type="text"
              className={styles.input}
              value={draft.firstName}
              onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))}
            />
          </label>
          <label className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>По батькові</span>
            <input
              type="text"
              className={styles.input}
              value={draft.patronymic}
              onChange={(e) =>
                setDraft((p) => ({ ...p, patronymic: e.target.value }))
              }
            />
          </label>
        </div>
      ) : (
        <div className={styles.fieldsGrid}>
          <div className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>Телефон</span>
            <p className={styles.value}>{user.phone || "—"}</p>
          </div>
          <div className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>Прізвище</span>
            <p className={styles.value}>{user.lastName || "—"}</p>
          </div>
          <div className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>Ім&apos;я</span>
            <p className={styles.value}>{user.firstName || "—"}</p>
          </div>
          <div className={styles.fieldLabelWrap}>
            <span className={styles.fieldLabel}>По батькові</span>
            <p className={styles.value}>{user.patronymic || "—"}</p>
          </div>
        </div>
      )}
    </section>
  );
}
