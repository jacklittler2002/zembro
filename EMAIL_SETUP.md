# Email Campaign System - Environment Setup

## Required Environment Variables

Add these to your `.env` file:

```bash
# Email Encryption (REQUIRED)
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
EMAIL_ENCRYPTION_KEY=your_32_byte_hex_key_here

# Instantly.ai Integration (OPTIONAL - for purchasing email accounts)
# Get from Instantly.ai partner dashboard
INSTANTLY_API_KEY=your_instantly_api_key_here

# Base URL for webhooks
BASE_URL=https://zembro.co.uk
```

## Generating Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and set it as `EMAIL_ENCRYPTION_KEY` in your `.env` file.

## System Architecture

### Database Models
- **EmailAccount**: SMTP/IMAP credentials, health metrics, warmup settings
- **Campaign**: Multi-step sequences, scheduling, stats
- **CampaignStep**: Individual steps with A/B testing support
- **CampaignEmail**: Individual email sends with tracking
- **CampaignEmailAccount**: M2M for account rotation

### Backend Services
- **emailAccountService.ts**: BYOE account management, SMTP testing, send tracking
- **campaignService.ts**: Campaign CRUD, lead import, personalization
- **emailSendingService.ts**: Queue processing, SMTP sending, tracking (opens/replies/bounces)
- **instantlyService.ts**: Webhook handler, account provisioning

### HTTP Endpoints

**Email Accounts:**
- `POST /api/email-accounts` - Add BYOE account
- `POST /api/email-accounts/test` - Test SMTP connection
- `GET /api/email-accounts` - List accounts
- `DELETE /api/email-accounts/:id` - Delete account
- `POST /api/email-accounts/purchase` - Purchase Instantly accounts
- `POST /webhooks/instantly` - Receive provisioned accounts

**Campaigns:**
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/import-leads` - Import leads from search
- `POST /api/campaigns/:id/status` - Update status (start/pause)
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/stats` - Get campaign stats

### Background Workers
- **Email Queue Processor**: Runs every 5 minutes to send scheduled emails
- Checks send time windows
- Enforces daily limits
- Rotates email accounts
- Tracks sends, opens, replies, bounces

### Personalization Variables
Available in email templates:
- `{firstName}` - Contact first name
- `{lastName}` - Contact last name
- `{fullName}` - Full name (first + last)
- `{companyName}` or `{company}` - Company name
- `{website}` - Company website URL
- `{industry}` - Company industry
- `{city}` - Company city
- `{country}` - Company country

## Testing Checklist

### BYOE Connection
1. Navigate to Email Accounts page
2. Click "Connect Account"
3. Select Gmail (get App Password from myaccount.google.com/apppasswords)
4. Fill in credentials
5. Click "Test Connection" - should show success
6. Click "Add Account" - should appear in table with ACTIVE status

### Campaign Creation
1. Create a lead search with results
2. Navigate to Campaigns page
3. Click "New Campaign"
4. Fill in campaign details:
   - Name
   - Select email accounts
   - Add 2-3 steps with subject/body
   - Link to lead search
5. Import leads with filters
6. Change status to RUNNING

### Email Sending (Manual Test)
1. Check worker logs - should see "Processing email queue" every 5 minutes
2. Verify emails are queued in database
3. Check SMTP logs for successful sends
4. Monitor campaign stats

## Gmail SMTP Setup

For Gmail accounts:
1. Enable 2-factor authentication
2. Visit myaccount.google.com/apppasswords
3. Create new app password for "Mail"
4. Use Gmail address as username
5. Use 16-character app password (no spaces)

**SMTP Settings:**
- Host: smtp.gmail.com
- Port: 587
- Security: STARTTLS

## Outlook SMTP Setup

For Outlook/Office 365:
1. Enable SMTP in account settings
2. Use full Outlook email as username
3. Use account password (or app password if 2FA enabled)

**SMTP Settings:**
- Host: smtp-mail.outlook.com
- Port: 587
- Security: STARTTLS

## Daily Send Limits

**Recommended limits:**
- New accounts: 20-50 emails/day
- Warmed accounts (1 month): 100-200 emails/day
- Fully warmed (3+ months): 300-500 emails/day

**Auto-reset:**
- Daily counters reset at midnight UTC
- Tracked in `dailySentCount` field
- Enforced by `trackEmailSent()` function

## Instantly.ai Integration

**Setup:**
1. Sign up for Instantly.ai partner program
2. Get API key from dashboard
3. Set `INSTANTLY_API_KEY` in .env
4. Configure webhook URL: `https://your-domain.com/webhooks/instantly`

**Pricing:**
- $40 per 5 accounts (you get $8-12 commission)
- Includes warmup automation
- 99.9% uptime guarantee
- Accounts provisioned within 24 hours

**Webhook payload:**
```json
{
  "orderId": "order_123",
  "customerId": "user_id_here",
  "accounts": [
    {
      "email": "account@domain.com",
      "smtpHost": "smtp.example.com",
      "smtpPort": 587,
      "smtpUsername": "username",
      "smtpPassword": "password",
      "imapHost": "imap.example.com",
      "imapPort": 993,
      "imapUsername": "username",
      "imapPassword": "password",
      "instantlyAccountId": "inst_123",
      "warmupStatus": "active"
    }
  ]
}
```

## Security Notes

- All SMTP/IMAP passwords encrypted with AES-256-CBC
- Unique IV for each encryption
- Encryption key never stored in database
- Credentials decrypted only when sending emails
- Test connections before saving credentials

## Monitoring

**Key metrics to track:**
- Bounce rate < 5%
- Reply rate > 2%
- Open rate > 20%
- Daily send count vs limit
- Account health status

**Alerts to configure:**
- High bounce rate (>10%) = pause account
- Failed logins = update credentials
- Daily limit reached = notify user
- Campaign completed = send summary

## Next Steps

1. Generate encryption key and add to .env
2. Test BYOE connection with Gmail/Outlook
3. Create test campaign with 1-2 steps
4. Monitor worker logs for queue processing
5. Set up Instantly.ai integration (optional)
6. Configure monitoring alerts
7. Build campaign builder UI (step 2 form)
8. Add reply detection via IMAP
9. Build unified inbox for replies
10. Add warmup automation
