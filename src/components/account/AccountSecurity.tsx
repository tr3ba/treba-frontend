"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { configuredProvider } from "@/lib/api/account-security";
import type { LoginChallenge } from "@/context/AuthContext";
import styles from "./AccountSecurity.module.css";

type Kind = "email" | "link";
type Scope = "customer" | "staff";
type Settings = { emailVerified: boolean; emailTwoFactorEnabled: boolean; authenticatorEnabled: boolean };
type Proof = { challengeId: string; method: string; code: string };
type Pending = { message?: string; linked?: string; challenge?: LoginChallenge | null; changeKind?: Kind; target?: string };
type Setup = { settings: Settings; email: string; providers: { name: string }[]; pending?: Pending };
async function request<T>(scope: Scope, action: string, values: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch("/shop-api/account-security", { method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, scope, action }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Не вдалося виконати дію.");
  return data;
}
export default function AccountSecurity({ scope }: { scope: Scope }) {
  const { t, error: localizeError } = useAdminI18n();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [kind, setKind] = useState<Kind>("email");
  const [target, setTarget] = useState("");
  const [provider, setProvider] = useState("google");
  const [stage, setStage] = useState<"start" | "primary" | "mfa" | "confirm" | "email-setup">("start");
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [confirmation, setConfirmation] = useState<{ challengeId: string; expiresAt?: string } | null>(null);
  const [method, setMethod] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function begin(changeKind: Kind, value: string, secondFactor?: Proof) {
    const result = await request<{ challengeId: string; expiresAt: string }>(scope, "begin-" + changeKind, { target: value, secondFactor });
    setKind(changeKind); setTarget(value); setConfirmation(result); setStage("confirm");
    setPassword(""); setCode(""); setNewCode(""); setChallenge(null); setMethod("");
  }
  useEffect(() => {
    let active = true;
    void fetch("/shop-api/account-security?scope=" + scope, { cache: "no-store" }).then(async response => {
      const data: Setup & { message?: string } = await response.json();
      if (!response.ok) throw new Error(data.message || "Не вдалося завантажити налаштування захисту.");
      if (!active) return;
      setSetup(data);
      setProvider(configuredProvider(data.providers));
      const pending = data.pending;
      if (pending?.message) setError(pending.message);
      if (pending?.linked) setNotice(t("Обліковий запис провайдера підключено."));
      if (pending?.changeKind && typeof pending.target === "string") {
        setKind(pending.changeKind); setTarget(pending.target);
        if (pending.changeKind === "link") setProvider(pending.target);
        if (pending.challenge) { setChallenge(pending.challenge); setStage("mfa"); }
        else { setBusy(true); try { await begin(pending.changeKind, pending.target); } finally { if (active) setBusy(false); } }
      }
    }).catch(value => { if (active) setError(value instanceof Error ? value.message : "Не вдалося виконати дію."); });
    return () => { active = false; };
    // A returned OAuth proof is consumed only by an explicit account operation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await work(); } catch (value) { setError(value instanceof Error ? value.message : "Не вдалося виконати дію."); }
    finally { setBusy(false); }
  }
  function reset() { setStage("start"); setChallenge(null); setConfirmation(null); setCode(""); setNewCode(""); setPassword(""); setMethod(""); setError(""); }
  async function oauth(selected: string, purpose: "reauth" | "link") {
    const response = await fetch(`/shop-api/external/${selected}/start`, { method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, purpose, changeKind: kind,
        target: kind === "email" ? target : provider, confirmationChallengeId: confirmation?.challengeId, confirmationCode: code }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Не вдалося почати підтвердження.");
    window.location.assign(data.url);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      if (stage === "start") {
        if (setup?.settings.authenticatorEnabled || setup?.settings.emailTwoFactorEnabled) { setTarget(kind === "email" ? target : provider); setStage("primary"); }
        else await begin(kind, kind === "email" ? target : provider);
      } else if (stage === "primary") {
        const result = await request<{ challenge: LoginChallenge | null }>(scope, "reauthenticate", { password });
        setPassword("");
        if (result.challenge) { setChallenge(result.challenge); setStage("mfa"); }
        else await begin(kind, target);
      } else if (stage === "mfa" && challenge) {
        await begin(kind, target, { challengeId: challenge.challengeId, method, code });
      } else if (stage === "email-setup" && confirmation) {
        await request<Settings>(scope, "email-confirm", { challengeId: confirmation.challengeId, code });
        window.location.assign("/login?next=" + encodeURIComponent(scope === "staff" ? "/admin/profile" : "/account"));
      } else if (stage === "confirm" && confirmation) {
        if (kind === "link") await oauth(provider, "link");
        else {
          await request(scope, "confirm-email", { challengeId: confirmation.challengeId, currentEmailCode: code, newEmailCode: newCode });
          window.location.assign("/login?next=" + encodeURIComponent(scope === "staff" ? "/admin/profile" : "/account"));
        }
      }
    });
  }
  const methods = challenge?.methods.filter(value => value === "email" || value === "authenticator") ?? [];
  return <section className={styles.card} aria-label={t("Email та соціальні входи")}>
    <h2>{t("Email та соціальні входи")}</h2>
    <p>{setup?.email}</p>
    <p>{t("Зміна реквізитів потребує підтвердження власника акаунта.")}</p>
    {error && <p role="alert" className={styles.error}>{localizeError(error)}</p>}
    {notice && <p role="status">{notice}</p>}
    {!setup ? <p>{t("Завантаження…")}</p> : <>
      {!setup.settings.emailTwoFactorEnabled && <button type="button" disabled={busy} onClick={() => void run(async () => {
        const value = await request<{ challengeId: string }>(scope, "email-setup");
        setConfirmation(value); setCode(""); setStage("email-setup");
      })}>{t("Підтвердити поточну пошту та увімкнути email-коди")}</button>}
      <form onSubmit={submit} className={styles.form}>
        {stage === "start" && <>
          <label>{t("Дія")}<select value={kind} disabled={busy} onChange={e => { setKind(e.target.value as Kind); setTarget(""); }}>
            <option value="email">{t("Змінити email")}</option><option value="link">{t("Підключити Google або Facebook")}</option>
          </select></label>
          {kind === "email" ? <label>{t("Нова електронна адреса")}<input type="email" maxLength={320} required value={target} onChange={e => setTarget(e.target.value)} autoComplete="email" /></label>
            : <label>{t("Провайдер")}<select value={provider} onChange={e => setProvider(e.target.value)}>{setup.providers.filter(p => ["google", "facebook"].includes(p.name)).map(p => <option key={p.name} value={p.name}>{p.name === "google" ? "Google" : "Facebook"}</option>)}</select></label>}
        </>}
        {stage === "primary" && <>
          <p>{t("Підтвердіть вхід у поточний акаунт.")}</p>
          <label>{t("Поточний пароль")}<input type="password" required maxLength={72} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <div className={styles.actions}>{setup.providers.map(p => <button type="button" key={p.name} disabled={busy} onClick={() => void run(() => oauth(p.name, "reauth"))}>{t("Підтвердити через {0}", [p.name === "google" ? "Google" : "Facebook"])}</button>)}</div>
        </>}
        {stage === "mfa" && <>
          <p>{t("Оберіть поточний другий фактор.")}</p>
          {!methods.length && <p>{t("Для цієї дії увімкніть підтвердження поштою, а потім почніть її ще раз.")}</p>}
          <div className={styles.actions}>{methods.map(value => <button type="button" key={value} disabled={busy} aria-pressed={method === value} onClick={() => void run(async () => {
            if (value === "email") await request(scope, "send-mfa", { challengeId: challenge!.challengeId });
            setMethod(value); setCode("");
          })}>{value === "email" ? t("Код із пошти") : "Authenticator"}</button>)}</div>
        </>}
        {(stage === "confirm" || stage === "email-setup" || stage === "mfa" && method) && <>
          <label>{stage === "mfa" ? t("Код другого фактора") : t("Код із поточної пошти")}<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} /></label>
          {stage === "confirm" && kind === "email" && <label>{t("Код із нової пошти")}<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={newCode} onChange={e => setNewCode(e.target.value.replace(/\D/g, ""))} /></label>}
        </>}
        <div className={styles.actions}>
          <button type="submit" disabled={busy || !setup.settings.emailVerified && stage === "start" || stage === "mfa" && !method || kind === "link" && stage === "start" && !setup.providers.length}>{busy ? t("Перевіряємо…") : stage === "confirm" && kind === "link" ? t("Підтвердити та перейти до провайдера") : t("Продовжити")}</button>
          {stage !== "start" && <button type="button" disabled={busy} onClick={reset}>{t("Почати спочатку")}</button>}
        </div>
      </form>
    </>}
  </section>;
}
