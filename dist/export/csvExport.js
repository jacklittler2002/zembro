"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsToCsv = leadsToCsv;
/**
 * Escape a CSV value by wrapping in quotes and doubling internal quotes
 */
function escapeCsv(value) {
    if (value.includes(",") ||
        value.includes('"') ||
        value.includes("\n") ||
        value.includes("\r")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
/**
 * Convert an array of lead rows to CSV format
 */
function leadsToCsv(rows) {
    const header = "email,first_name,last_name,company,website,city,country,niche,industry,size_bucket,role,decision_maker";
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
//# sourceMappingURL=csvExport.js.map