"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSizeProfiles, removeSizeProfile, saveSizeProfile } from "../../lib/api/sizes";
import type { SizeProfile, SizeProfileInput } from "../../types/sizes";
import PageTitle from "./PageTitle";
import EmptyState from "./EmptyState";
import SizeProfileCard from "./SizeProfileCard";
import SizeProfileForm from "./SizeProfileForm";
import styles from "./SizesView.module.css";

// Что сейчас открыто в форме: новый профиль или редактирование существующего
type FormTarget = { mode: "create" } | { mode: "edit"; profile: SizeProfile } | null;

// Розділ кабінету «Розміри»: список профілів + форма
export default function SizesView() {
  const { user } = useAuth();
  const userId = user?.id;

  const [profiles, setProfiles] = useState<SizeProfile[] | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getSizeProfiles(userId).then((list) => {
      if (!cancelled) setProfiles(list);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // форма открылась или сменился профиль — прокручиваем к ней
  useEffect(() => {
    if (formTarget) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [formTarget]);

  if (!userId) return null;
  const uid: string = userId;

  async function handleSubmit(input: SizeProfileInput) {
    const editingId = formTarget?.mode === "edit" ? formTarget.profile.id : undefined;
    // ошибка пробрасывается в форму
    const next = await saveSizeProfile(uid, input, editingId);
    setProfiles(next);
    setFormTarget(null);
  }

  async function handleRemove(profile: SizeProfile) {
    if (!window.confirm(`Видалити профіль «${profile.name}»?`)) return;
    setIsBusy(true);
    setError(null);
    try {
      setProfiles(await removeSizeProfile(uid, profile.id));
      // удалили тот, что сейчас редактируется — закрываем форму
      if (formTarget?.mode === "edit" && formTarget.profile.id === profile.id) {
        setFormTarget(null);
      }
    } catch {
      setError("Не вдалося видалити профіль. Спробуйте ще раз.");
    } finally {
      setIsBusy(false);
    }
  }

  const formKey = formTarget?.mode === "edit" ? formTarget.profile.id : "new";

  return (
    <>
      <PageTitle>Розміри</PageTitle>

      {profiles === null ? (
        <p className={styles.loading}>Завантаження…</p>
      ) : (
        <>
          {profiles.length === 0 && !formTarget && (
            <EmptyState
              icon="/icons/clothes.svg"
              title="Профілі відсутні"
              subtitle="Ви ще не створювали профілів з розмірами одягу — це допоможе швидше підбирати потрібний розмір"
              actionLabel="Створити профіль"
              onAction={() => setFormTarget({ mode: "create" })}
            />
          )}

          {profiles.length > 0 && (
            <div className={styles.list}>
              {profiles.map((profile) => (
                <SizeProfileCard
                  key={profile.id}
                  profile={profile}
                  disabled={isBusy}
                  onEdit={(item) => setFormTarget({ mode: "edit", profile: item })}
                  onRemove={handleRemove}
                />
              ))}

              {!formTarget && (
                <button type="button" className={styles.addButton} onClick={() => setFormTarget({ mode: "create" })}>
                  <span className={styles.plus} aria-hidden="true">
                    +
                  </span>
                  Додати профіль
                </button>
              )}
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          {formTarget && (
            <div ref={formRef} className={styles.formWrap}>
              {/* key — чтобы при смене профиля форма заполнилась заново */}
              <SizeProfileForm
                key={formKey}
                initial={formTarget.mode === "edit" ? formTarget.profile : undefined}
                onSubmit={handleSubmit}
                onCancel={() => setFormTarget(null)}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}