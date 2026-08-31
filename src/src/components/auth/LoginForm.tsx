"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "./Icons";
import styles from "./AuthForm.module.css";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    try {
      login(email, password);
      router.push("/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Помилка входу");
    }
  }

  
  function handleSocialClick() {
    setFormError("Вхід через соцмережі буде доступний пізніше");
  }

  return (
    <>
      <div className={styles.formColumn}>
        <h1 className={styles.title}>Вхід</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
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

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" className={styles.submitButton}>
            Увійти
          </button>
        </form>

        <p className={styles.switchText}>
          <Link href="/register" className={styles.switchLink}>
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