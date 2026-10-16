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

test("interpreta consultas y busca en todos los módulos", async ({ page }) => {
  await signup(page);

  // Datos de prueba: una casa en venta en Rosario.
  const title = `Casa Buscador E2E ${Date.now()}`;
  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await expect(page).toHaveURL("/propiedades/nueva");
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page
    .getByLabel("Tipo", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: "Casa" })
    .filter({ visible: true })
    .click();
  await page.getByLabel("Precio", { exact: true }).fill("120000");
  await page.getByLabel("Ciudad", { exact: true }).fill("Rosario");
  await page.getByRole("button", { name: "Crear propiedad" }).click();
  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);

  // Estado inicial del buscador.
  await page.getByRole("link", { name: "Buscador IA" }).click();
  await expect(page).toHaveURL("/buscador");
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "Probá con" }),
  ).toBeVisible();

  const search = async (query: string) => {
    await page
      .locator('input[name="q"]')
      .filter({ visible: true })
      .fill(query);
    await page.getByRole("button", { name: "Buscar" }).click();
  };

  // Búsqueda por texto libre.
  await search("buscador e2e");
  await expect(page).toHaveURL(/\/buscador\?q=/);
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: "Propiedades" }),
  ).toBeVisible();
  await expect(page.getByText(title).filter({ visible: true })).toBeVisible();

  // Consulta facetada: operación, tipo, zona y precio.
  await search("casas en venta en Rosario hasta usd 150000");
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Operación: Venta" }),
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Zona: Rosario" }),
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Hasta USD 150.000" }),
  ).toBeVisible();
  await expect(page.getByText(title).filter({ visible: true })).toBeVisible();

  // Palabras vacías: no hay nada que interpretar.
  await search("de la");
  await expect(page.getByText(/No pudimos interpretar/)).toBeVisible();

  // Consulta válida sin coincidencias.
  await search("zzzqqq");
  await expect(page.getByText(/Sin resultados/)).toBeVisible();
});
