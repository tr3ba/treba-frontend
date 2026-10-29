import { backend, json } from "../../../../lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await backend("/api/auth/registration/methods");
    if (!result.ok) return json({ message: "Не вдалося отримати способи підтвердження." }, result.status);
    const data = await result.json();
    return json({ methods: data.methods });
  } catch {
    return json({ message: "Сервер недоступний. Спробуйте ще раз." }, 503);
  }
}
