import { expect, test } from "@playwright/test";

const PASSWORD = "Password123";

type Page = import("@playwright/test").Page;

async function signup(page: Page) {
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

async function createProperty(page: Page, title: string) {
  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Crear propiedad" }).click();
  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);
}

async function createClient(page: Page, name: string) {
  await page.getByRole("link", { name: "CRM" }).click();
  await page.getByRole("link", { name: "Nuevo cliente" }).first().click();
  await page
    .getByLabel("Nombre completo", { exact: true })
    .filter({ visible: true })
    .fill(name);
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page).toHaveURL(/\/crm\/[0-9a-f-]{36}$/);
}

test("crea, edita y elimina un alquiler", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  // Seed a property and a client so the rental form has options to pick.
  const propertyTitle = `Casa Alquiler ${Date.now()}`;
  const clientName = `Inquilino E2E ${Date.now()}`;
  await createProperty(page, propertyTitle);
  await createClient(page, clientName);

  // Empty state.
  await page.getByRole("link", { name: "Alquileres" }).click();
  await expect(page).toHaveURL("/alquileres");
  await expect(page.getByText("Todavía no hay alquileres")).toBeVisible();

  // Create, linking the property and the client.
  await page.getByRole("link", { name: "Nuevo alquiler" }).first().click();
  await expect(page).toHaveURL("/alquileres/nuevo");

  await page
    .getByLabel("Propiedad", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: propertyTitle })
    .filter({ visible: true })
    .click();

  await page
    .getByLabel("Inquilino", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: clientName })
    .filter({ visible: true })
    .click();

  await page
    .getByLabel("Fecha de inicio", { exact: true })
    .filter({ visible: true })
    .fill("2026-01-15");
  await page
    .getByLabel("Canon mensual", { exact: true })
    .filter({ visible: true })
    .fill("250000");
  await page.getByRole("button", { name: "Crear alquiler" }).click();

  await expect(page).toHaveURL(/\/alquileres\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { name: propertyTitle, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(clientName).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText("ARS 250.000").filter({ visible: true }),
  ).toBeVisible();

  // It shows up in the list.
  await page.getByRole("link", { name: "Volver" }).click();
  await expect(page).toHaveURL("/alquileres");
  await expect(page.getByRole("heading", { name: propertyTitle })).toBeVisible();
  await expect(
    page.getByText("ARS 250.000").filter({ visible: true }),
  ).toBeVisible();

  // Edit: close the contract.
  await page.getByRole("heading", { name: propertyTitle }).click();
  await page.getByRole("link", { name: "Editar" }).click();
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

  await expect(
    page.getByRole("heading", { name: propertyTitle, level: 1 }),
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Finalizado" }),
  ).toBeVisible();

  // Delete -> back to empty list.
  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL("/alquileres");
  await expect(page.getByText("Todavía no hay alquileres")).toBeVisible();
});
