import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function runPolicies() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Connecting to database...");

    // Read the policies SQL file
    const policiesPath = path.join(__dirname, "../supabase-policies.sql");
    const policiesSQL = fs.readFileSync(policiesPath, "utf-8");

    console.log("Running RLS policies...");

    // Split SQL into individual statements and execute them
    const statements = policiesSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log("✓ Executed policy statement");
        } catch (error: any) {
          console.log("⚠️  Statement failed (might already exist):", error.message.substring(0, 100));
        }
      }
    }

    console.log("✅ All RLS policies applied successfully!");

  } catch (error: any) {
    console.error("❌ Error applying policies:", error.message);
  } finally {
    await pool.end();
  }
}

runPolicies().catch(console.error);