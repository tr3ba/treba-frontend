"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type LoginChallenge } from "../../context/AuthContext";
import { buildAuthHref, getSafeNextPath } from "../../lib/redirect";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "./Icons";
import styles from "./AuthForm.module.css";

type LoginFormProps = {
  /** Если задан (модалка), вызывается после входа вместо перехода по ?next */
  onSuccess?: () => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verify, sendEmailCode } = useAuth();
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [method, setMethod] = useState("authenticator");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Куда вернуть после входа (?next=/sell#apply)
  const nextParam = searchParams.get("next");
  const nextPath = getSafeNextPath(nextParam);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState("");

  function validate() {
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = "Вкажіть email або телефон";
    }

    if (!password) {
      nextErrors.password = "Вкажіть пароль";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (busy || (!challenge && !validate())) return;

    try {
      setBusy(true);
      if (challenge) await verify(challenge.challengeId, method, code, rememberMe);
      else {
        const next = await login(email, password, rememberMe);
        if (next) { setChallenge(next); setMethod(next.methods[0]); setPassword(""); return; }
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Помилка входу");
    } finally { setBusy(false); }
  }

  function handleSocialClick() {
    setFormError("Вхід через соцмережі буде доступний пізніше");
  }

  return (
    <>
      <div className={styles.formColumn}>
        <h1 className={styles.title}>Вхід</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {challenge ? <>
            <p>Підтвердьте вхід до акаунта.</p>
            <select aria-label="Спосіб підтвердження" className={styles.input} value={method} onChange={event => setMethod(event.target.value)}>
              {challenge.methods.map(value => <option key={value} value={value}>{value === "email" ? `Код на ${challenge.maskedEmail}` : "Застосунок автентифікації"}</option>)}
            </select>
            {method === "email" && <button type="button" disabled={busy} onClick={async () => { setBusy(true); setFormError(""); try { await sendEmailCode(challenge.challengeId); } catch (error) { setFormError(error instanceof Error ? error.message : "Не вдалося надіслати код"); } finally { setBusy(false); } }}>Надіслати код</button>}
            <input className={styles.input} aria-label="Код підтвердження" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={event => setCode(event.target.value)} />
          </> : <>
          <label className={styles.field}>
            <input
              type="text"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ел. пошта або телефон"
              autoComplete="username"
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </label>

          <label className={styles.field}>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </label>

          <div className={styles.optionsRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Запам&apos;ятати мене
            </label>

            <button type="button" className={styles.textLink}>
              Нагадати пароль
            </button>
          </div>

          </>}
          {formError && <p className={styles.formError} role="alert">{formError}</p>}

          <button type="submit" className={styles.submitButton} disabled={busy}>
            {busy ? "Перевіряємо…" : challenge ? "Підтвердити вхід" : "Увійти"}
          </button>
        </form>

        <p className={styles.switchText}>
          {/* replace: в истории не копится «вхід → реєстрація», back() вернёт на исходную страницу */}
          <Link
            href={buildAuthHref("/register", nextParam ? nextPath : undefined)}
            replace
            className={styles.switchLink}
          >
            Зареєструватися
          </Link>
        </p>
      </div>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>або</span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.socialColumn}>
        <p className={styles.socialTitle}>Увійти як користувач</p>

        <button
          type="button"
          className={styles.socialButton}
          onClick={handleSocialClick}
        >
          <img src="/icons/facebook.svg" alt="" className={styles.socialIcon} />
          Facebook
        </button>

        <button
          type="button"
          className={styles.socialButton}
          onClick={handleSocialClick}
        >
          <GoogleIcon />
          Google
        </button>
      </div>
    </>
  );
}
