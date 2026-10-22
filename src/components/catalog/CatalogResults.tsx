import Link from "next/link";
import { readCatalogQuery, catalogHref, type SearchValues } from "../../lib/catalogQuery";
import { getPublicFacets, searchCatalog } from "../../lib/api/search";
import ProductCard from "../home/ProductCard";
import styles from "./CatalogResults.module.css";

export default async function CatalogResults({ values, path, categoryId }: { values: SearchValues; path: string; categoryId?: string }) {
  let result;
  let message = "Спробуйте ще раз.";
  try {
    const query = readCatalogQuery(values);
    const [page, facets] = await Promise.all([searchCatalog(query, categoryId), getPublicFacets(query, categoryId)]);
    result = { query, page, facets };
  } catch (error) { message = error instanceof Error ? error.message : message; }
  if (!result) return <section className={styles.empty} role="alert"><h2>Не вдалося завантажити товари</h2><p>{message}</p><Link href={path}>Скинути фільтри та повторити</Link></section>;
  const { query, page, facets } = result;
    return <section className={styles.section} aria-label="Товари й фільтри">
      <form method="GET" action={path} className={styles.filters}>
        <div className={styles.filterHeading}><strong>Фільтри</strong><Link href={path + (query.q ? "?q=" + encodeURIComponent(query.q) : "")}>Скинути</Link></div>
        <label>Пошук<input name="q" defaultValue={query.q} maxLength={200} placeholder="Назва або артикул" /></label>
        <label>Сортувати<select name="sort" defaultValue={query.sort}><option value="newest">Спочатку нові</option><option value="priceasc">Від дешевих до дорогих</option><option value="pricedesc">Від дорогих до дешевих</option><option value="nameasc">За назвою</option></select></label>
        <div className={styles.prices}><label>Ціна від<input name="minPrice" type="number" min="0" step="0.01" defaultValue={query.minPrice} /></label><label>До<input name="maxPrice" type="number" min="0" step="0.01" defaultValue={query.maxPrice} /></label></div>
        <label>Бренд<select name="brandId" defaultValue={query.brandId ?? ""}><option value="">Усі бренди</option>{facets.brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
        <label className={styles.checkbox}><input name="stock" type="checkbox" value="available" defaultChecked={query.stock === "available"} />Лише в наявності</label>
        {facets.attributes.map(attribute => <label key={attribute.id}>{attribute.name}<select name={"attribute_" + attribute.id} defaultValue={query.attributes[attribute.id] ?? ""}><option value="">Усі значення</option>{attribute.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
        <button type="submit">Застосувати</button>
      </form>
      <div className={styles.results}>
        <div className={styles.resultHeading}><h2>{query.q ? `Результати: «${query.q}»` : "Товари"}</h2><span>{page.totalElements} товарів</span></div>
        {page.content.length === 0 ? <div className={styles.empty}><span aria-hidden="true">⌕</span><h3>Товарів поки не знайдено</h3><p>Спробуйте інший запит або змініть фільтри. Розділ готовий до нових товарів.</p><Link href={path}>Очистити пошук і фільтри</Link></div> : <div className={styles.grid}>{page.content.map(product => <ProductCard key={product.id} {...product} fluid />)}</div>}
        {page.totalPages > 1 && <nav className={styles.pagination} aria-label="Сторінки товарів">
          {query.page > 1 && <Link href={catalogHref(path, query, query.page - 1)}>← Назад</Link>}
          <span>Сторінка {page.page} із {page.totalPages}</span>
          {query.page < page.totalPages && <Link href={catalogHref(path, query, query.page + 1)}>Далі →</Link>}
        </nav>}
      </div>
    </section>;
}
