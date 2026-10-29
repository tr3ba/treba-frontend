import type { Metadata } from "next";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/home/Footer";
import CheckoutView from "../../../components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Оформлення замовлення — Treba",
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CheckoutView />
      <Footer />
    </>
  );
}