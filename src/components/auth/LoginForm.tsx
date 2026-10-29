"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { message } from "@/features/admin/i18n/core";
import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAuth,
  type LoginChallenge,
  type User,
} from "../../context/AuthContext";
import { buildAuthHref, getSafeNextPath } from "../../lib/redirect";
import { getLoginDestination } from "../../lib/admin";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "./Icons";
import styles from "./AuthForm.module.css";
import GuardVerification from "./GuardVerification";
import Icon from "../common/Icon";
import ForgotPasswordForm from "./ForgotPasswordForm";
type LoginFormProps = {
  /** Закрывает модалку покупателя, если нет явного адреса возврата. */
  onSuccess?: () => void;
};
export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { t, error: localizeError } = useAdminI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verify, sendEmailCode } = useAuth();
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [method, setMethod] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoverPassword, setRecoverPassword] = useState(false);
  // Куда вернуть после входа (?next=/sell#apply)
  const nextParam = searchParams.get("next");
  const nextPath = getSafeNextPath(nextParam);
  useEffect(() => {
    if (nextParam && nextParam !== nextPath)
      window.history.replaceState(null, "", buildAuthHref("/login", nextPath));
  }, [nextParam, nextPath]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const external = searchParams.get("external");
  useEffect(() => {
    if (external !== "1") return;
    let active = true;
    void fetch("/shop-api/external/pending", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!active) return;
        if (result.challenge) {
          setChallenge(result.challenge);
          setMethod("");
          setRememberMe(result.remember !== false);
        } else
          setFormError(
            result.message ?? message("Не вдалося підтвердити вхід."),
          );
      })
      .catch(() => {
        if (active)
          setFormError(message("Не вдалося завершити вхід. Спробуйте ще раз."));
      });
    return () => {
      active = false;
    };
  }, [external]);
  useEffect(() => {
    if (!challenge) return;
    const remaining = Date.parse(challenge.expiresAt) - Date.now();
    const timer = setTimeout(
      () => {
        setChallenge(null);
        setMethod("");
        setCode("");
        setFormError(message("Час підтвердження минув. Почніть вхід ще раз."));
      },
      Number.isFinite(remaining) ? Math.max(0, remaining) : 0,
    );
    return () => clearTimeout(timer);
  }, [challenge]);
  function validate() {
    const nextErrors: {
      email?: string;
      password?: string;
    } = {};
    if (!email.trim()) {
      nextErrors.email = t("Вкажіть email або телефон");
    }
    if (!password) {
      nextErrors.password = t("Вкажіть пароль");
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
      if (challenge)
        authenticatedUser = await verify(
          challenge.challengeId,
          method,
          code,
          rememberMe,
        );
      else {
        const result = await login(email, password, rememberMe);
        if (result.challenge) {
          setChallenge(result.challenge);
          setMethod("");
          setPassword("");
          return;
        }
        authenticatedUser = result.user;
      }
      finishLogin(authenticatedUser);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("Помилка входу"));
    } finally {
      setBusy(false);
    }
  }
  function finishLogin(authenticatedUser: User) {
    const destination = getLoginDestination(authenticatedUser.role, nextParam);
    if (destination) window.location.replace(destination);
    else if (onSuccess) onSuccess();
    else router.replace(nextPath);
  }
  async function chooseMethod(value: string) {
    if (busy || !challenge) return;
    setBusy(true);
    setFormError("");
    setCode("");
    try {
      if (value === "email") await sendEmailCode(challenge.challengeId);
      setMethod(value);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t("Не вдалося надіслати код."),
      );
    } finally {
      setBusy(false);
    }
  }
  function handleSocialClick(provider: "google" | "facebook") {
    if (busy) return;
    setBusy(true);
    window.location.assign(
      `/shop-api/external/${provider}/start?${new URLSearchParams({ next: nextPath, remember: rememberMe ? "1" : "0" })}`,
    );
  }
  if (recoverPassword)
    return (
      <ForgotPasswordForm
        initialEmail={email}
        onBack={() => {
          setRecoverPassword(false);
          setPassword("");
          setFormError("");
        }}
      />
    );
  return (
    <>
      <div className={styles.formColumn}>
        <h1 className={styles.title}>{t("Вхід")}</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {challenge ? (
            <>
              {!method ? (
                <>
                  <h2>{t("Підтвердьте вхід")}</h2>
                  <p>{t("Оберіть один із підключених способів.")}</p>
                  <div className={styles.verificationMethods}>
                    {challenge.methods.map((value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={busy}
                        onClick={() => chooseMethod(value)}
                      >
                        <strong>
                          {value === "telegram"
                            ? "Telegram Guard"
                            : value === "email"
                              ? t("Код на пошту")
                              : "Google Authenticator"}
                        </strong>
                        <span>
                          {value === "telegram"
                            ? t("Підтвердьте вхід у Telegram")
                            : value === "email"
                              ? challenge.maskedEmail
                              : t("Введіть код із застосунку")}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.textLink}
                    onClick={() => {
                      setMethod("");
                      setFormError("");
                    }}
                    disabled={busy}
                  >
                    {t("← Обрати інший спосіб")}
                  </button>
                  {method === "telegram" ? (
                    <GuardVerification
                      key={challenge.challengeId}
                      challengeId={challenge.challengeId}
                      remember={rememberMe}
                      onVerified={finishLogin}
                    />
                  ) : (
                    <>
                      <p>
                        {method === "email"
                          ? t("Код надіслано на {0}", [challenge.maskedEmail])
                          : t("Введіть код із Google Authenticator.")}
                      </p>
                      <input
                        className={styles.input}
                        aria-label={t("Код підтвердження")}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, ""))
                        }
                      />
                      {method === "email" && (
                        <button
                          type="button"
                          className={styles.textLink}
                          disabled={busy}
                          onClick={() => chooseMethod("email")}
                        >
                          {t("Надіслати код ще раз")}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <label className={styles.field}>
                <input
                  type="text"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("Ел. пошта або телефон")}
                  autoComplete="username"
                />
                {errors.email && (
                  <span className={styles.errorText}>
                    {localizeError(errors.email ?? "")}
                  </span>
                )}
              </label>

              <label className={styles.field}>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("Пароль")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? t("Приховати пароль")
                        : t("Показати пароль")
                    }
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.errorText}>
                    {localizeError(errors.password ?? "")}
                  </span>
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
                  {t("Запам'ятати мене")}
                </label>

                <button
                  type="button"
                  className={styles.textLink}
                  disabled={busy}
                  onClick={() => {
                    setPassword("");
                    setRecoverPassword(true);
                  }}
                >
                  {t("Забули пароль?")}
                </button>
              </div>
            </>
          )}
          {formError && (
            <p className={styles.formError} role="alert">
              {localizeError(formError)}
            </p>
          )}

          {(!challenge || (!!method && method !== "telegram")) && (
            <button
              type="submit"
              className={styles.submitButton}
              disabled={busy || (!!challenge && code.length !== 6)}
            >
              {busy
                ? t("Перевіряємо…")
                : challenge
                  ? t("Підтвердити вхід")
                  : t("Увійти")}
            </button>
          )}
        </form>

        {!challenge && (
          <p className={styles.switchText}>
            <a
              href={buildAuthHref(
                "/register",
                nextParam ? nextPath : undefined,
              )}
              className={styles.switchLink}
            >
              {t("Зареєструватися")}
            </a>
          </p>
        )}
      </div>

      {!challenge && (
        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>{t("або")}</span>
          <span className={styles.dividerLine} />
        </div>
      )}

      {!challenge && (
        <div className={styles.socialColumn}>
          <p className={styles.socialTitle}>{t("Увійти як користувач")}</p>

          <button
            type="button"
            className={styles.socialButton}
            onClick={() => handleSocialClick("facebook")}
            disabled={busy}
          >
            <Icon
              src="/icons/facebook.svg"
              alt=""
              className={styles.socialIcon}
            />
            Facebook
          </button>

          <button
            type="button"
            className={styles.socialButton}
            onClick={() => handleSocialClick("google")}
            disabled={busy}
          >
            <GoogleIcon />
            Google
          </button>
        </div>
      )}
    </>
  );
}
