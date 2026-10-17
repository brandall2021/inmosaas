import "server-only";

import PDFDocument from "pdfkit";

/**
 * Renders a commercial proposal PDF from a property snapshot plus optional
 * recipient, validity and message. Mirrors the contract generator: all data is
 * passed in so the produced file is a frozen copy of the property at that time.
 */

const NOT_INFORMED = "No informado";

export type ProposalProperty = {
  title: string;
  address: string | null;
  city: string | null;
  province: string | null;
  propertyTypeLabel: string;
  operationLabel: string;
  areaM2: number | null;
  price: number | null;
  currency: string;
};

export type ProposalRecipient = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type ProposalPdfData = {
  organizationName: string;
  property: ProposalProperty;
  recipient: ProposalRecipient | null;
  expiresAt: string | null;
  message: string | null;
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

export async function buildProposalPdf(
  data: ProposalPdfData,
): Promise<Buffer> {
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
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(text);
  };

  doc.font("Helvetica-Bold").fontSize(18).text("Propuesta comercial");
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10).fillColor("#555");
  doc.text(`Emitido por ${value(data.organizationName)}`);
  doc.fillColor("#000");

  heading("Inmueble");
  line("Título", value(data.property.title));
  line("Dirección", value(data.property.address));
  line("Ciudad", value(data.property.city));
  line("Provincia", value(data.property.province));
  line("Tipo", value(data.property.propertyTypeLabel));
  line("Operación", value(data.property.operationLabel));
  line(
    "Superficie",
    data.property.areaM2 !== null ? `${data.property.areaM2} m²` : NOT_INFORMED,
  );
  line("Precio", formatMoney(data.property.price, data.property.currency));

  heading("Destinatario");
  if (data.recipient) {
    line("Nombre", value(data.recipient.name));
    line("Correo", value(data.recipient.email));
    line("Teléfono", value(data.recipient.phone));
  } else {
    doc.fontSize(10).text(NOT_INFORMED);
  }

  heading("Vigencia");
  doc.fontSize(10).font("Helvetica").text(formatDate(data.expiresAt));

  if (data.message?.trim()) {
    heading("Mensaje");
    doc.fontSize(10).font("Helvetica").text(data.message.trim());
  }

  doc.end();
  return done;
}
