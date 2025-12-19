import { BasePolicy, PolicyContext, PolicyResult } from "./basePolicies";
/**
 * Lead Policy - Controls lead/contact operations
 */
export declare class LeadPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    filterData(context: PolicyContext, data: any): Promise<any>;
    private filterLeadData;
    private checkCompanyAccess;
    private checkCompanyOwnership;
    private getRecentExportCount;
}
/**
 * List Policy - Controls lead list operations
 */
export declare class ListPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    validateData(context: PolicyContext, data: any): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
}
/**
 * Company Policy - Controls company operations
 */
export declare class CompanyPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    private checkCompanyAccess;
    private checkCompanyOwnership;
}
/**
 * Notification Policy - Controls notification operations
 */
export declare class NotificationPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    filterData(context: PolicyContext, data: any): Promise<any>;
}
/**
 * Audit Log Policy - Controls audit log access
 */
export declare class AuditLogPolicy extends BasePolicy {
    name: string;
    check(context: PolicyContext): Promise<PolicyResult>;
    filterData(context: PolicyContext, data: any): Promise<any>;
}
//# sourceMappingURL=dataPolicies.d.ts.map