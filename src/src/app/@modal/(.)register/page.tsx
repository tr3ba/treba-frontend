"use client";

import { useRouter } from "next/navigation";
import AuthModal from "../../../components/auth/AuthModal";
import RegisterForm from "../../../components/auth/RegisterForm";

// Аналогично (.)login — перехватывает переход на /register изнутри
// приложения и показывает форму как модалку поверх текущей страницы.
export default function InterceptedRegisterModal() {
  const router = useRouter();
  return (
    <AuthModal onClose={() => router.back()}>
      <RegisterForm />
    </AuthModal>
  );
}