"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type RegistrationChallenge } from "../../context/AuthContext";
import { buildAuthHref, getSafeNextPath } from "../../lib/redirect";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "./Icons";
import styles from "./AuthForm.module.css";
import Icon from "../common/Icon";

type FormErrors = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
  agree?: string;
  verificationMethod?: string;
};

type RegisterFormProps = {
  /** Если задан (модалка), вызывается после регистрации вместо перехода по ?next */
  onSuccess?: () => void;
};

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verifyRegistration, resendRegistration } = useAuth();

  // Куда вернуть после регистрации (?next=/sell#apply)
  const nextParam = searchParams.get("next");
  const nextPath = getSafeNextPath(nextParam);
  useEffect(() => {
    if (nextParam && nextParam !== nextPath) window.history.replaceState(null, "", buildAuthHref("/register", nextPath));
  }, [nextParam, nextPath]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"email" | "sms" | "">("");
  const [methods, setMethods] = useState<string[]>([]);
  const [methodsLoaded, setMethodsLoaded] = useState(false);
  const [challenge, setChallenge] = useState<RegistrationChallenge | null>(null);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    let active = true;
    void fetch("/shop-api/registration/methods", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      if (active) setMethods(Array.isArray(result.methods) ? result.methods : []);
    }).catch(() => { if (active) setFormError("Не вдалося завантажити способи підтвердження. Оновіть сторінку."); })
      .finally(() => { if (active) setMethodsLoaded(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!challenge) return;
    const update = () => setResendIn(Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [challenge]);

  function isPasswordValid(value: string) {
    return (
      value.length >= 8 && value.length <= 72 &&
      /[0-9]/.test(value) &&
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value)
    );
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!firstName.trim()) nextErrors.firstName = "Вкажіть ім'я";
    if (!lastName.trim()) nextErrors.lastName = "Вкажіть прізвище";
    if (method === "sms" && !phone.trim()) nextErrors.phone = "Вкажіть номер телефону для SMS";
    if (!method || !methods.includes(method)) nextErrors.verificationMethod = "Оберіть спосіб підтвердження";

    if (!email.trim()) {
      nextErrors.email = "Вкажіть ел. пошту";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Некоректний email";
    }

    if (!password) {
      nextErrors.password = "Придумайте пароль";
    } else if (!isPasswordValid(password)) {
      nextErrors.password = "Пароль не відповідає вимогам нижче";
    }

    if (!agree) {
      nextErrors.agree = "Потрібно погодитись з угодою користувача";
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
      if (challenge) {
        await verifyRegistration(challenge.challengeId, code);
      } else {
        const pending = await register(
          `${firstName.trim()} ${lastName.trim()}`.trim(),
          email,
          password,
          method as "email" | "sms",
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
          }
        );
        setChallenge(pending); setCode("");
        return;
      }

      if (nextParam) {
        window.location.replace(nextPath);
      } else if (onSuccess) {
        onSuccess();
      } else {
        router.replace(nextPath);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Помилка реєстрації");
    } finally { setBusy(false); }
  }

  async function resendCode() {
    if (!challenge || busy || resendIn > 0) return;
    setBusy(true); setFormError("");
    try { setChallenge(await resendRegistration(challenge.challengeId)); setCode(""); }
    catch (error) { setFormError(error instanceof Error ? error.message : "Не вдалося надіслати код."); }
    finally { setBusy(false); }
  }

  function handleSocialClick(provider: "google" | "facebook") {
    if (busy) return;
    setBusy(true);
    window.location.assign(`/shop-api/external/${provider}/start?${new URLSearchParams({ next: nextPath })}`);
  }

  return (
    <>
      <div className={styles.formColumn}>
        <h1 className={styles.title}>Реєстрація</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {challenge ? <>
            <h2>Підтвердьте реєстрацію</h2>
            <p role="status">Код надіслано {challenge.method === "sms" ? "у SMS" : "на пошту"}: {challenge.maskedDestination}.</p>
            <p className={styles.hintText}>Код діє до {new Date(challenge.expiresAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}.</p>
            <label className={styles.field}>
              <span>Код підтвердження</span>
              <input className={styles.input} autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} />
            </label>
            <button type="button" className={styles.textLink} disabled={busy || resendIn > 0} onClick={resendCode}>
              {resendIn > 0 ? `Надіслати ще раз через ${resendIn} с` : "Надіслати код ще раз"}
            </button>
            <button type="button" className={styles.textLink} disabled={busy} onClick={() => { setChallenge(null); setMethod(""); setCode(""); setFormError(""); }}>← Обрати інший спосіб або змінити дані</button>
          </> : <>
          <label className={styles.field}>
            <input
              type="text"
              className={styles.input}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ім'я"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <span className={styles.errorText}>{errors.firstName}</span>
            )}
          </label>

          <label className={styles.field}>
            <input
              type="text"
              className={styles.input}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Прізвище"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <span className={styles.errorText}>{errors.lastName}</span>
            )}
          </label>

          <label className={styles.field}>
            <input
              type="tel"
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={method === "sms" ? "Номер телефону (+380…)" : "Номер телефону (необов'язково)"}
              autoComplete="tel"
            />
            {errors.phone && (
              <span className={styles.errorText}>{errors.phone}</span>
            )}
          </label>

          <label className={styles.field}>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ел.пошта"
              autoComplete="email"
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
                placeholder="Придумайте пароль"
                autoComplete="new-password"
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
            {errors.password ? (
              <span className={styles.errorText}>{errors.password}</span>
            ) : (
              <span className={styles.hintText}>
                Пароль повинен складатися з 8–72 символів, містити
                цифри та латинські літери, у тому числі велику, і не повинен
                збігатися з ім&apos;ям та ел. поштою
              </span>
            )}
          </label>

          <fieldset className={styles.registrationMethods} disabled={busy || !methodsLoaded}>
            <legend>Як підтвердити реєстрацію?</legend>
            {(["email", "sms"] as const).map(value => <label key={value}>
              <input type="radio" name="verificationMethod" value={value} checked={method === value} disabled={!methods.includes(value)} onChange={() => setMethod(value)} />
              <span>{value === "email" ? "Код на електронну пошту" : "Код у SMS"}{methodsLoaded && !methods.includes(value) ? " — тимчасово недоступно" : ""}</span>
            </label>)}
            {errors.verificationMethod && <span className={styles.errorText}>{errors.verificationMethod}</span>}
          </fieldset>

          <div className={styles.agreementRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              id="agree"
            />
            <label htmlFor="agree" className={styles.agreementText}>
              Реєструючись, ви погоджуєтесь з{" "}
              <a href="#" className={styles.switchLink}>
                угодою користувача
              </a>
            </label>
          </div>
          {errors.agree && (
            <span className={styles.errorText}>{errors.agree}</span>
          )}
          </>}

          {formError && <p className={styles.formError} role="alert">{formError}</p>}

          <button type="submit" className={styles.submitButton} disabled={busy || (challenge ? code.length !== 6 : !methodsLoaded || methods.length === 0)}>
            {busy ? "Зачекайте…" : challenge ? "Підтвердити реєстрацію" : "Отримати код підтвердження"}
          </button>
        </form>

        <p className={styles.switchText}>
          {/* replace: в истории не копится «реєстрація → вхід», back() вернёт на исходную страницу */}
          <a
            href={buildAuthHref("/login", nextParam ? nextPath : undefined)}
            className={styles.switchLink}
          >
            Я вже зареєстрований
          </a>
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
          onClick={() => handleSocialClick("facebook")}
          disabled={busy}
        >
          <Icon src="/icons/facebook.svg" alt="" className={styles.socialIcon} />
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
    </>
  );
}
