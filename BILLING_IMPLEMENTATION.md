# Zembro Billing System Implementation

## Overview
Complete billing and credit system implementation for Zembro, following the Apollo.io + Instantly credit model.

## ✅ Completed Features

### 1. Database Schema
- **BillingCustomer** model: Links users to Stripe customers
- **Subscription** model: Tracks subscription plans and status
- Migration applied: `20251210171707_add_billing_models`

### 2. Credit System
- **CreditError** class: Custom error for insufficient credits
- **addCredits()**: Add credits with transaction logging
- **consumeCredits()**: Deduct credits with error handling
- Credit costs defined in `src/billing/creditPricing.ts`

### 3. Stripe Integration
- Stripe SDK configured in `src/billing/stripe.ts`
- Customer creation on user signup (authMiddleware)
- Checkout sessions for subscriptions and credit packs
- Webhook handler for:
  - `checkout.session.completed`
  - `invoice.payment_succeeded` (monthly credit grants)
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 4. Backend API Routes
- `GET /api/billing` - Get billing info
- `POST /api/billing/checkout/subscription` - Create subscription checkout
- `POST /api/billing/checkout/credits` - Create credit pack checkout
- `POST /webhooks/stripe` - Stripe webhook endpoint
- Credit error handling in TED endpoint (402 status code)

### 5. Frontend UI
- `/app/billing` - Full billing dashboard
  - Current plan and credit balance display
  - 4 subscription plan cards (FREE, STARTER, GROWTH, SCALE)
  - 3 credit pack options (5K, 20K, 50K)
  - Upgrade/purchase buttons
- `/app/billing/success` - Payment success page
- `/app/billing/cancel` - Payment canceled page
- Real-time credit balance in app layout (refreshes every 30s)
- Low credit warnings component
- Upgrade prompts in TED and Lead Searches

## Required Environment Variables

Add to your `.env` file:

```bash
# Stripe configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_STARTER=price_your_starter_price_id
STRIPE_PRICE_GROWTH=price_your_growth_price_id
STRIPE_PRICE_SCALE=price_your_scale_price_id
STRIPE_PRICE_5K_CREDITS=price_your_5k_pack_id
STRIPE_PRICE_20K_CREDITS=price_your_20k_pack_id
STRIPE_PRICE_50K_CREDITS=price_your_50k_pack_id

# App URL for Stripe redirects
APP_URL=http://localhost:3000
```

## Setup Instructions

### 1. Database Migration
```bash
cd /Users/macbookpro/zembro
npx prisma migrate dev
npx prisma generate
```

### 2. Stripe Configuration

#### Create Products & Prices in Stripe Dashboard:

**Subscriptions (recurring):**
- **Starter**: £49/month, 3,000 credits
- **Growth**: £149/month, 15,000 credits
- **Scale**: £399/month, 50,000 credits

**Credit Packs (one-time):**
- **5K Pack**: £49, 5,000 credits
- **20K Pack**: £149, 20,000 credits
- **50K Pack**: £299, 50,000 credits

#### Set up Webhook:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Testing

#### Test Subscription Flow:
1. Navigate to `/app/billing`
2. Click "Upgrade" on a plan
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify credits are added
5. Check subscription appears in billing page

#### Test Credit Pack:
1. Navigate to `/app/billing`
2. Click "Buy Now" on a credit pack
3. Complete checkout
4. Verify credits are added immediately

#### Test TED Credit Consumption:
1. Navigate to `/app/ted`
2. Send a message (costs 1 credit)
3. Verify balance decreases
4. Test insufficient credits error

#### Test Low Credit Warnings:
1. Reduce your credit balance to < 100
2. Visit `/app/ted` or `/app/lead-searches`
3. Verify warning appears with upgrade CTA

## Credit Costs

Defined in `src/billing/creditPricing.ts`:

```typescript
TED_MESSAGE: 1
DISCOVERY: 2
CRAWL: 2
ENRICH: 1
EXPORT_PER_CONTACT: 0.5
```

## Monthly Credit Grants

When subscription invoice is paid:
- **FREE**: 100 credits
- **STARTER**: 3,000 credits
- **GROWTH**: 15,000 credits
- **SCALE**: 50,000 credits

## Files Created/Modified

### Backend Files:
- `prisma/schema.prisma` - Added billing models
- `src/billing/stripe.ts` - Stripe client
- `src/billing/creditPricing.ts` - Credit costs and plans
- `src/billing/billingService.ts` - Billing customer management
- `src/billing/billingRoutes.ts` - API routes
- `src/billing/webhookRoutes.ts` - Webhook handler
- `src/ted/creditService.ts` - Added CreditError class
- `src/ted/tedService.ts` - Updated credit error handling
- `src/httpServer.ts` - Registered billing routes
- `src/auth/authMiddleware.ts` - Auto-create billing customers

### Frontend Files:
- `web/src/app/app/billing/page.tsx` - Billing dashboard
- `web/src/app/app/billing/success/page.tsx` - Success page
- `web/src/app/app/billing/cancel/page.tsx` - Cancel page
- `web/src/app/app/layout.tsx` - Real-time credit display
- `web/src/app/app/ted/page.tsx` - Credit warnings
- `web/src/app/app/lead-searches/page.tsx` - Credit warnings
- `web/src/components/LowCreditWarning.tsx` - Warning component

## Architecture Notes

### Credit Error Flow:
1. User attempts action requiring credits
2. `consumeCredits()` throws `CreditError` if insufficient
3. API returns 402 status with upgrade suggestion
4. Frontend displays error + upgrade CTA

### Webhook Flow:
1. Stripe sends webhook to `/webhooks/stripe`
2. Signature verification
3. Event handling:
   - Subscription renewal → Add monthly credits
   - Checkout completed → Add credit pack
   - Subscription updated → Update DB
4. Return 200 to acknowledge

### Credit Balance Display:
- Fetched on app layout mount
- Refreshes every 30 seconds
- Clickable to go to billing page
- Shows in sidebar and top bar

## Next Steps (Optional Enhancements)

1. **Usage Analytics**: Track credit consumption by feature
2. **Credit Expiry**: Implement expiration for one-time packs
3. **Volume Discounts**: Dynamic pricing based on usage
4. **Team Plans**: Multi-user subscriptions with shared credits
5. **Billing Portal**: Link to Stripe Customer Portal for managing subscriptions
6. **Email Notifications**: Low credit alerts, payment confirmations
7. **Credit Refunds**: Admin tools for manual credit adjustments

## Troubleshooting

### TypeScript Errors
If you see Prisma type errors, restart the TypeScript server:
- VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
- Or run: `npx prisma generate`

### Webhook Not Receiving Events
1. Check webhook URL is correct and publicly accessible
2. Verify webhook secret matches `.env`
3. Test with Stripe CLI: `stripe listen --forward-to localhost:4000/webhooks/stripe`

### Credits Not Adding After Purchase
1. Check webhook logs in Stripe Dashboard
2. Verify price IDs match in `.env`
3. Check metadata is set correctly in checkout session
4. Review backend logs for errors

## Support

For issues, check:
1. Backend logs: `npm run dev` output
2. Frontend console: Browser DevTools
3. Stripe webhook logs: Stripe Dashboard → Webhooks
4. Database: `npx prisma studio`
