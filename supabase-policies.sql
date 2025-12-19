-- Enable Row Level Security on all tables
-- Run this in Supabase SQL Editor or as a migration

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadSearch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrawlJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiCreditWallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiCreditTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TedConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TedMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIFeedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingCustomer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadExport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "List" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ListLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadList" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadListItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignEmailAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignEmail" ENABLE ROW LEVEL SECURITY;

-- User policies (users can only see themselves)
CREATE POLICY "Users can view own record" ON "User"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON "User"
  FOR UPDATE USING (auth.uid() = id);

-- Company policies (users can see companies from their lead searches)
CREATE POLICY "Users can view companies from their lead searches" ON "Company"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "LeadSearch" ls
      WHERE ls."userId"::text = auth.uid()::text
      AND ls.id IN (
        SELECT DISTINCT lsc."leadSearchId"
        FROM "_LeadSearchToCompany" lsc
        WHERE lsc."B" = "Company".id
      )
    )
  );

CREATE POLICY "Users can view favorited companies" ON "Company"
  FOR SELECT USING ("isFavorited" = true);

CREATE POLICY "Users can update companies from their lead searches" ON "Company"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "LeadSearch" ls
      WHERE ls."userId"::text = auth.uid()::text
      AND ls.id IN (
        SELECT DISTINCT lsc."leadSearchId"
        FROM "_LeadSearchToCompany" lsc
        WHERE lsc."B" = "Company".id
      )
    )
  );

-- Contact policies (users can see contacts from companies in their lead searches)
CREATE POLICY "Users can view contacts from their companies" ON "Contact"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Company" c
      WHERE c.id = "Contact"."companyId"
      AND (
        EXISTS (
          SELECT 1 FROM "LeadSearch" ls
          WHERE ls."userId"::text = auth.uid()::text
          AND ls.id IN (
            SELECT DISTINCT lsc."leadSearchId"
            FROM "_LeadSearchToCompany" lsc
            WHERE lsc."B" = c.id
          )
        )
        OR c."isFavorited" = true
      )
    )
  );

-- LeadSearch policies (users can only see their own searches)
CREATE POLICY "Users can view own lead searches" ON "LeadSearch"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own lead searches" ON "LeadSearch"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own lead searches" ON "LeadSearch"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- CrawlJob policies (users can see jobs from their lead searches)
CREATE POLICY "Users can view crawl jobs from their lead searches" ON "CrawlJob"
  FOR SELECT USING (
    "leadSearchId" IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM "LeadSearch" ls
      WHERE ls.id = "CrawlJob"."leadSearchId"
      AND ls."userId"::text = auth.uid()::text
    )
  );

-- AiCreditWallet policies (users can only see their own wallet)
CREATE POLICY "Users can view own credit wallet" ON "AiCreditWallet"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update own credit wallet" ON "AiCreditWallet"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- AiCreditTransaction policies (users can see transactions for their wallet)
CREATE POLICY "Users can view transactions for their wallet" ON "AiCreditTransaction"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "AiCreditWallet" w
      WHERE w.id = "AiCreditTransaction"."walletId"
      AND w."userId"::text = auth.uid()::text
    )
  );

-- TedConversation policies (users can only see their own conversations)
CREATE POLICY "Users can view own TED conversations" ON "TedConversation"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own TED conversations" ON "TedConversation"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own TED conversations" ON "TedConversation"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- TedMessage policies (users can see messages from their conversations)
CREATE POLICY "Users can view messages from their conversations" ON "TedMessage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "TedConversation" tc
      WHERE tc.id = "TedMessage"."conversationId"
      AND tc."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON "TedMessage"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "TedConversation" tc
      WHERE tc.id = "TedMessage"."conversationId"
      AND tc."userId"::text = auth.uid()::text
    )
  );

-- AIFeedback policies (users can only see their own feedback)
CREATE POLICY "Users can view own AI feedback" ON "AIFeedback"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own AI feedback" ON "AIFeedback"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own AI feedback" ON "AIFeedback"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- BillingCustomer policies (users can only see their own billing info)
CREATE POLICY "Users can view own billing customer" ON "BillingCustomer"
  FOR SELECT USING (auth.uid()::text = "userId");

-- Subscription policies (users can only see their own subscriptions)
CREATE POLICY "Users can view own subscriptions" ON "Subscription"
  FOR SELECT USING (auth.uid()::text = "userId");

-- LeadExport policies (users can only see their own exports)
CREATE POLICY "Users can view own lead exports" ON "LeadExport"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own lead exports" ON "LeadExport"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- List policies (users can only see their own lists)
CREATE POLICY "Users can view own lists" ON "List"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own lists" ON "List"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own lists" ON "List"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own lists" ON "List"
  FOR DELETE USING (auth.uid()::text = "userId");

