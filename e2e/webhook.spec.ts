import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";

import {
  computeSignature,
  SIGNATURE_HEADER,
  verifySignature,
} from "../src/lib/webhook-signature";

const PASSWORD = "Password123";

type ReceivedRequest = {
  path: string;
  body: string;
  signature: string | undefined;
};

/** Local HTTP receiver that records every webhook POST. */
async function startReceiver(): Promise<{
  server: Server;
  url: string;
  requests: ReceivedRequest[];
}> {
  const requests: ReceivedRequest[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      requests.push({
        path: request.url ?? "/",
        body: Buffer.concat(chunks).toString("utf8"),
        signature:
          (request.headers[SIGNATURE_HEADER.toLowerCase()] as
            | string
            | undefined) ??
          (request.headers[SIGNATURE_HEADER] as string | undefined),
      });
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    server,
    url: `http://127.0.0.1:${port}/hook`,
    requests,
  };
}

test("el HMAC firma el cuerpo exacto y el header se comporta con y sin secreto", async () => {
  const body = JSON.stringify({ event: "property.created", data: { title: "x" } });
  const secret = "secreto-de-prueba";

  const signature = computeSignature(secret, body);
  expect(signature).toMatch(/^[0-9a-f]{64}$/);
  expect(verifySignature(secret, body, signature)).toBe(true);
  // Any byte flipped breaks the signature (tampered body scenario).
  expect(verifySignature(secret, `${body} `, signature)).toBe(false);
  // A different secret produces a different signature.
  expect(
    verifySignature("otro-secreto", body, signature),
  ).toBe(false);
  // No secret configured -> no signature header.
  expect(verifySignature(secret, body, undefined)).toBe(false);
});

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

test("una propiedad creada dispara el webhook y el ping queda en el registro", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  const receiver = await startReceiver();
  const secret = "secreto-e2e-123";
  try {
    await signup(page);

    await page.getByRole("link", { name: "Configuración" }).click();
    await expect(page).toHaveURL("/configuracion");
    await page
      .getByLabel("URL del webhook", { exact: true })
      .fill(receiver.url);
    await page
      .getByLabel("Enviar eventos a este webhook", { exact: true })
      .check();
    await page
      .getByLabel("Secreto de firma (opcional)", { exact: true })
      .fill(secret);
    await page.getByRole("button", { name: "Guardar integración" }).click();
    await expect(page.getByText("Configuración guardada")).toBeVisible();

    // The ping test button delivers a signed event and logs it.
    await page.getByRole("button", { name: "Probar conexión" }).click();
    await expect(
      page.getByText("El receptor respondió OK"),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "ping", exact: true })).toBeVisible();

    // Create a property: the action must finish fine even if the receiver
    // is slow; the delivery arrives in the background.
    const title = `Casa Webhook E2E ${Date.now()}`;
    await page.getByRole("link", { name: "Propiedades" }).click();
    await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByRole("button", { name: "Crear propiedad" }).click();
    await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);

    await page.getByRole("link", { name: "Configuración" }).click();
    await expect(
      page.locator("td", { hasText: "property.created" }).first(),
    ).toBeVisible();

    // Receiver payloads: stable contract + verified HMAC.
    expect(receiver.requests.length).toBeGreaterThanOrEqual(2);
    const ping = receiver.requests.find((request) => request.path === "/hook");
    expect(ping).toBeDefined();
    const pingPayload = JSON.parse(ping!.body);
    expect(pingPayload.event).toBe("ping");
    expect(pingPayload.entity_id).toBeNull();
    expect(pingPayload.data.message).toContain("InmoSaaS");
    expect(typeof pingPayload.at).toBe("string");
    expect(verifySignature(secret, ping!.body, ping!.signature)).toBe(true);

    const created = receiver.requests.find(
      (request) => JSON.parse(request.body).event === "property.created",
    );
    expect(created).toBeDefined();
    const createdPayload = JSON.parse(created!.body);
    expect(createdPayload.entity_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(createdPayload.data.title).toBe(title);
    expect(verifySignature(secret, created!.body, created!.signature)).toBe(
      true,
    );

    // Registrations: HTTP 200 for every delivery.
    const deliveredRows = page.locator("td", {
      hasText: "Entregado",
    });
    await expect(deliveredRows.first()).toBeVisible();
  } finally {
    await new Promise<void>((resolve) => receiver.server.close(() => resolve()));
  }
});
test("con el webhook desactivado no hay entrega ni registro", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());

  const receiver = await startReceiver();
  try {
    await signup(page);

    await page.getByRole("link", { name: "Configuración" }).click();
    await page
      .getByLabel("URL del webhook", { exact: true })
      .fill(receiver.url);
    // Enabled remains unchecked: URL saved but never fires.
    await page.getByRole("button", { name: "Guardar integración" }).click();
    await expect(page.getByText("Configuración guardada")).toBeVisible();

    const title = `Casa Silencio E2E ${Date.now()}`;
    await page.getByRole("link", { name: "Propiedades" }).click();
    await page.getByRole("link", { name: "Nueva propiedad" }).first().click();
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByRole("button", { name: "Crear propiedad" }).click();
    await expect(page).toHaveURL(/\/propiedades\/[0-9a-f-]{36}$/);

    await page.getByRole("link", { name: "Configuración" }).click();
    await expect(
      page.getByText("Todavía no hay entregas registradas."),
    ).toBeVisible();

    // Give the app a moment: nothing may arrive at the receiver.
    await page.waitForTimeout(1500);
    expect(receiver.requests).toHaveLength(0);
  } finally {
    await new Promise<void>((resolve) => receiver.server.close(() => resolve()));
  }
});
