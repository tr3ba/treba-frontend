import Header from "../../../components/layout/Header";
import Footer from "../../../components/home/Footer";
import CatalogResults from "../../../components/catalog/CatalogResults";
import type { SearchValues } from "../../../lib/catalogQuery";
import styles from "../catalog/[categoryId]/page.module.css";
export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  return <><Header /><main className={styles.page}><div className={styles.heading}><h1 className={styles.title}>Пошук товарів</h1></div><CatalogResults values={await searchParams} path="/search" /></main><Footer /></>;
}
