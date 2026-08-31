"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "./Icons";
import styles from "./AuthForm.module.css";

type FormErrors = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
  agree?: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");


  function isPasswordValid(value: string) {
    return (
      value.length >= 6 &&
      /[0-9]/.test(value) &&
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value)
    );
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!firstName.trim()) nextErrors.firstName = "Вкажіть ім'я";
    if (!lastName.trim()) nextErrors.lastName = "Вкажіть прізвище";
    if (!phone.trim()) nextErrors.phone = "Вкажіть номер телефону";

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    try {
register(
  `${firstName.trim()} ${lastName.trim()}`.trim(),
  email,
  password,
  {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
  }
);      router.push("/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Помилка реєстрації");
    }
  }

  function handleSocialClick() {
    setFormError("Реєстрація через соцмережі буде доступна пізніше");
  }

  return (
    <>
      <div className={styles.formColumn}>
        <h1 className={styles.title}>Реєстрація</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
              placeholder="Номер телефону"
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
                Пароль повинен складатися з не менш ніж 6 символів, містити
                цифри та латинські літери, у тому числі велику, і не повинен
                збігатися з ім&apos;ям та ел. поштою
              </span>
            )}
          </label>

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

          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" className={styles.submitButton}>
            Зареєструватися
          </button>
        </form>

        <p className={styles.switchText}>
          <Link href="/login" className={styles.switchLink}>
            Я вже зареєстрований
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