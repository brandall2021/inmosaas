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

test("crea, edita y elimina una propiedad", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  // Empty state on a brand-new tenant.
  await page.getByRole("link", { name: "Propiedades" }).click();
  await expect(page).toHaveURL("/propiedades");
  await expect(page.getByText("Todavía no hay propiedades")).toBeVisible();

  // Create.
  const title = `Casa E2E ${Date.now()}`;
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await expect(page).toHaveURL("/propiedades/nueva");

  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Precio", { exact: true }).fill("120000");
  await page.getByLabel("Ciudad", { exact: true }).fill("Rosario");
  await page.getByRole("button", { name: "Crear propiedad" }).click();

  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByText("USD 120.000")).toBeVisible();
  await expect(page.getByText("Rosario")).toBeVisible();

  // It shows up in the list.
  await page.getByRole("link", { name: "Volver" }).click();
  await expect(page).toHaveURL("/propiedades");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Edit.
  await page.getByRole("heading", { name: title }).click();
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}\/editar$/);

  const updatedTitle = `${title} (editado)`;
  await page.getByLabel("Título", { exact: true }).fill(updatedTitle);
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(
    page.getByRole("heading", { name: updatedTitle, level: 1 }),
  ).toBeVisible();

  // Delete -> back to empty list.
  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page).toHaveURL("/propiedades");
  await expect(page.getByText("Todavía no hay propiedades")).toBeVisible();
});

// 1x1 transparent PNG.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

test("sube y elimina una imagen de una propiedad", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await page.getByLabel("Título", { exact: true }).fill("Depto con foto");
  await page.getByRole("button", { name: "Crear propiedad" }).click();

  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Sin imágenes cargadas todavía.")).toBeVisible();

  // Upload.
  await page.getByLabel("Imagen", { exact: true }).setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: Buffer.from(PNG_BASE64, "base64"),
  });
  await page.getByRole("button", { name: "Subir" }).click();

  const image = page.locator('img[src*="/api/uploads/"]');
  await expect(image).toBeVisible();
  await expect(
    page.getByText("Sin imágenes cargadas todavía."),
  ).toHaveCount(0);

  // The image is served only through the authenticated route.
  const src = await image.getAttribute("src");
  const response = await page.request.get(src!);
  expect(response.ok()).toBeTruthy();

  // Delete.
  await page.getByRole("button", { name: "Eliminar imagen" }).click();
  await expect(page.getByText("Sin imágenes cargadas todavía.")).toBeVisible();
});

