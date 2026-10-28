import { Suspense } from "react";
import StorefrontHome from "../home/StorefrontHome";
import Header from "../layout/Header";
import styles from "./AuthPageBackground.module.css";

export default function AuthPageBackground() {
  return <div className={styles.background} aria-hidden="true" inert>
    <Suspense fallback={<><Header /><div className={styles.placeholder} /></>}>
      <StorefrontHome />
    </Suspense>
  </div>;
}
