# Complete Data Saving Implementation

This document outlines all the data saving capabilities implemented in the Zembro platform.

## Database Schema

The platform uses PostgreSQL with Prisma ORM and includes comprehensive data models for:

### Core Business Models
- **User**: User accounts with authentication
- **Company**: Business entities discovered through lead searches
- **Contact**: Individual contacts associated with companies
- **LeadSearch**: AI-powered lead discovery campaigns
- **CrawlJob**: Background jobs for website crawling and data enrichment

### Communication & Campaigns
- **EmailAccount**: Connected email accounts for sending campaigns
- **Campaign**: Email marketing campaigns with sequences
- **CampaignEmail**: Individual emails sent as part of campaigns
- **CampaignStep**: Multi-step email sequences

### Billing & Monetization
- **BillingCustomer**: Stripe customer integration
- **Subscription**: Subscription management with trial support
- **AiCreditWallet**: AI usage credit tracking
- **AiCreditTransaction**: Credit transaction history

### Organization & Lists
- **List**: User-created lists for organizing leads
- **ListLead**: Leads added to user lists
- **LeadList**: Alternative list implementation
- **LeadListItem**: Items within lead lists
- **LeadExport**: Tracking of exported leads to prevent duplicates

### AI & Conversations
- **TedConversation**: AI assistant conversation history
- **TedMessage**: Individual messages in TED conversations
- **AIFeedback**: User feedback on AI-generated content

## New Data Tables Added

### User Management
- **UserPreferences**: User settings and preferences
- **UserSession**: Session management for authentication
- **AuditLog**: Comprehensive audit trail for all user actions

### API & Integrations
- **ApiKey**: API key management for external integrations
- **Integration**: Third-party service integrations (Zapier, Slack, etc.)
- **Notification**: In-app notification system

### File Management
- **FileUpload**: File upload tracking and metadata

## Row Level Security (RLS) Policies

All tables have comprehensive RLS policies implemented to ensure:
- Users can only access their own data
- Proper data isolation between users
- Secure multi-tenant architecture

### Key Security Features
- **User Isolation**: All user-specific data is properly scoped
- **Relationship Security**: Related data (campaigns, leads) respects ownership
- **Audit Trail**: All actions are logged for compliance
- **API Security**: API keys have granular permissions

## Data Services

### User Service (`src/user/userService.ts`)
```typescript
// User preferences
getUserPreferences(userId)
updateUserPreferences(userId, preferences)

// Notifications
createNotification(userId, type, title, message)
getUserNotifications(userId)
markNotificationRead(notificationId)

// Audit logs
createAuditLog(userId, action, resource, details)
getUserAuditLogs(userId)
```

### API Key Service (`src/auth/apiKeyService.ts`)
```typescript
// API key management
createApiKey(userId, { name, permissions })
getUserApiKeys(userId)
revokeApiKey(userId, keyId)
hasPermission(apiKey, permission)
```

### Integration Service (`src/integrations/integrationService.ts`)
```typescript
// Third-party integrations
createIntegration(userId, { type, name, config })
getUserIntegrations(userId)
updateIntegration(integrationId, userId, updates)
```

### File Service (`src/files/fileService.ts`)
```typescript
// File upload management
createFileUpload(userId, fileData)
getUserFileUploads(userId)
deleteFileUpload(fileId, userId)
```

## Usage Examples

### Setting User Preferences
```typescript
import { updateUserPreferences } from '../user/userService';

await updateUserPreferences(userId, {
  theme: 'dark',
  emailNotifications: true,
  timezone: 'America/New_York'
});
```

### Creating API Keys
```typescript
import { createApiKey } from '../auth/apiKeyService';

const apiKey = await createApiKey(userId, {
  name: 'Zapier Integration',
  permissions: ['leads:read', 'campaigns:write']
});
```

### Managing Integrations
```typescript
import { createIntegration } from '../integrations/integrationService';

await createIntegration(userId, {
  type: 'ZAPIER',
  name: 'Lead Processing',
  config: { webhookUrl: 'https://hooks.zapier.com/...' }
});
```

### File Uploads
```typescript
import { createFileUpload } from '../files/fileService';

await createFileUpload(userId, {
  filename: 'leads.csv',
  originalName: 'export.csv',
  mimeType: 'text/csv',
  size: 1024,
  url: 'https://storage.example.com/files/leads.csv'
});
```

## Database Migration

To apply all changes:
```bash
npx prisma migrate dev --name add_complete_data_saving_tables
npx prisma generate
```

## Supabase RLS Setup

Run the SQL in `supabase-policies.sql` in your Supabase SQL Editor to enable Row Level Security.

## Data Export & Backup

The platform supports:
- CSV export of leads with deduplication tracking
- Complete audit trails for compliance
- User data isolation for GDPR compliance
- API access for data integration

## Monitoring & Analytics

- Notification system for important events
- Audit logs for all user actions
- Credit usage tracking
- Campaign performance metrics

This implementation provides a complete, secure, and scalable data layer for the lead generation platform.