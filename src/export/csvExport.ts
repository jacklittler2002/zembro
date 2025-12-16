export interface CsvLeadRow {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  website: string;
  city: string;
  country: string;
  niche: string;
  industry: string;
  size_bucket: string;
  role: string;
  decision_maker: string; // "yes"/"no"
}

/**
 * Escape a CSV value by wrapping in quotes and doubling internal quotes
 */
function escapeCsv(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert an array of lead rows to CSV format
 */
export function leadsToCsv(rows: CsvLeadRow[]): string {
  const header =
    "email,first_name,last_name,company,website,city,country,niche,industry,size_bucket,role,decision_maker";

  const lines = rows.map((row) => {
    return [
      escapeCsv(row.email),
      escapeCsv(row.first_name),
      escapeCsv(row.last_name),
      escapeCsv(row.company),
      escapeCsv(row.website),
      escapeCsv(row.city),
      escapeCsv(row.country),
      escapeCsv(row.niche),
      escapeCsv(row.industry),
      escapeCsv(row.size_bucket),
      escapeCsv(row.role),
      escapeCsv(row.decision_maker),
    ].join(",");
  });

  return [header, ...lines].join("\n");
}
