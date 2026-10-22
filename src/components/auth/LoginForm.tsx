"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type LoginChallenge, type User } from "../../context/AuthContext";
import { buildAuthHref, getSafeNextPath } from "../../lib/redirect";
import { getLoginDestination } from "../../lib/admin";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "./Icons";
import styles from "./AuthForm.module.css";
import GuardVerification from "./GuardVerification";
import Icon from "../common/Icon";

type LoginFormProps = {
  /** Закрывает модалку покупателя, если нет явного адреса возврата. */
  onSuccess?: () => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verify, sendEmailCode } = useAuth();
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [method, setMethod] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Куда вернуть после входа (?next=/sell#apply)
  const nextParam = searchParams.get("next");
  const nextPath = getSafeNextPath(nextParam);
  useEffect(() => {
    if (nextParam && nextParam !== nextPath) window.history.replaceState(null, "", buildAuthHref("/login", nextPath));
  }, [nextParam, nextPath]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState("");
  useEffect(() => {
    if (!challenge) return;
    const remaining = Date.parse(challenge.expiresAt) - Date.now();
    const timer = setTimeout(() => {
      setChallenge(null); setMethod(""); setCode("");
      setFormError("Час підтвердження минув. Введіть пароль і спробуйте ще раз.");
    }, Number.isFinite(remaining) ? Math.max(0, remaining) : 0);
    return () => clearTimeout(timer);
  }, [challenge]);

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
      let authenticatedUser: User;
      if (challenge) authenticatedUser = await verify(challenge.challengeId, method, code, rememberMe);
      else {
        const result = await login(email, password, rememberMe);
        if (result.challenge) { setChallenge(result.challenge); setMethod(""); setPassword(""); return; }
        authenticatedUser = result.user;
      }
      finishLogin(authenticatedUser);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Помилка входу");
    } finally { setBusy(false); }
  }

  function finishLogin(authenticatedUser: User) {
    const destination = getLoginDestination(authenticatedUser.role, nextParam);
    if (destination) window.location.replace(destination);
    else if (onSuccess) onSuccess();
    else router.replace(nextPath);
  }
  async function chooseMethod(value: string) {
    if (busy || !challenge) return;
    setBusy(true); setFormError(""); setCode("");
    try { if (value === "email") await sendEmailCode(challenge.challengeId); setMethod(value); }
    catch (error) { setFormError(error instanceof Error ? error.message : "Не вдалося надіслати код."); }
    finally { setBusy(false); }
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
            {!method ? <>
              <h2>Підтвердьте вхід</h2><p>Оберіть один із підключених способів.</p>
              <div className={styles.verificationMethods}>{challenge.methods.map(value => <button key={value} type="button" disabled={busy} onClick={() => chooseMethod(value)}>
                <strong>{value === "telegram" ? "Telegram Guard" : value === "email" ? "Код на пошту" : "Google Authenticator"}</strong>
                <span>{value === "telegram" ? "Підтвердьте вхід у Telegram" : value === "email" ? challenge.maskedEmail : "Введіть код із застосунку"}</span>
              </button>)}</div>
            </> : <>
              <button type="button" className={styles.textLink} onClick={() => { setMethod(""); setFormError(""); }} disabled={busy}>← Обрати інший спосіб</button>
              {method === "telegram" ? <GuardVerification key={challenge.challengeId} challengeId={challenge.challengeId} remember={rememberMe} onVerified={finishLogin} /> : <>
                <p>{method === "email" ? `Код надіслано на ${challenge.maskedEmail}` : "Введіть код із Google Authenticator."}</p>
                <input className={styles.input} aria-label="Код підтвердження" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} />
                {method === "email" && <button type="button" className={styles.textLink} disabled={busy} onClick={() => chooseMethod("email")}>Надіслати код ще раз</button>}
              </>}
            </>}
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

          {(!challenge || !!method && method !== "telegram") && <button type="submit" className={styles.submitButton} disabled={busy || !!challenge && code.length !== 6}>
            {busy ? "Перевіряємо…" : challenge ? "Підтвердити вхід" : "Увійти"}
          </button>}
        </form>

        {!challenge && <p className={styles.switchText}>
          <a
            href={buildAuthHref("/register", nextParam ? nextPath : undefined)}
            className={styles.switchLink}
          >
            Зареєструватися
          </a>
        </p>}
      </div>

      {!challenge && <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>або</span>
        <span className={styles.dividerLine} />
      </div>}

      {!challenge && <div className={styles.socialColumn}>
        <p className={styles.socialTitle}>Увійти як користувач</p>

        <button
          type="button"
          className={styles.socialButton}
          onClick={handleSocialClick}
        >
          <Icon src="/icons/facebook.svg" alt="" className={styles.socialIcon} />
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
      </div>}
    </>
  );
}
