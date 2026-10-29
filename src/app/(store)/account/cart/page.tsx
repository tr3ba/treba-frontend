import { redirect } from "next/navigation";

// Кошик живе на окремій сторінці /cart — пункт кабінету веде туди
export default function AccountCartPage() {
  redirect("/cart");
}