"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth, type PasswordResetChallenge } from "../../context/AuthContext";
import { EyeIcon, EyeOffIcon } from "./Icons";
import styles from "./AuthForm.module.css";

export default function ForgotPasswordForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { requestPasswordReset, completePasswordReset } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [method, setMethod] = useState<"email" | "sms" | "">("");
  const [methods, setMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<PasswordResetChallenge | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/shop-api/password-reset/methods", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (active) setMethods(Array.isArray(data.methods) ? data.methods : []);
    }).catch(() => { if (active) setError("Не вдалося завантажити способи підтвердження. Спробуйте відкрити відновлення ще раз."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!challenge) return;
    const update = () => setResendIn(Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - Date.now()) / 1000)));
    update(); const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [challenge]);

  async function sendCode() {
    if (!method || !methods.includes(method)) { setError("Оберіть спосіб підтвердження."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Вкажіть електронну пошту акаунта."); return; }
    setBusy(true); setError("");
    try { setChallenge(await requestPasswordReset(email.trim(), method)); setCode(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Не вдалося надіслати код."); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!challenge) { await sendCode(); return; }
    if (!/^[0-9]{6}$/.test(code)) { setError("Введіть шестизначний код підтвердження."); return; }
    if (password.length < 8 || password.length > 72 || new TextEncoder().encode(password).length > 72
      || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Пароль має містити 8–72 символи, великі й малі латинські літери та цифру (до 72 байтів UTF-8)."); return;
    }
    if (password !== confirmation) { setError("Паролі не збігаються."); return; }
    setBusy(true); setError("");
    try { await completePasswordReset(challenge.challengeId, code, password); setPassword(""); setConfirmation(""); setCode(""); setComplete(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Не вдалося змінити пароль."); }
    finally { setBusy(false); }
  }

  return <div className={styles.formColumn}>
    <h1 className={styles.title}>Відновлення пароля</h1>
    {complete ? <>
      <p role="status">Пароль змінено. Увійдіть з новим паролем.</p>
      <button type="button" className={styles.submitButton} onClick={onBack}>Перейти до входу</button>
    </> : <form className={styles.form} onSubmit={submit} noValidate>
      {challenge ? <>
        <p role="status">{challenge.message}</p>
        <p className={styles.hintText}>Код діє до {new Date(challenge.expiresAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}.</p>
        <label className={styles.field}>
          <span>Код підтвердження</span>
          <input className={styles.input} autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} disabled={busy} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} />
        </label>
        <label className={styles.field}>
          <span>Новий пароль</span>
          <div className={styles.passwordWrapper}>
            <input className={styles.input} type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={72} value={password} disabled={busy} onChange={event => setPassword(event.target.value)} />
            <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <span className={styles.hintText}>8–72 символи, великі й малі латинські літери та цифра.</span>
        </label>
        <label className={styles.field}>
          <span>Повторіть новий пароль</span>
          <input className={styles.input} type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={72} value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} />
        </label>
        <button type="button" className={styles.textLink} disabled={busy || resendIn > 0} onClick={sendCode}>
          {resendIn > 0 ? `Надіслати ще раз через ${resendIn} с` : "Надіслати код ще раз"}
        </button>
        <button type="button" className={styles.textLink} disabled={busy} onClick={() => { setChallenge(null); setCode(""); setPassword(""); setConfirmation(""); setError(""); }}>← Обрати інший спосіб або змінити пошту</button>
      </> : <>
        <p>Вкажіть пошту акаунта. Код надійде лише на підтверджену пошту або підтверджений номер телефону.</p>
        <label className={styles.field}>
          <span>Електронна пошта акаунта</span>
          <input className={styles.input} type="email" autoComplete="username" value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
        </label>
        <fieldset className={styles.registrationMethods} disabled={busy || loading}>
          <legend>Як підтвердити зміну пароля?</legend>
          {(["email", "sms"] as const).map(value => <label key={value}>
            <input type="radio" name="passwordResetMethod" value={value} checked={method === value} disabled={!methods.includes(value)} onChange={() => setMethod(value)} />
            <span>{value === "email" ? "Код на пошту" : "Код у SMS"}{!loading && !methods.includes(value) ? " — тимчасово недоступно" : ""}</span>
          </label>)}
        </fieldset>
      </>}
      {error && <p className={styles.formError} role="alert">{error}</p>}
      <button type="submit" className={styles.submitButton} disabled={busy || loading || !methods.length || !!challenge && code.length !== 6}>
        {busy ? "Зачекайте…" : challenge ? "Змінити пароль" : "Отримати код підтвердження"}
      </button>
      <button type="button" className={styles.textLink} onClick={onBack} disabled={busy}>← Повернутися до входу</button>
    </form>}
  </div>;
}
