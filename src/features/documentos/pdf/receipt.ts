import "server-only";

import PDFDocument from "pdfkit";

import type { Currency } from "@/db/schema";

const NOT_INFORMED = "No informado";

function value(input: string | null | undefined): string {
  const trimmed = input?.trim();
  return trimmed ? trimmed : NOT_INFORMED;
}

function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) {
    return NOT_INFORMED;
  }
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
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

export type ReceiptPdfParty = {
  name: string | null;
  type: string | null;
};

export type ReceiptPdfData = {
  organizationName: string;
  period: string;
  client: ReceiptPdfParty | null;
  propertyTitle: string | null;
  amount: number;
  currency: Currency;
  method: string;
  issuedDate: string;
  paidDate: string | null;
  status: string;
  notes: string | null;
};

export async function buildReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
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

  doc.font("Helvetica-Bold").fontSize(18).text("Recibo");
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10).fillColor("#555");
  doc.text(`Emitido por ${value(data.organizationName)}`);
  doc.fillColor("#000");

  heading("Recibo");
  line("Período", data.period);
  line("Estado", data.status);
  line("Fecha de emisión", formatDate(data.issuedDate));
  if (data.paidDate) {
    line("Fecha de pago", formatDate(data.paidDate));
  }

  heading("Destinatario");
  if (data.client) {
    line("Nombre", value(data.client.name));
    line("Tipo", value(data.client.type));
  } else {
    doc.fontSize(10).text(NOT_INFORMED);
  }

  if (data.propertyTitle) {
    line("Propiedad / Alquiler", data.propertyTitle);
  }

  heading("Detalle");
  line("Monto", formatMoney(data.amount, data.currency));
  line("Método de pago", data.method);
  if (data.notes) {
    line("Notas", data.notes);
  }

  doc.end();
  return done;
}
