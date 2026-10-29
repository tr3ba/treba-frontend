import type { Metadata } from "next";
import SellHeader from "../../../components/sell/SellHeader";
import SellFooter from "../../../components/sell/SellFooter";
import SellHero from "../../../components/sell/SellHero";
import SellStats from "../../../components/sell/SellStats";
import SellAdvantages from "../../../components/sell/SellAdvantages";
import SellSteps from "../../../components/sell/SellSteps";
import SellCalculator from "../../../components/sell/SellCalculator";
import SellFaq from "../../../components/sell/SellFaq";
import SellApply from "../../../components/sell/SellApply";
import {
  SELL_ADVANTAGES,
  SELL_COMMISSIONS,
  SELL_FAQ,
  SELL_STATS,
  SELL_STEPS,
} from "../../../data/sellLanding";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Продавайте на TREBA",
  description:
    "Станьте продавцем на TREBA — українському маркетплейсі. Умови, комісії, калькулятор доходу та заявка на підключення.",
};

// Самостоятельный лендинг для продавцов: свой хедер и футер, без шапки магазина
export default function SellPage() {
  return (
    <div className={styles.page}>
      <SellHeader />

      <main>
        <SellHero />
        <SellStats stats={SELL_STATS} />
        <SellAdvantages advantages={SELL_ADVANTAGES} />
        <SellSteps steps={SELL_STEPS} />
        <SellCalculator categories={SELL_COMMISSIONS} />
        <SellFaq items={SELL_FAQ} />
        <SellApply />
      </main>

      <SellFooter />
    </div>
  );
}