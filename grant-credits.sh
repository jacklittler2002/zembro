#!/bin/bash
# Direct SQL to grant credits - run this against your Supabase database

# Get the first user's ID
USER_ID=$(psql "$DATABASE_URL" -t -c "SELECT id FROM \"User\" LIMIT 1;" 2>/dev/null)

if [ -z "$USER_ID" ]; then
  echo "❌ No users found in database"
  exit 1
fi

echo "🔄 Granting 100,000 credits to user: $USER_ID"

# Grant credits via SQL
psql "$DATABASE_URL" -c "
INSERT INTO \"AiCreditWallet\" (id, \"userId\", balance, \"lastTopupAt\", \"createdAt\", \"updatedAt\")
VALUES (gen_random_uuid(), '$USER_ID', 100000, now(), now(), now())
ON CONFLICT (\"userId\") DO UPDATE SET balance = balance + 100000;
" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Successfully granted 100,000 credits!"
else
  echo "⚠️  SQL execution failed - DATABASE_URL may not be set"
fi
