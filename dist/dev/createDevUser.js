"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = require("../db.js");
async function createDevUser() {
    try {
        // DEV LOGIN CREDENTIALS:
        // Email: jacklittler95@gmail.com
        // Password: Zembroadmin1
        // Create dev user in our database
        const user = await db_js_1.prisma.user.upsert({
            where: { email: "jacklittler95@gmail.com" },
            update: {},
            create: {
                id: "dev-user-jack-littler",
                email: "jacklittler95@gmail.com",
            },
        });
        console.log("✅ Dev user created in database:", user);
        console.log("\n📝 Now create in Supabase Auth:");
        console.log("Go to: https://supabase.com/dashboard/project/ltsdqqpcmizhaiodlmmf/auth/users");
        console.log("\nClick 'Add user' and enter:");
        console.log("  Email: jacklittler95@gmail.com");
        console.log("  Password: Zembroadmin1");
        console.log("  Auto Confirm: Yes");
    }
    catch (error) {
        console.error("Error creating dev user:", error);
    }
    finally {
        await db_js_1.prisma.$disconnect();
    }
}
createDevUser();
//# sourceMappingURL=createDevUser.js.map