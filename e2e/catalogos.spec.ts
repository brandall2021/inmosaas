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

test("carga, crea, filtra, edita y elimina elementos de catálogo", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  // Empty state on a brand-new tenant.
  await page.getByRole("link", { name: "Catálogos" }).click();
  await expect(page).toHaveURL("/catalogos");
  await expect(page.getByText("Todavía no cargaste catálogos")).toBeVisible();

  // Seed the starter catalog.
  await page
    .getByRole("button", { name: "Cargar ejemplos" })
    .first()
    .click();
  await expect(
    page.getByText("Palermo").filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('[data-slot="badge"]', { hasText: "Zona / Barrio" })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  // Create a custom entry.
  const name = `Etiqueta E2E ${Date.now()}`;
  await page.getByRole("link", { name: "Nuevo elemento" }).first().click();
  await expect(page).toHaveURL("/catalogos/nuevo");

  await page
    .getByLabel("Nombre", { exact: true })
    .filter({ visible: true })
    .fill(name);
  await page
    .getByLabel("Tipo de catálogo", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: "Etiqueta" })
    .filter({ visible: true })
    .click();
  await page
    .getByLabel("Descripción", { exact: true })
    .filter({ visible: true })
    .fill("Creada por el test E2E");
  await page.getByRole("button", { name: "Crear elemento" }).click();

  await expect(page).toHaveURL("/catalogos");
  await expect(page.getByText(name).filter({ visible: true })).toBeVisible();

  // Filter by kind through the tabs.
  await page.getByRole("link", { name: /^Etiqueta/ }).first().click();
  await expect(page).toHaveURL(/\/catalogos\?tipo=etiqueta/);
  await expect(page.getByText(name).filter({ visible: true })).toBeVisible();

  // Edit the custom entry.
  const updatedName = `${name} (editada)`;
  await page.getByRole("link", { name: `Editar ${name}` }).click();
  await expect(page).toHaveURL(/\/catalogos\/[0-9a-f-]{36}\/editar$/);

  await page
    .getByLabel("Nombre", { exact: true })
    .filter({ visible: true })
    .fill(updatedName);
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page).toHaveURL("/catalogos");
  await expect(
    page.getByText(updatedName).filter({ visible: true }),
  ).toBeVisible();

  // Delete it.
  await page.getByRole("button", { name: `Eliminar ${updatedName}` }).click();
  await expect(page).toHaveURL("/catalogos");
  await expect(
    page.getByText(updatedName).filter({ visible: true }),
  ).toHaveCount(0);
  // The seeded entries stay.
  await expect(
    page.getByText("Palermo").filter({ visible: true }),
  ).toBeVisible();
});
