import { expect, test } from "@playwright/test";

const PASSWORD = "Password123";

type Page = import("@playwright/test").Page;

const PDF_BUFFER = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n%%EOF\n",
  "latin1",
);

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

async function createRental(
  page: Page,
  propertyTitle: string,
  clientName: string,
) {
  await page.getByRole("link", { name: "Alquileres" }).click();
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
}

async function expectPdfDownload(page: Page) {
  const href = await page
    .getByRole("link", { name: "Descargar" })
    .getAttribute("href");
  expect(href).toBeTruthy();
  const response = await page.request.get(href!);
  expect(response.status()).toBe(200);
  const buffer = await response.body();
  expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
}

test("sube, lista, busca y elimina un documento", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await signup(page);

  await page.getByRole("link", { name: "Documentos" }).click();
  await expect(page).toHaveURL("/documentos");
  await expect(page.getByText("Todavía no hay documentos")).toBeVisible();

  const title = `Escritura ${Date.now()}`;

  await page.getByRole("link", { name: "Subir documento" }).first().click();
  await expect(page).toHaveURL("/documentos/nuevo");

  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Archivo").setInputFiles({
    name: "escritura.pdf",
    mimeType: "application/pdf",
    buffer: PDF_BUFFER,
  });
  await page.getByRole("button", { name: "Subir documento" }).click();

  await expect(page).toHaveURL(/\/documentos\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { name: title, level: 1 }),
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Archivo" }),
  ).toBeVisible();
  await expectPdfDownload(page);

  // Listing shows the card.
  await page.getByRole("link", { name: "Volver" }).click();
  await expect(page).toHaveURL("/documentos");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  // Type filter: the document is an "Archivo", not a contract.
  await page.selectOption('select[name="tipo"]', "archivo");
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.selectOption('select[name="tipo"]', "contrato_alquiler");
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(
    page.getByText("No encontramos documentos con ese criterio"),
  ).toBeVisible();

  // Search by title.
  await page.selectOption('select[name="tipo"]', "");
  await page.getByPlaceholder("Buscar por título").fill(title);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByPlaceholder("Buscar por título").fill("no existe xyz");
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(
    page.getByText("No encontramos documentos con ese criterio"),
  ).toBeVisible();

  // Delete with confirmation.
  await page.getByPlaceholder("Buscar por título").fill(title);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await page.getByRole("heading", { name: title }).click();
  await expect(page).toHaveURL(/\/documentos\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Eliminar" }).click();

  await expect(page).toHaveURL("/documentos");
  await expect(page.getByText("Todavía no hay documentos")).toBeVisible();
});

test("genera un contrato desde un alquiler", async ({ page }) => {
  await signup(page);

  const propertyTitle = `Casa Contrato ${Date.now()}`;
  const clientName = `Inquilino Contrato ${Date.now()}`;
  await createProperty(page, propertyTitle);
  await createClient(page, clientName);
  await createRental(page, propertyTitle, clientName);

  await expect(
    page.getByRole("heading", { name: propertyTitle, level: 1 }),
  ).toBeVisible();

  await page
    .getByLabel("Condiciones adicionales")
    .fill("Depósito de un mes. Acepta mascotas.");
  await page.getByRole("button", { name: "Generar contrato" }).click();

  await expect(page).toHaveURL(/\/documentos\/[0-9a-f-]{36}$/);
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Contrato de alquiler" }),
  ).toBeVisible();
  await expectPdfDownload(page);

  await expect(page.getByText("Vinculado a")).toBeVisible();
  await expect(page.getByText(propertyTitle).first()).toBeVisible();
  await expect(page.getByText(clientName).first()).toBeVisible();

  await page.goto("/documentos?tipo=contrato_alquiler");
  await expect(page.getByRole("heading", { name: propertyTitle })).toBeVisible();
});

test("genera una propuesta desde una propiedad", async ({ page }) => {
  await signup(page);

  const title = `Depto Propuesta ${Date.now()}`;
  const clientName = `Interesado ${Date.now()}`;
  await createProperty(page, title);
  await createClient(page, clientName);

  // Back to the property detail to generate the proposal.
  await page.getByRole("link", { name: "Propiedades" }).click();
  await page.getByRole("heading", { name: title }).click();
  await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);

  await page
    .getByLabel("Destinatario", { exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("option", { name: clientName })
    .filter({ visible: true })
    .click();
  await page
    .getByLabel("Vigencia", { exact: true })
    .filter({ visible: true })
    .fill("2026-06-30");
  await page
    .getByLabel("Mensaje", { exact: true })
    .filter({ visible: true })
    .fill("Propuesta sujeta a disponibilidad.");
  await page.getByRole("button", { name: "Generar propuesta" }).click();

  await expect(page).toHaveURL(/\/documentos\/[0-9a-f-]{36}$/);
  await expect(
    page.locator('[data-slot="badge"]', { hasText: "Propuesta" }),
  ).toBeVisible();
  await expectPdfDownload(page);
  await expect(page.getByText(title).first()).toBeVisible();
  await expect(page.getByText(clientName).first()).toBeVisible();

  await page.goto("/documentos?tipo=propuesta");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
