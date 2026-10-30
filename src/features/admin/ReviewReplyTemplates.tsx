"use client";
import { useRef, useState } from "react";
import { Alert, Button, Card, Confirm, Empty, Feedback, Field, Loading, useAction } from "@/components/admin/ui";
import { useAdminI18n } from "./i18n/provider";
import { useResource } from "./api";
import type { ReviewReplyTemplate } from "./types";

type Draft = Pick<ReviewReplyTemplate, "name" | "textUk" | "textEn" | "enabled"> & Partial<Pick<ReviewReplyTemplate, "id" | "version">>;
export default function ReviewReplyTemplates() {
  const { date, language, t } = useAdminI18n();
  const resource = useResource<ReviewReplyTemplate[]>("settings/review-replies"), action = useAction(resource.reload);
  const [draft, setDraft] = useState<Draft | null>(null);
  const form = useRef<HTMLFormElement>(null);
  function open(value?: ReviewReplyTemplate) { action.setError(""); action.setSuccess(""); setDraft(value ? { ...value } : { name: "", textUk: "", textEn: "", enabled: true }); }
  return <Card icon="chat" title={t("Шаблони відповідей на відгуки")}>
    <Alert message={resource.error} />{!draft && <Feedback action={action} />}
    <div className="treba-admin-template-heading"><p className="treba-admin-note">{t("Готові відповіді для всієї команди. Модератор обирає шаблон і може змінити текст перед публікацією.")}</p><Button icon="plus" onClick={() => open()}>{t("Додати відповідь")}</Button></div>
    {resource.loading ? <Loading /> : resource.data?.length ? <div className="treba-admin-reply-templates">{resource.data.map(template => <article className="treba-admin-reply-template" key={template.id}><header><h3>{template.name}</h3><span className={`treba-admin-template-state ${template.enabled ? "enabled" : "disabled"}`}>{template.enabled ? t("Доступний") : t("Вимкнений")}</span></header><p>{language === "en" ? template.textEn : template.textUk}</p><footer><small>{t("Оновлено: ")}{date(template.updatedAt)}</small><Button icon="edit" tone="secondary" onClick={() => open(template)}>{t("Редагувати")}</Button></footer></article>)}</div> : !resource.error && <Empty title={t("Шаблонів поки немає")} description={t("Додайте першу готову відповідь для модераторів.")} />}
    {draft && <Confirm title={draft.id ? t("Редагувати шаблон відповіді") : t("Новий шаблон відповіді")} confirmLabel={t("Зберегти шаблон")} confirmIcon="save" busy={action.busy} error={action.error} onClose={() => setDraft(null)} onConfirm={() => form.current?.requestSubmit()}>
      <form ref={form} onSubmit={event => { event.preventDefault(); if (action.busy) return; void action.run("settings/review-replies" + (draft.id ? "/" + draft.id : ""), { name: draft.name.trim(), textUk: draft.textUk.trim(), textEn: draft.textEn.trim(), enabled: draft.enabled, ...(draft.version ? { expectedVersion: draft.version } : {}) }, draft.id ? "PUT" : "POST").then(result => { if (result !== undefined) setDraft(null); }); }}>
        <Field label={t("Назва шаблону")}><input required maxLength={80} value={draft.name} disabled={action.busy} onChange={event => setDraft({ ...draft, name: event.target.value })} /></Field>
        <p className="treba-admin-note">{t("Змінні: {customer} — ім’я покупця, {product} — назва товару. Вони підставляються автоматично.")}</p>
        <Field label={t("Текст українською")}><textarea required rows={4} maxLength={2000} value={draft.textUk} disabled={action.busy} onChange={event => setDraft({ ...draft, textUk: event.target.value })} /></Field><Field label={t("Текст англійською")}><textarea required rows={4} maxLength={2000} value={draft.textEn} disabled={action.busy} onChange={event => setDraft({ ...draft, textEn: event.target.value })} /></Field>
        <label className="treba-admin-template-checkbox"><input type="checkbox" checked={draft.enabled} disabled={action.busy} onChange={event => setDraft({ ...draft, enabled: event.target.checked })} /><span>{t("Доступний для вибору під час модерації")}</span></label><p className="treba-admin-note">{t("Вимкнення шаблону не змінює вже опубліковані відповіді.")}</p>
      </form>
    </Confirm>}
  </Card>;
}
