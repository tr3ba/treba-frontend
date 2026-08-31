"use client";

import { useRouter } from "next/navigation";
import AuthModal from "../../components/auth/AuthModal";
import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  return (
    <AuthModal onClose={() => router.push("/")}>
      <LoginForm />
    </AuthModal>
  );
}