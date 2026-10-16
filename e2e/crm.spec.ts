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

test("crea, edita, busca y elimina un cliente", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  // Empty state on a brand-new tenant.
  await page.getByRole("link", { name: "CRM" }).click();
  await expect(page).toHaveURL("/crm");
  await expect(page.getByText("Todavía no hay clientes")).toBeVisible();

  // Create.
  const name = `Mateo E2E ${Date.now()}`;
  await page.getByRole("link", { name: "Nuevo cliente" }).first().click();
  await expect(page).toHaveURL("/crm/nuevo");

  await page
    .getByLabel("Nombre completo", { exact: true })
    .filter({ visible: true })
    .fill(name);
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .filter({ visible: true })
    .fill("mateo@example.com");
  await page
    .getByLabel("Teléfono", { exact: true })
    .filter({ visible: true })
    .fill("+54 11 5555 5555");
  await page.getByRole("button", { name: "Crear cliente" }).click();

  await expect(page).toHaveURL(/\/crm\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
  await expect(
    page.getByText("mateo@example.com").filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Nuevo" }).filter({ visible: true }),
  ).toBeVisible();

  // It shows up in the list.
  await page.getByRole("link", { name: "Volver" }).click();
  await expect(page).toHaveURL("/crm");
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // Search filters the list.
  await page
    .getByPlaceholder("Buscar por nombre, correo o teléfono")
    .filter({ visible: true })
    .fill("Mateo");
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveURL(/\/crm\?q=Mateo/);
  await expect(page.getByRole("heading", { name })).toBeVisible();

  // Edit (also advance the pipeline stage).
  await page.getByRole("heading", { name }).click();
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/crm\/[0-9a-f-]{36}\/editar$/);

  const updatedName = `${name} (editado)`;
  await page
    .getByLabel("Nombre completo", { exact: true })
    .filter({ visible: true })
    .fill(updatedName);
  await page
    .getByLabel("Etapa", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: "En negociación" })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(
    page.getByRole("heading", { name: updatedName, level: 1 }),
  ).toBeVisible();
  await expect(
    page
      .locator('[data-slot="badge"]', { hasText: "En negociación" })
      .filter({ visible: true }),
  ).toBeVisible();

  // Delete -> back to empty list.
  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL("/crm");
  await expect(page.getByText("Todavía no hay clientes")).toBeVisible();
});
