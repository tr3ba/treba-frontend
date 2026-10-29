"use client";

import { useRouter } from "next/navigation";
import AuthModal from "../../../../components/auth/AuthModal";
import RegisterForm from "../../../../components/auth/RegisterForm";

// Перехоплений /register: форма в модальному вікні поверх поточної сторінки.
// Після реєстрації закриваємо модалку — користувач лишається на сторінці, з якої відкрив її.
export default function InterceptedRegisterModal() {
  const router = useRouter();
  return (
    <AuthModal onClose={() => router.back()}>
      <RegisterForm onSuccess={() => router.back()} />
    </AuthModal>
  );
}