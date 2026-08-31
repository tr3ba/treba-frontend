import Image from "next/image";
import Link from "next/link";
import styles from "./SellerInfo.module.css";
import { Seller } from "../../types/product";

type SellerInfoProps = {
  seller: Seller;
};

export default function SellerInfo({ seller }: SellerInfoProps) {
  return (
    <Link href={`/seller/${seller.id}`} className={styles.wrapper}>
      {seller.logo && (
        <div className={styles.logoWrap}>
          <Image src={seller.logo} alt={seller.name} width={32} height={32} className={styles.logo} />
        </div>
      )}
      <div className={styles.textBlock}>
        <span className={styles.name}>{seller.name}</span>
        <span className={styles.link}>Всі товари продавця</span>
      </div>
      <span className={styles.arrow} aria-hidden="true">›</span>
    </Link>
  );
}