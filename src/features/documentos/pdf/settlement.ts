import "server-only";

import PDFDocument from "pdfkit";

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

export type SettlementPdfParty = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type SettlementPdfProperty = {
  title: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
};

export type SettlementPdfItem = {
  concept: string;
  amount: number;
  type: "gasto" | "adicional";
};

export type SettlementPdfData = {
  organizationName: string;
  period: string;
  property: SettlementPdfProperty | null;
  owner: SettlementPdfParty | null;
  grossAmount: number;
  feePercent: number;
  feeAmount: number;
  expensesTotal: number;
  additionsTotal: number;
  net: number;
  currency: string;
  status: string;
  paidDate: string | null;
  paidMethod: string | null;
  items: SettlementPdfItem[];
  notes: string | null;
};

export async function buildSettlementPdf(
  data: SettlementPdfData,
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
    doc.fontSize(10).font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(text);
  };

  doc.font("Helvetica-Bold").fontSize(18).text("Liquidación al propietario");
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(10).fillColor("#555");
  doc.text(`Emitido por ${value(data.organizationName)}`);
  doc.fillColor("#000");

  heading("Liquidación");
  line("Período", data.period);
  line("Estado", data.status);

  heading("Propiedad");
  if (data.property) {
    line("Título", value(data.property.title));
    line("Dirección", value(data.property.address));
    line("Ciudad", value(data.property.city));
    line("Provincia", value(data.property.province));
  } else {
    doc.fontSize(10).text(NOT_INFORMED);
  }

  heading("Propietario");
  if (data.owner) {
    line("Nombre", value(data.owner.name));
    line("Correo", value(data.owner.email));
    line("Teléfono", value(data.owner.phone));
  } else {
    doc.fontSize(10).text(NOT_INFORMED);
  }

  heading("Cálculo");
  line("Bruto cobrado", formatMoney(data.grossAmount, data.currency));
  line(
    `Honorarios (${data.feePercent}%)`,
    formatMoney(data.feeAmount, data.currency),
  );
  line("Gastos", `- ${formatMoney(data.expensesTotal, data.currency)}`);
  line("Adicionales", `+ ${formatMoney(data.additionsTotal, data.currency)}`);
  doc.moveDown(0.25);
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text(`Neto a pagar: ${formatMoney(data.net, data.currency)}`);
  doc.font("Helvetica").fontSize(10);

  if (data.items.length) {
    heading("Ítems");
    for (const item of data.items) {
      const sign = item.type === "gasto" ? "-" : "+";
      doc.fontSize(10);
      doc.text(`${item.concept}: ${sign} ${formatMoney(item.amount, data.currency)}`);
    }
  }

  if (data.notes) {
    heading("Notas");
    doc.text(data.notes);
  }

  if (data.paidDate) {
    heading("Pago");
    line("Fecha", formatDate(data.paidDate));
    line("Método", value(data.paidMethod));
  }

  doc.end();
  return done;
}
