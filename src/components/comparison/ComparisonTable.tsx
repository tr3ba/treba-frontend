"use client";

import type { CSSProperties } from "react";
import { getCheapestProductId } from "../../lib/comparisonRows";
import type { ComparisonCardProduct, ComparisonRow } from "../../types/comparison";
import ComparisonProductHead from "./ComparisonProductHead";
import styles from "./ComparisonTable.module.css";

type ComparisonTableProps = {
  products: ComparisonCardProduct[];
  rows: ComparisonRow[];
  onlyDifferences: boolean;
};

// Таблиця на CSS grid: верхній рядок — картки товарів (прилипають при прокрутці на десктопі),
// далі кожна характеристика = рядок-назва на всю ширину + рядок значень.
// На планшеті й телефоні таблиця прокручується вбік, назва рядка лишається на місці.
export default function ComparisonTable({ products, rows, onlyDifferences }: ComparisonTableProps) {
  const cheapestId = getCheapestProductId(products);
  const visibleRows = onlyDifferences ? rows.filter((row) => !row.isSame) : rows;
  const gridStyle = { "--cols": products.length } as CSSProperties;

  return (
    <div className={styles.scroller}>
      <div className={styles.table} style={gridStyle} role="table" aria-label="Порівняння товарів">
        <div className={styles.headRow} role="row">
          {products.map((product) => (
            <div key={product.id} className={styles.headCell} role="columnheader">
              <ComparisonProductHead product={product} isCheapest={product.id === cheapestId} />
            </div>
          ))}
        </div>

        {visibleRows.map((row) => (
          <div key={row.key} className={styles.rowGroup} role="rowgroup">
            <div className={styles.labelCell} role="row">
              <span className={styles.label} role="rowheader">
                {row.label}
              </span>
            </div>

            <div className={styles.valuesRow} role="row">
              {row.values.map((value, index) => (
                <div
                  key={products[index].id}
                  className={[
                    styles.valueCell,
                    row.isSame ? styles.same : "",
                    value === null ? styles.empty : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="cell"
                >
                  {value ?? "—"}
                </div>
              ))}
            </div>
          </div>
        ))}

        {visibleRows.length === 0 && (
          <p className={styles.noRows}>
            {onlyDifferences
              ? "Відмінностей немає — за доступними характеристиками товари однакові."
              : "Характеристики для цих товарів поки не заповнені."}
          </p>
        )}
      </div>
    </div>
  );
}