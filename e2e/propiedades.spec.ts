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

async function seedStarterCatalog(page: import("@playwright/test").Page) {
  await page.getByRole("link", { name: "Catálogos" }).click();
  await page.getByRole("button", { name: "Cargar ejemplos" }).first().click();
  await expect(page.getByText("Palermo").filter({ visible: true })).toBeVisible();
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

test("usa el catálogo de zonas y características en el alta", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);
  await seedStarterCatalog(page);

  // With a catalog, the zone field is a select fed by the tenant's entries.
  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await expect(page).toHaveURL("/propiedades/nueva");

  const title = `Casa Palermo E2E ${Date.now()}`;
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Zona", { exact: true }).click();
  await page.getByRole("option", { name: "Palermo" }).click();
  await page.getByLabel("Pileta", { exact: true }).check();
  await page.getByLabel("Parrilla", { exact: true }).check();
  await page.getByRole("button", { name: "Crear propiedad" }).click();

  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);
  await expect(
    page.locator("dd", { hasText: "Palermo" }),
  ).toBeVisible();
  await expect(page.getByTestId("property-amenities")).toContainText("Pileta");
  await expect(page.getByTestId("property-amenities")).toContainText("Parrilla");

  // The card in the list shows the zone too.
  await page.getByRole("link", { name: "Volver" }).click();
  await expect(
    page.getByRole("heading", { name: title }),
  ).toBeVisible();
  await expect(page.getByText("Zona: Palermo").first()).toBeVisible();

  // Deleting the amenity from the catalog does not affect properties that
  // already use it: editing keeps the stored value.
  await page.getByRole("link", { name: "Catálogos" }).click();
  await page.getByRole("link", { name: /^Amenity/ }).first().click();
  await expect(page).toHaveURL(/\/catalogos\?tipo=amenity/);
  await page.getByRole("button", { name: "Eliminar Pileta" }).click();
  await expect(page.getByRole("button", { name: "Eliminar Pileta" })).toHaveCount(0);

  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("heading", { name: title }).click();
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}\/editar$/);
  await expect(
    page.getByLabel(/Pileta \(fuera de catálogo\)/),
  ).toBeChecked();
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("property-amenities")).toContainText("Pileta");
});

test("sin catálogo la zona es texto libre y las características no se ofrecen", async ({
  page,
}) => {
  await signup(page);

  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await expect(page).toHaveURL("/propiedades/nueva");

  const title = `Casa Libre E2E ${Date.now()}`;
  await page.getByLabel("Título", { exact: true }).fill(title);
  // Fallback: free-text zone input (the tenant has no zone entries).
  await page
    .getByLabel("Zona", { exact: true })
    .fill(`Zona Libre ${Date.now()}`);
  // No amenity/servicio entries in the catalog -> no multiselection at all.
  await expect(
    page
      .locator('input[name="amenities"]')
      .filter({ visible: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Crear propiedad" }).click();

  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);
  await expect(page.getByText(/Zona Libre \d+/)).toBeVisible();
});

test("el catálogo es por organización", async ({ page }) => {
  await signup(page);
  await seedStarterCatalog(page);

  // A second tenant: brand-new account, fresh organization, empty catalog.
  await page.getByLabel("Menú de usuario").click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/(login|dashboard)/);
  await page.goto("/signup");
  const email = `e2e+${Date.now()}@example.com`;
  await page.getByLabel("Nombre completo", { exact: true }).fill("Beto Ruiz");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page
    .getByLabel("Repetí tu contraseña", { exact: true })
    .fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL("/dashboard");

  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
  await expect(page).toHaveURL("/propiedades/nueva");

  // The zone field falls back to free text: the other tenant's entries are
  // not visible anywhere.
  await expect(page.locator('input[name="zone"]')).toBeVisible();
  await expect(
    page.locator('input[name="amenities"]'),
  ).toHaveCount(0);
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

