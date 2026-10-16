import { expect, test } from "@playwright/test";

const PASSWORD = "Password123";

test("redirige a /login cuando no hay sesión", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Bienvenido de vuelta" }),
  ).toBeVisible();
});

test("registro, panel, cierre de sesión y nuevo ingreso", async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`;
  const name = "Ana Gómez";

  await page.goto("/signup");
  await page.getByLabel("Nombre completo", { exact: true }).fill(name);
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page
    .getByLabel("Repetí tu contraseña", { exact: true })
    .fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Ana Inmobiliaria" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Menú de usuario" }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Ana Inmobiliaria" }),
  ).toBeVisible();
});

test("muestra un error con credenciales inválidas", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("nadie@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByText("Credenciales inválidas")).toBeVisible();
});
