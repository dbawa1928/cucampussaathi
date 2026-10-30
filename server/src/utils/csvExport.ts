/**
 * Utility for sanitizing and serializing data into safe CSV format.
 * Strictly prevents CSV Formula Injection (DDE injection).
 */

export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // CSV Formula Injection mitigation:
  // If the cell starts with formula characters (=, +, -, @, tab, carriage return)
  // or whitespace followed by those characters, prefix with single quote (')
  // to force spreadsheet programs (Excel, Calc, Sheets) to treat it as a literal string.
  if (/^[\t\r\s]*[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes by doubling them
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

export function generateCsv(
  headers: { key: string; label: string }[],
  rows: Record<string, any>[]
): string {
  const headerRow = headers.map((h) => sanitizeCsvCell(h.label)).join(',');
  const dataRows = rows.map((row) =>
    headers.map((h) => sanitizeCsvCell(row[h.key])).join(',')
  );

  return [headerRow, ...dataRows].join('\r\n');
}
