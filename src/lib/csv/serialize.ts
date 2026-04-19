export type CsvCell = string | number | boolean | Date | null | undefined;

export function formatCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function escapeCsvField(value: CsvCell): string {
  const text = formatCsvCell(value);
  if (text.length === 0) return "";
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function writeCsv(headers: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<CsvCell>>): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvField).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}
