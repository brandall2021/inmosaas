import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .email({ error: "Introduce un correo electrónico válido" });

const passwordField = z
  .string()
  .min(8, { error: "La contraseña debe tener al menos 8 caracteres" })
  .regex(/[a-zA-Z]/, { error: "Debe incluir al menos una letra" })
  .regex(/[0-9]/, { error: "Debe incluir al menos un número" });

const nameField = z
  .string()
  .trim()
  .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
  .max(60, { error: "El nombre no puede superar los 60 caracteres" });

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const signupSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormInput = z.infer<typeof loginSchema>;
export type SignupFormInput = z.infer<typeof signupSchema>;

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || value === undefined ? undefined : value;

/** Optional free-text field: blank strings collapse to `undefined`. */
function optionalText(max: number) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, { error: `No puede superar los ${max} caracteres` })
      .optional(),
  );
}

/**
 * Optional list of characteristic names (amenities/servicios) coming from the
 * multiselection: blanks dropped, trimmed, de-duplicated and sorted so the
 * stored order is stable. An empty submitted list stays `[]` on purpose (the
 * caller distinguishes that from an absent field, which passes `undefined`).
 */
function optionalNameList(max: number) {
  return z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }
      const items = Array.isArray(value) ? value : [value];
      const names = Array.from(
        new Set(
          items
            .map((item) => String(item).trim())
            .filter((name) => name.length > 0),
        ),
      ).sort();
      // An empty list stays as [] (the field was rendered but nothing was
      // checked -> the caller wants to clear); absence of the field stays
      // undefined (field not rendered -> caller keeps what is stored).
      return names;
    },
    z
      .array(z.string().max(120))
      .max(max, { error: `No puede haber más de ${max} características` })
      .optional(),
  );
}

/** Optional whole number bounded to a sane range (blank -> `undefined`). */
function optionalInt(min: number, max: number) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Ingresá un número válido" })
      .int({ error: "Debe ser un número entero" })
      .min(min, { error: `El valor mínimo es ${min}` })
      .max(max, { error: `El valor máximo es ${max}` })
      .optional(),
  );
}

export const propertyOperationSchema = z.enum(["venta", "alquiler"], {
  error: "Seleccioná una operación",
});

export const propertyTypeSchema = z.enum(
  [
    "departamento",
    "casa",
    "ph",
    "terreno",
    "local",
    "oficina",
    "cochera",
    "campo",
  ],
  { error: "Seleccioná un tipo de propiedad" },
);

export const propertyStatusSchema = z
  .enum(["disponible", "reservada", "vendida", "alquilada"], {
    error: "Seleccioná un estado",
  })
  .default("disponible");

export const currencySchema = z.enum(["ARS", "USD"]).default("USD");

export const propertySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "El título debe tener al menos 3 caracteres" })
    .max(120, { error: "El título no puede superar los 120 caracteres" }),
  description: optionalText(2000),
  operation: propertyOperationSchema,
  propertyType: propertyTypeSchema,
  status: propertyStatusSchema,
  price: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Ingresá un precio válido" })
      .nonnegative({ error: "El precio no puede ser negativo" })
      .optional(),
  ),
  currency: currencySchema,
  address: optionalText(160),
  city: optionalText(80),
  province: optionalText(80),
  rooms: optionalInt(0, 50),
  bedrooms: optionalInt(0, 50),
  bathrooms: optionalInt(0, 50),
  areaM2: optionalInt(0, 100000),
  zone: optionalText(80),
  amenities: optionalNameList(50),
});

export type PropertyFormInput = z.infer<typeof propertySchema>;

export const clientTypeSchema = z.enum(
  ["comprador", "vendedor", "inquilino", "propietario"],
  { error: "Seleccioná un tipo de cliente" },
);

export const clientStageSchema = z
  .enum(["nuevo", "contactado", "visitando", "negociacion", "cerrado"], {
    error: "Seleccioná una etapa",
  })
  .default("nuevo");

const optionalEmailField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .email({ error: "Introduce un correo electrónico válido" })
    .optional(),
);

export const clientSchema = z.object({
  name: nameField,
  email: optionalEmailField,
  phone: optionalText(40),
  type: clientTypeSchema,
  stage: clientStageSchema,
  notes: optionalText(2000),
});

export type ClientFormInput = z.infer<typeof clientSchema>;

