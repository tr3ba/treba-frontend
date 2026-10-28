import { NextRequest } from "next/server";
import { decode, resultCookie } from "../../../../lib/server/external-auth";
import { json } from "../../../../lib/server/session";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const data = decode(request.cookies.get(resultCookie)?.value) as { expires?: number; message?: unknown; challenge?: { challengeId?: unknown; methods?: unknown; maskedEmail?: unknown; expiresAt?: unknown }; remember?: boolean } | null;
  if (!data || typeof data.expires !== "number" || data.expires < Date.now()) return json({ message: "Час входу минув. Спробуйте ще раз." }, 400);
  if (typeof data.message === "string") return json({ message: data.message.slice(0, 300) });
  const challenge = data.challenge;
  if (!challenge || typeof challenge.challengeId !== "string" || !Array.isArray(challenge.methods)
    || !challenge.methods.every(method => ["email", "authenticator", "telegram"].includes(method))
    || typeof challenge.maskedEmail !== "string" || typeof challenge.expiresAt !== "string"
    || !Number.isFinite(Date.parse(challenge.expiresAt)) || Date.parse(challenge.expiresAt) < Date.now()) return json({ message: "Почніть вхід ще раз." }, 400);
  return json({ challenge, remember: data.remember !== false });
}
