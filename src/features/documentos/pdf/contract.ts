import "server-only";

import PDFDocument from "pdfkit";

/**
 * Renders a rental contract PDF from a plain data snapshot. Everything the
 * document needs is passed in, so the bytes are frozen at generation time and
 * later edits to the rental never change an already-generated file.
 */

const NOT_INFORMED = "No informado";

export type ContractParty = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type ContractProperty = {
  address: string | null;
  city: string | null;
  province: string | null;
  areaM2: number | null;
};

export type ContractPdfData = {
  organizationName: string;
  property: ContractProperty | null;
  client: ContractParty | null;
  rentAmount: number | null;
  currency: string;
  startDate: string;
  endDate: string | null;
  additionalNotes: string | null;
};

function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) {
    return NOT_INFORMED;
  }
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currency} ${formatted}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return NOT_INFORMED;
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return NOT_INFORMED;
  }
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function value(input: string | null | undefined): string {
  const trimmed = input?.trim();
  return trimmed ? trimmed : NOT_INFORMED;
}

export async function buildContractPdf(data: ContractPdfData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const heading = (text: string) => {
    doc.moveDown(1);
    doc.fontSize(12).fillColor("#111").text(text, { underline: true });
    doc.moveDown(0.5);
    doc.fillColor("#000");
  };

  const line = (label: string, text: string) => {
    doc.fontSize(10).font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(text);
  };

  doc.font("Helvetica-Bold").fontSize(18).text("Contrato de alquiler");
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10).fillColor("#555");
  doc.text(`Emitido por ${value(data.organizationName)}`);
  doc.fillColor("#000");

  heading("Inmueble");
  if (data.property) {
    line("Dirección", value(data.property.address));
    line("Ciudad", value(data.property.city));
    line("Provincia", value(data.property.province));
    line(
      "Superficie",
      data.property.areaM2 !== null ? `${data.property.areaM2} m²` : NOT_INFORMED,
    );
  } else {
    doc.fontSize(10).text(NOT_INFORMED);
  }

  heading("Inquilino");
  if (data.client) {
    line("Nombre", value(data.client.name));
    line("Correo", value(data.client.email));
    line("Teléfono", value(data.client.phone));
  } else {
    doc.fontSize(10).text(NOT_INFORMED);
  }

  heading("Condiciones");
  line("Canon mensual", formatMoney(data.rentAmount, data.currency));
  line("Inicio", formatDate(data.startDate));
  line("Fin", formatDate(data.endDate));

  if (data.additionalNotes?.trim()) {
    heading("Condiciones adicionales");
    doc.fontSize(10).font("Helvetica").text(data.additionalNotes.trim());
  }

  doc.moveDown(2);
  doc.fontSize(10).font("Helvetica").text("Firmas");
  doc.moveDown(2);
  doc.text("____________________________          ____________________________");
  doc.fontSize(8).fillColor("#555");
  doc.text("Inmobiliaria                                              Inquilino");
  doc.fillColor("#000");

  doc.end();
  return done;
}
