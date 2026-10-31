import { expect, test } from "@playwright/test";

const PASSWORD = "Password123";

async function signup(page: import("@playwright/test").Page) {
  const email = `e2e+${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("Nombre completo", { exact: true }).fill("Ana Gómez");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page
    .getByLabel("Repetí tu contraseña", { exact: true })
    .fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL("/dashboard");
}

/**
 * Owner creates a rental with a monthly amount; today's date is the start so
 * the filed period has "today" months of coverage.
 */
async function createRental(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "Alquileres" }).click();
  await page.getByRole("link", { name: "Nuevo alquiler" }).first().click();
  await expect(page).toHaveURL("/alquileres/nuevo");
  await page.getByLabel("Fecha de inicio", { exact: true }).fill("2026-01-01");
  await page.getByLabel("Fecha de fin", { exact: true }).fill("2026-12-31");
  await page.getByLabel("Canon mensual", { exact: true }).fill("450000");
  await page.getByLabel("Notas", { exact: true }).fill("Depósito 1 mes");
  await page.getByRole("button", { name: "Crear alquiler" }).click();
  await expect(page).toHaveURL(/\/alquileres\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Sin pagos registrados todavía.")).toBeVisible();
  return page.url();
}

test("registra, lista, edita y elimina pagos de un alquiler", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);
  await createRental(page);

  // Empty summary state.
  await expect(page.getByText("Sin cobros")).toBeVisible();
  await expect(page.getByText("0 de 12")).toBeVisible();

  // Invalid amount first: field error, no payment created.
  await page.getByLabel("Monto", { exact: true }).fill("0");
  await page.getByLabel("Fecha de cobro", { exact: true }).fill("2026-02-15");
  await page.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByText("El monto debe ser mayor a cero")).toBeVisible();
  await expect(page.getByText("Sin pagos registrados todavía.")).toBeVisible();

  // Two valid payments in different months.
  await page.getByLabel("Monto", { exact: true }).fill("450000");
  await page.getByLabel("Fecha de cobro", { exact: true }).fill("2026-02-15");
  await page
    .getByLabel("Método", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: "Efectivo" })
    .filter({ visible: true })
    .click();
  await page.locator("#payment-notes").fill("Transferencia de julio");
  await page.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByText("Pagos (1)")).toBeVisible();
  await expect(page.getByRole("cell", { name: "ARS 450.000" })).toBeVisible();

  // Second payment on a later month, keeps the method caller picked.
  await page.getByLabel("Monto", { exact: true }).fill("430000");
  await page.getByLabel("Fecha de cobro", { exact: true }).fill("2026-03-10");
  await page.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByText("Pagos (2)")).toBeVisible();

  // Chronological listing: the newest payment first (2026-03-10 vs 2026-02-15).
  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toContainText("10 mar 2026");

  // Updated summary.
  await expect(page.getByText("Pagos (2)")).toBeVisible();
  await expect(
    page.locator("dd", { hasText: "10 mar 2026" }),
  ).toBeVisible();
  await expect(page.getByText("2 de 12")).toBeVisible();

  // Latest payment edit.
  await page.getByRole("link", { name: /Editar pago/ }).first().click();
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "Editar pago" }),
  ).toBeVisible();
  await page.getByLabel("Monto", { exact: true }).fill("455000");
  await page.getByLabel("Método", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: "Cheque" })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Guardar pago" }).click();
  await expect(page).toHaveURL(/\/alquileres\/[0-9a-f-]{36}$/);

  // Edited values reflected in the table (ARS by default in rentals).
  await expect(page.getByRole("cell", { name: "ARS 455.000" })).toBeVisible();
  // Delete.
  await page.getByRole("button", { name: /Eliminar pago/ }).first().click();
  await expect(page.getByText("Pagos (1)")).toBeVisible();
});

test("el alquiler finalizado conserva el historial de cobros", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);
  await createRental(page);

  await page.getByLabel("Monto", { exact: true }).fill("450000");
  await page.getByLabel("Fecha de cobro", { exact: true }).fill("2026-02-15");
  await page.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByText("Pagos (1)")).toBeVisible();

  // Finalize the rental.
  await page.getByRole("link", { name: "Editar" }).first().click();
  await expect(page).toHaveURL(/\/alquileres\/[0-9a-f-]{36}\/editar$/);
  await page
    .getByLabel("Estado", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: "Finalizado" })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(/\/alquileres\/[0-9a-f-]{36}$/);

  // History persists.
  await expect(page.getByText("Pagos (1)")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "15 feb 2026", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sin cobros")).toHaveCount(0);
});
