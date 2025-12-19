"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const supabaseAdmin_1 = require("./supabaseAdmin");
const db_1 = require("../db");
const billingService_1 = require("../billing/billingService");
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Missing Authorization header" });
        }
        const token = authHeader.replace("Bearer ", "");
        const { data, error } = await supabaseAdmin_1.supabaseAdmin.auth.getUser(token);
        if (error || !data?.user) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const user = data.user;
        // Sync to local User table
        const dbUser = await db_1.prisma.user.upsert({
            where: { id: user.id },
            update: { email: user.email ?? "" },
            create: {
                id: user.id,
                email: user.email ?? "",
            },
        });
        // Ensure billing customer exists (creates Stripe customer if needed)
        // TODO: This could be moved to a background job for better performance
        try {
            await (0, billingService_1.getOrCreateBillingCustomer)(dbUser.id, dbUser.email);
        }
        catch (err) {
            console.error("Failed to create billing customer:", err);
            // Don't fail auth if billing customer creation fails
        }
        req.userId = dbUser.id;
        req.userEmail = dbUser.email;
        return next();
    }
    catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(500).json({ error: "Auth failed" });
    }
}
//# sourceMappingURL=authMiddleware.js.map