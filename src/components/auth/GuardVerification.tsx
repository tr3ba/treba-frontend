"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { sessionRequest, useAuth } from "../../context/AuthContext";
import styles from "./AuthForm.module.css";

type Guard = { id: string; browserSecret: string; qrCodeDataUrl: string; displayCode: string; expiresAt: string };
export default function GuardVerification({ challengeId, remember, onVerified }: { challengeId: string; remember: boolean; onVerified: () => void }) {
  const { verifyGuard } = useAuth();
  const [guard, setGuard] = useState<Guard | null>(null);
  const [error, setError] = useState("");
  const completed = useRef(false);
  const verified = useRef(onVerified);
  const verify = useRef(verifyGuard);
  useEffect(() => { verified.current = onVerified; verify.current = verifyGuard; }, [onVerified, verifyGuard]);
  useEffect(() => {
    let active = true;
    const start = sessionRequest({ action: "guard-start", challengeId });
    void start.then(value => { if (active) setGuard(value); }).catch(value => { if (active) setError(value.message); });
    return () => { active = false; };
  }, [challengeId]);
  useEffect(() => {
    if (!guard) return;
    let active = true, running = false;
    const timer = setInterval(async () => {
      if (!active || running || completed.current) return;
      running = true;
      try {
        if (Date.parse(guard.expiresAt) <= Date.now()) throw new Error("QR-код прострочено. Оберіть спосіб підтвердження ще раз.");
        const status = await sessionRequest({ action: "guard-status", id: guard.id, browserSecret: guard.browserSecret });
        if (!active) return;
        if (status.status === "approved") {
          await verify.current(guard.id, guard.browserSecret, remember);
          if (active) { completed.current = true; verified.current(); }
        } else if (status.status === "expired" || status.status === "consumed") throw new Error("QR-код недоступний. Почніть підтвердження ще раз.");
      } catch (value) { if (active) { setError(value instanceof Error ? value.message : "Не вдалося підтвердити вхід."); clearInterval(timer); } }
      finally { running = false; }
    }, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [guard, remember]);
  return <div className={styles.guardPanel}>
    <h2>Telegram Guard</h2><p>Відкрийте Guard у Telegram та відскануйте QR-код. Підтверджуйте лише вхід у свій акаунт.</p>
    {guard ? <><Image src={guard.qrCodeDataUrl} width={220} height={220} unoptimized alt="QR-код підтвердження входу" /><p>Код на обох пристроях: <strong>{guard.displayCode}</strong></p><p role="status">Очікуємо підтвердження…</p></> : <p>Готуємо QR-код…</p>}
    {error && <p className={styles.formError} role="alert">{error}</p>}
  </div>;
}