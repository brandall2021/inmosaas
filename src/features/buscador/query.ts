import type { PropertyOperation, PropertyType } from "@/db/schema";

/**
 * Interpreta una consulta escrita en lenguaje natural y la convierte en un
 * plan de búsqueda determinista: operación, tipo de propiedad, ciudad, rango
 * de precio y los términos libres que sobran.
 *
 * Módulo puro (sin base de datos, sin red) para que se pueda probar y reutilizar
 * tal cual: la misma lectura alimenta los chips de "intención" de la UI y las
 * condiciones SQL.
 */

export type Currency = "USD" | "ARS";

export type SearchPlan = {
  raw: string;
  tokens: string[];
  operation?: PropertyOperation;
  propertyTypes: PropertyType[];
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: Currency;
};

const NUMBER = String.raw`[\d.,]+(?:\s*(?:k|mil))?`;
const MONEY_WORD = String.raw`(?:usd|u\$s|ars|pesos|dólares|dolares|dólar|dolar)?\s*`;
const PRICE = String.raw`(?:${MONEY_WORD}${NUMBER})`;

const STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "y",
  "o",
  "u",
  "al",
  "lo",
  "le",
  "se",
  "que",
  "con",
  "sin",
  "por",
  "para",
  "en",
  "the",
  "and",
  "or",
  "a",
  "an",
]);

const TYPE_ALIASES: Record<string, PropertyType> = {
  departamento: "departamento",
  departamentos: "departamento",
  depto: "departamento",
  deptos: "departamento",
  casa: "casa",
  casas: "casa",
  ph: "ph",
  terreno: "terreno",
  terrenos: "terreno",
  lote: "terreno",
  lotes: "terreno",
  local: "local",
  locales: "local",
  oficina: "oficina",
  oficinas: "oficina",
  cochera: "cochera",
  cocheras: "cochera",
  garaje: "cochera",
  garajes: "cochera",
  campo: "campo",
  campos: "campo",
};

/** Palabras que nunca deben confundirse con una ciudad después de "en". */
const NOT_A_CITY = new Set([
  ...Object.keys(TYPE_ALIASES),
  "venta",
  "vender",
  "compra",
  "comprar",
  "alquiler",
  "alquileres",
  "alquilar",
  "ambiente",
  "ambientes",
  "dormitorio",
  "dormitorios",
  "baño",
  "baños",
  "metro",
  "metros",
  "superficie",
  "usd",
  "dolar",
  "dólar",
  "dolares",
  "dólares",
  "peso",
  "pesos",
  "ars",
  "hasta",
  "desde",
  "millon",
  "millones",
  "urgente",
  "oportunidad",
  "nuevo",
  "nueva",
]);

function toNumber(input: string): number | undefined {
  const raw = input.trim().toLowerCase();
  const suffix = /\s*(k|mil)\s*$/.exec(raw);
  let body = suffix ? raw.slice(0, suffix.index) : raw;
  body = body.replace(/[^\d.,]/g, "");
  if (!body) {
    return undefined;
  }

  let value: number;
  if (suffix) {
    value = parseFloat(body.replace(/\./g, "").replace(",", ".")) * 1000;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(body)) {
    value = parseFloat(body.replace(/\./g, ""));
  } else if (/^\d+,\d{1,2}$/.test(body)) {
    value = parseFloat(body.replace(",", "."));
  } else {
    value = parseFloat(body);
  }

  return Number.isFinite(value) ? value : undefined;
}

function currencyOf(input: string): Currency | undefined {
  if (/\b(?:usd|u\$s|dolares|dólares|dolar|dólar)\b/i.test(input)) {
    return "USD";
  }
  if (/\b(?:ars|pesos)\b/i.test(input)) {
    return "ARS";
  }
  return undefined;
}

export function interpretQuery(raw: string): SearchPlan {
  const plan: SearchPlan = {
    raw: raw.trim(),
    tokens: [],
    propertyTypes: [],
  };
  if (!plan.raw) {
    return plan;
  }

  let work = plan.raw.toLowerCase();

  // "hasta 100.000" / "bajo usd 50000" / "menos de 120k"
  work = work.replace(
    new RegExp(
      String.raw`\b(?:hasta|bajo(?:\s+de)?|menos\s+de|máximo|maximo)\s+(${PRICE})`,
      "gi",
    ),
    (_match, price: string) => {
      plan.maxPrice = toNumber(price) ?? plan.maxPrice;
      plan.currency ??= currencyOf(price);
      return " ";
    },
  );

  // "desde 50000" / "mínimo 40k"
  work = work.replace(
    new RegExp(String.raw`\b(?:desde|mínimo|minimo)\s+(${PRICE})`, "gi"),
    (_match, price: string) => {
      plan.minPrice = toNumber(price) ?? plan.minPrice;
      plan.currency ??= currencyOf(price);
      return " ";
    },
  );

  // "usd 120000" / "$ 85.000" -> se lee como tope superior.
  work = work.replace(
    new RegExp(
      String.raw`\b(?:usd|u\$s|pesos|dólares|dolares|ars)\s+(${NUMBER})`,
      "gi",
    ),
    (_match, price: string) => {
      plan.maxPrice ??= toNumber(price);
      return " ";
    },
  );

  const moneyWord = /\b(?:usd|u\$s|pesos|dólares|dolares|ars)\b/i.exec(work);
  if (moneyWord) {
    plan.currency ??= currencyOf(moneyWord[0]);
    work = work.replace(moneyWord[0], " ");
  }

  work = work.replace(
    /\b(venta|vender|compra|comprar|alquiler|alquileres|alquilar)\b/gi,
    (match) => {
      plan.operation = match.toLowerCase().startsWith("alqui")
        ? "alquiler"
        : "venta";
      return " ";
    },
  );

  work = work.replace(
    /\b(departamentos?|deptos?|depto|casas?|ph|terrenos?|lotes?|locales?|oficinas?|cocheras?|garajes?|campos?)\b/gi,
    (match) => {
      const mapped = TYPE_ALIASES[match.toLowerCase()];
      if (mapped && !plan.propertyTypes.includes(mapped)) {
        plan.propertyTypes.push(mapped);
      }
      return " ";
    },
  );

  const cityMatch = new RegExp(
    String.raw`\ben\s+([a-záéíóúñ]{3,}(?:\s+[a-záéíóúñ]{3,})?)`,
    "i",
  ).exec(work);
  if (cityMatch && !NOT_A_CITY.has(cityMatch[1])) {
    plan.city = cityMatch[1].trim();
    work = work.replace(cityMatch[0], " ");
  }

  // Un número suelto de 5+ dígitos se interpreta como tope de precio.
  const bigNumber = /(\d{5,})/.exec(work);
  if (bigNumber) {
    plan.maxPrice ??= toNumber(bigNumber[1]);
    work = work.replace(bigNumber[1], " ");
  }

  plan.tokens = Array.from(
    new Set(
      work
        .split(/[^a-záéíóúñ0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2 && !STOPWORDS.has(token)),
    ),
  ).slice(0, 6);

  return plan;
}

/** True when the plan carries at least one criterion to search by. */
export function hasCriteria(plan: SearchPlan): boolean {
  return (
    plan.tokens.length > 0 ||
    plan.operation !== undefined ||
    plan.propertyTypes.length > 0 ||
    plan.city !== undefined ||
    plan.minPrice !== undefined ||
    plan.maxPrice !== undefined
  );
}
