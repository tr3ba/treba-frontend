"use client";

import { useRouter } from "next/navigation";
import AuthModal from "../../components/auth/AuthModal";
import RegisterForm from "../../components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  return (
    <AuthModal onClose={() => router.push("/")}>
      <RegisterForm />
    </AuthModal>
  );
}