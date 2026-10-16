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

test("configura un webhook y revisa la actividad de la organización", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  // Genera actividad creando una propiedad que todavía no tiene fotos.
  const title = `Casa Config E2E ${Date.now()}`;
  await page.getByRole("link", { name: "Propiedades" }).click();
  await expect(page).toHaveURL("/propiedades");
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await expect(page).toHaveURL("/propiedades/nueva");
  await page
    .getByLabel("Título", { exact: true })
    .filter({ visible: true })
    .fill(title);
  await page.getByRole("button", { name: "Crear propiedad" }).click();
  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);

  // La bitácora registra la creación.
  await page.getByRole("link", { name: "Configuración" }).click();
  await expect(page).toHaveURL("/configuracion");
  await expect(
    page.getByRole("heading", { name: "Configuración", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(title).filter({ visible: true })).toBeVisible();
  await expect(
    page
      .locator('[data-slot="badge"]', { hasText: "Propiedad creada" })
      .filter({ visible: true }),
  ).toBeVisible();

  // Las automatizaciones señalan la propiedad recién creada sin imágenes.
  await expect(page.getByText("Propiedades sin fotos")).toBeVisible();
  await expect(page.getByText("Alquileres por vencer")).toBeVisible();

  // Guarda un webhook y lo activa.
  await page
    .getByLabel("URL del webhook", { exact: true })
    .filter({ visible: true })
    .fill("https://example.com/webhooks/inmo");
  await page
    .getByLabel("Enviar eventos a este webhook", { exact: true })
    .filter({ visible: true })
    .check();
  await page.getByRole("button", { name: "Guardar integración" }).click();

  await expect(page.getByText("Configuración guardada")).toBeVisible();
  await expect(
    page
      .locator('[data-slot="badge"]', { hasText: "Integración actualizada" })
      .filter({ visible: true }),
  ).toBeVisible();

  // La configuración persiste.
  await page.reload();
  await expect(
    page.getByLabel("URL del webhook", { exact: true }).filter({ visible: true }),
  ).toHaveValue("https://example.com/webhooks/inmo");
  await expect(
    page
      .getByLabel("Enviar eventos a este webhook", { exact: true })
      .filter({ visible: true }),
  ).toBeChecked();

  // Activar el webhook sin URL no pasa la validación.
  await page
    .getByLabel("URL del webhook", { exact: true })
    .filter({ visible: true })
    .fill("");
  await page.getByRole("button", { name: "Guardar integración" }).click();

  await expect(
    page.getByText("Completá la URL del webhook para activarlo"),
  ).toBeVisible();
});
