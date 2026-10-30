"use client";
import Image from "next/image";
import { useState } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import type { User } from "@/features/admin/types";

export default function UserAvatar({ user, size = 37, className = "" }: { user: User; size?: number; className?: string }) {
  const source = resolveMediaUrl(user.profile?.avatarUrl);
  const [failedSource, setFailedSource] = useState<string>();
  return <span className={`treba-admin-avatar ${className}`} style={{ width: size, height: size }}>
    {source && failedSource !== source ? <Image key={source} unoptimized src={source} width={size} height={size} alt="" onError={() => setFailedSource(source)} /> : <>{user.firstName?.[0]}{user.lastName?.[0]}</>}
  </span>;
}
