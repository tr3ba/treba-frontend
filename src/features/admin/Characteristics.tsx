"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { useState } from "react";
import { Field } from "@/components/admin/ui";
import type { Attribute, AttributeDefinition, Variant } from "./types";
export default function Characteristics({
  definitions,
  values,
  variants = [],
  onChange,
}: {
  definitions: AttributeDefinition[];
  values: Attribute[];
  variants?: Variant[];
  onChange: (values: Attribute[]) => void;
}) {
  const { t } = useAdminI18n();
  const [scope, setScope] = useState("");
  function update(def: AttributeDefinition, rows: Partial<Attribute>[]) {
    onChange([
      ...values.filter(
        (a) => a.attributeId !== def.id || (a.variantId ?? "") !== scope,
      ),
      ...rows.map((row) => ({
        attributeId: def.id,
        variantId: scope || null,
        ...row,
      })),
    ]);
  }
  return (
    <>
      <Field label={t("Характеристики для")}>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="">{t("Усього товару")}</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.sku}
            </option>
          ))}
        </select>
      </Field>
      <div className="treba-admin-form-grid" style={{ marginTop: 18 }}>
        {definitions.map((def) => {
          const rows = values.filter(
              (a) => a.attributeId === def.id && (a.variantId ?? "") === scope,
            ),
            value = rows[0],
            required = def.isRequired && !scope;
          return (
            <Field
              key={def.id}
              label={`${def.name}${def.unit ? " · " + def.unit : ""}${required ? " *" : ""}`}
            >
              {def.type.toUpperCase() === "MULTI_SELECT" ? (
                <select
                  multiple
                  required={required}
                  value={rows.map((a) => a.optionId ?? "")}
                  onChange={(e) =>
                    update(
                      def,
                      Array.from(e.target.selectedOptions, (option) => ({
                        optionId: option.value,
                      })),
                    )
                  }
                >
                  {def.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : def.options.length ? (
                <select
                  required={required}
                  value={value?.optionId ?? ""}
                  onChange={(e) =>
                    update(
                      def,
                      e.target.value ? [{ optionId: e.target.value }] : [],
                    )
                  }
                >
                  <option value="">{t("Не вказано")}</option>
                  {def.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : ["BOOL", "BOOLEAN"].includes(def.type.toUpperCase()) ? (
                <select
                  required={required}
                  value={
                    value?.boolValue == null ? "" : String(value.boolValue)
                  }
                  onChange={(e) =>
                    update(
                      def,
                      e.target.value
                        ? [{ boolValue: e.target.value === "true" }]
                        : [],
                    )
                  }
                >
                  <option value="">{t("Не вказано")}</option>
                  <option value="true">{t("Так")}</option>
                  <option value="false">{t("Ні")}</option>
                </select>
              ) : (
                <input
                  required={required}
                  type={
                    def.type.toUpperCase() === "NUMBER"
                      ? "number"
                      : def.type.toUpperCase() === "DATE"
                        ? "date"
                        : "text"
                  }
                  step={def.type.toUpperCase() === "NUMBER" ? "any" : undefined}
                  value={value?.stringValue ?? value?.numberValue ?? ""}
                  onChange={(e) =>
                    update(
                      def,
                      e.target.value
                        ? [
                            def.type.toUpperCase() === "NUMBER"
                              ? { numberValue: Number(e.target.value) }
                              : { stringValue: e.target.value },
                          ]
                        : [],
                    )
                  }
                />
              )}
            </Field>
          );
        })}
      </div>
    </>
  );
}
