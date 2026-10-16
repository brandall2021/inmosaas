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

test("crea, edita y elimina una tasación", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  await page.getByRole("link", { name: "Tasaciones" }).click();
  await expect(page).toHaveURL("/tasaciones");
  await expect(page.getByText("Todavía no hay tasaciones")).toBeVisible();

  const title = `Tasación E2E ${Date.now()}`;
  await page.getByRole("link", { name: "Nueva tasación" }).first().click();
  await expect(page).toHaveURL("/tasaciones/nuevo");

  await page
    .getByLabel("Título", { exact: true })
    .filter({ visible: true })
    .fill(title);
  await page
    .getByLabel("Dirección", { exact: true })
    .filter({ visible: true })
    .fill("Av. Corrientes 1234");
  await page
    .getByLabel("Superficie (m²)", { exact: true })
    .filter({ visible: true })
    .fill("80");
  await page
    .getByLabel("Valor por m²", { exact: true })
    .filter({ visible: true })
    .fill("4500");
  await page
    .getByLabel("Valor total estimado", { exact: true })
    .filter({ visible: true })
    .fill("360000");
  await page.getByRole("button", { name: "Crear tasación" }).click();

  await expect(page).toHaveURL(/\/tasaciones\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(
    page.getByText("80 m²", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText("USD 360.000", { exact: true }).filter({ visible: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Volver" }).click();
  await expect(page).toHaveURL("/tasaciones");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    page.getByText("Total estimado: USD 360.000").filter({ visible: true }),
  ).toBeVisible();

  await page.getByRole("heading", { name: title }).click();
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/tasaciones\/[0-9a-f-]{36}\/editar$/);

  const updatedTitle = `${title} (editado)`;
  await page
    .getByLabel("Título", { exact: true })
    .filter({ visible: true })
    .fill(updatedTitle);
  await page
    .getByLabel("Estado", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: "Completada" })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(
    page.getByRole("heading", { name: updatedTitle, level: 1 }),
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Completada" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL("/tasaciones");
  await expect(page.getByText("Todavía no hay tasaciones")).toBeVisible();
});
