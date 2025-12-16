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
    decision_maker: string;
}
/**
 * Convert an array of lead rows to CSV format
 */
export declare function leadsToCsv(rows: CsvLeadRow[]): string;
//# sourceMappingURL=csvExport.d.ts.map