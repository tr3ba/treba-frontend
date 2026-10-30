import type { AttributeDefinition } from "./types";

const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export function importedAttributeValue(definition: AttributeDefinition, values: { name: string; value: string }[]): string | string[] {
  const source = values.find(value => normalize(value.name) === normalize(definition.name))?.value.trim() ?? "";
  if (!source) return definition.type.toUpperCase() === "MULTI_SELECT" ? [] : "";
  if (definition.options.length) {
    const parts = source.split(/[,;|\n]+/).map(normalize);
    const matches = definition.options.filter(option => normalize(option.name) === normalize(source) || parts.includes(normalize(option.name))).map(option => option.id);
    return definition.type.toUpperCase() === "MULTI_SELECT" ? matches : matches.length === 1 ? matches[0] : "";
  }
  if (["BOOL", "BOOLEAN"].includes(definition.type.toUpperCase())) {
    if (["так", "да", "yes", "true", "1"].includes(normalize(source))) return "true";
    if (["ні", "нет", "no", "false", "0"].includes(normalize(source))) return "false";
    return "";
  }
  if (definition.type.toUpperCase() === "NUMBER") {
    const match = /^(-?\d+(?:[.,]\d+)?)\s*(.*)$/.exec(source);
    if (!match || (match[2] && normalize(match[2]) !== normalize(definition.unit ?? ""))) return "";
    const number = Number(match[1].replace(",", "."));
    return Number.isFinite(number) ? String(number) : "";
  }
  if (definition.type.toUpperCase() === "DATE") return /^\d{4}-\d{2}-\d{2}$/.test(source) ? source : "";
  return source;
}
