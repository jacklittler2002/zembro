import { Request, Response, NextFunction } from "express";
export interface AuthedRequest extends Request {
    userId?: string;
    userEmail?: string;
}
export declare function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=authMiddleware.d.ts.map