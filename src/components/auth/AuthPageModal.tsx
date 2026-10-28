"use client";

import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthPageModal({ register = false }: { register?: boolean }) {
  const router = useRouter();
  return <AuthModal onClose={() => router.replace("/")}>
    {register ? <RegisterForm /> : <LoginForm />}
  </AuthModal>;
}