export const valuationStatusSchema = z
  .enum(["pendiente", "en_revision", "completada"], {
    error: "Seleccioná un estado de tasación",
  })
  .default("pendiente");

const optionalNumberField = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, { error: "Debe ser mayor o igual a 0" }).optional(),
);

export const valuationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "El título debe tener al menos 3 caracteres" })
    .max(120, { error: "El título no puede superar 120 caracteres" }),
  address: optionalText(200),
  areaM2: optionalNumberField,
  pricePerM2: optionalNumberField,
  totalPrice: optionalNumberField,
  status: valuationStatusSchema,
  notes: optionalText(2000),
});

export type ValuationFormInput = z.infer<typeof valuationSchema>;

export const rentalStatusSchema = z
  .enum(["vigente", "finalizado", "rescindido"], {
    error: "Seleccioná un estado de alquiler",
  })
  .default("vigente");

export const paymentMethodSchema = z
  .enum(["efectivo", "transferencia", "debito", "cheque"], {
    error: "Seleccioná un método",
  })
  .default("transferencia");

/** Positive amount: required and strictly greater than zero. */
const positiveAmountField = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: "Ingresá un monto válido" })
    .positive({ error: "El monto debe ser mayor a cero" }),
);

const requiredDateField = z
  .string()
  .min(10, { error: "Indicá la fecha del cobro" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Fecha inválida" });

export const paymentSchema = z.object({
  amount: positiveAmountField,
  paidDate: requiredDateField,
  method: paymentMethodSchema,
  notes: optionalText(2000),
});

export type PaymentFormInput = z.infer<typeof paymentSchema>;

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Fecha inválida" });

const optionalDateField = z.preprocess(emptyToUndefined, dateField.optional());

const optionalIdField = z.preprocess(
  emptyToUndefined,
  z.string().uuid({ error: "Identificador inválido" }).optional(),
);

export const rentalSchema = z
  .object({
    propertyId: optionalIdField,
    clientId: optionalIdField,
    startDate: dateField,
    endDate: optionalDateField,
    rentAmount: optionalNumberField,
    currency: currencySchema,
    status: rentalStatusSchema,
    notes: optionalText(2000),
  })
  .refine(
    (data) =>
      !data.endDate || !data.startDate || data.endDate >= data.startDate,
    { error: "La fecha de fin no puede ser anterior al inicio", path: ["endDate"] },
  );

export type RentalFormInput = z.infer<typeof rentalSchema>;

export const integrationSchema = z
  .object({
    webhookUrl: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(400, { error: "La URL no puede superar los 400 caracteres" })
        .regex(/^https?:\/\/\S+$/i, {
          error: "La URL debe comenzar con http:// o https://",
        })
        .optional(),
    ),
    webhookEnabled: z.boolean().default(false),
  })
  .refine((data) => !data.webhookEnabled || Boolean(data.webhookUrl), {
    error: "Completá la URL del webhook para activarlo",
    path: ["webhookUrl"],
  });

export type IntegrationFormInput = z.infer<typeof integrationSchema>;

export const catalogKindSchema = z.enum(
  ["zona", "amenity", "servicio", "etiqueta"],
  { error: "Seleccioná un tipo de catálogo" },
);

export const catalogEntrySchema = z.object({
  kind: catalogKindSchema,
  name: z
    .string()
    .trim()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
    .max(60, { error: "El nombre no puede superar los 60 caracteres" }),
  description: optionalText(300),
});

export type CatalogEntryFormInput = z.infer<typeof catalogEntrySchema>;

export const documentUploadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "El título debe tener al menos 3 caracteres" })
    .max(120, { error: "El título no puede superar los 120 caracteres" }),
  propertyId: optionalIdField,
  clientId: optionalIdField,
  rentalId: optionalIdField,
});

export type DocumentUploadFormInput = z.infer<typeof documentUploadSchema>;

export const contractGenerateSchema = z.object({
  additionalNotes: optionalText(5000),
});

export type ContractGenerateFormInput = z.infer<typeof contractGenerateSchema>;

export const proposalGenerateSchema = z.object({
  clientId: optionalIdField,
  expiresAt: optionalDateField,
  message: optionalText(5000),
});

export type ProposalGenerateFormInput = z.infer<typeof proposalGenerateSchema>;