-- ListLead policies (users can see leads in their lists)
CREATE POLICY "Users can view leads in their lists" ON "ListLead"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "List" l
      WHERE l.id = "ListLead"."listId"
      AND l."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create leads in their lists" ON "ListLead"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "List" l
      WHERE l.id = "ListLead"."listId"
      AND l."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete leads from their lists" ON "ListLead"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "List" l
      WHERE l.id = "ListLead"."listId"
      AND l."userId"::text = auth.uid()::text
    )
  );

-- LeadList policies (users can only see their own lead lists)
CREATE POLICY "Users can view own lead lists" ON "LeadList"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own lead lists" ON "LeadList"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own lead lists" ON "LeadList"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own lead lists" ON "LeadList"
  FOR DELETE USING (auth.uid()::text = "userId");

-- LeadListItem policies (users can see items in their lead lists)
CREATE POLICY "Users can view items in their lead lists" ON "LeadListItem"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "LeadList" ll
      WHERE ll.id = "LeadListItem"."leadListId"
      AND ll."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create items in their lead lists" ON "LeadListItem"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "LeadList" ll
      WHERE ll.id = "LeadListItem"."leadListId"
      AND ll."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update items in their lead lists" ON "LeadListItem"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "LeadList" ll
      WHERE ll.id = "LeadListItem"."leadListId"
      AND ll."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete items from their lead lists" ON "LeadListItem"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "LeadList" ll
      WHERE ll.id = "LeadListItem"."leadListId"
      AND ll."userId"::text = auth.uid()::text
    )
  );

-- EmailAccount policies (users can only see their own email accounts)
CREATE POLICY "Users can view own email accounts" ON "EmailAccount"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own email accounts" ON "EmailAccount"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own email accounts" ON "EmailAccount"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own email accounts" ON "EmailAccount"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Campaign policies (users can only see their own campaigns)
CREATE POLICY "Users can view own campaigns" ON "Campaign"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own campaigns" ON "Campaign"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own campaigns" ON "Campaign"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own campaigns" ON "Campaign"
  FOR DELETE USING (auth.uid()::text = "userId");

-- CampaignStep policies (users can see steps in their campaigns)
CREATE POLICY "Users can view steps in their campaigns" ON "CampaignStep"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignStep"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create steps in their campaigns" ON "CampaignStep"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignStep"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update steps in their campaigns" ON "CampaignStep"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignStep"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete steps from their campaigns" ON "CampaignStep"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignStep"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

-- CampaignEmailAccount policies (users can see email accounts in their campaigns)
CREATE POLICY "Users can view email accounts in their campaigns" ON "CampaignEmailAccount"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignEmailAccount"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage email accounts in their campaigns" ON "CampaignEmailAccount"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignEmailAccount"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

-- CampaignEmail policies (users can see emails from their campaigns)
CREATE POLICY "Users can view emails from their campaigns" ON "CampaignEmail"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignEmail"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create emails in their campaigns" ON "CampaignEmail"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignEmail"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update emails in their campaigns" ON "CampaignEmail"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Campaign" c
      WHERE c.id = "CampaignEmail"."campaignId"
      AND c."userId"::text = auth.uid()::text
    )
  );

-- UserPreferences policies (users can only see their own preferences)
CREATE POLICY "Users can view own preferences" ON "UserPreferences"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own preferences" ON "UserPreferences"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own preferences" ON "UserPreferences"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- Notification policies (users can only see their own notifications)
CREATE POLICY "Users can view own notifications" ON "Notification"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update own notifications" ON "Notification"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- AuditLog policies (users can only see their own audit logs, admins can see all)
CREATE POLICY "Users can view own audit logs" ON "AuditLog"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ApiKey policies (users can only see their own API keys)
CREATE POLICY "Users can view own API keys" ON "ApiKey"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own API keys" ON "ApiKey"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own API keys" ON "ApiKey"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own API keys" ON "ApiKey"
  FOR DELETE USING (auth.uid()::text = "userId");

-- UserSession policies (users can only see their own sessions)
CREATE POLICY "Users can view own sessions" ON "UserSession"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own sessions" ON "UserSession"
  FOR DELETE USING (auth.uid()::text = "userId");

-- FileUpload policies (users can only see their own files)
CREATE POLICY "Users can view own files" ON "FileUpload"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own files" ON "FileUpload"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own files" ON "FileUpload"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own files" ON "FileUpload"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Integration policies (users can only see their own integrations)
CREATE POLICY "Users can view own integrations" ON "Integration"
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own integrations" ON "Integration"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own integrations" ON "Integration"
  FOR UPDATE USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own integrations" ON "Integration"
  FOR DELETE USING (auth.uid()::text = "userId");