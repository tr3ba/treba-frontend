"use client";

import { useRouter } from "next/navigation";
import AuthModal from "../../../components/auth/AuthModal";
import LoginForm from "../../../components/auth/LoginForm";

// Спрацьовує при внутрішньому кліку-переході на /login
// Next.js перехоплює маршрут і рендерить форму як модальне вікно замість повного перенаправлення
export default function InterceptedLoginModal() {
  const router = useRouter();
  return (
    <AuthModal onClose={() => router.back()}>
      <LoginForm />
    </AuthModal>
  );
}