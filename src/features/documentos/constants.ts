const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 1,
});

/** Human-friendly file size, e.g. `1,4 MB`. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${numberFormatter.format(value)} ${units[unitIndex]}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Formats an instant for display, e.g. `12 mar 2026, 10:30`. */
export function formatDateTime(value: Date): string {
  return dateTimeFormatter.format(value);
}
