# 🚀 TED Quick Start Guide

## Prerequisites
Ensure you have the following in your `.env` file:

```bash
# Required for TED
OPENAI_API_KEY=sk-proj-...  # Your OpenAI API key
OPENAI_TED_MODEL=gpt-4o-mini  # Cost-effective model for tool calling
APP_URL=http://localhost:3000  # For Stripe redirects

# Already configured (Stripe billing)
STRIPE_SECRET_KEY=...
STRIPE_PRICE_STARTER=...
STRIPE_PRICE_GROWTH=...
STRIPE_PRICE_5K_CREDITS=...
STRIPE_PRICE_20K_CREDITS=...
```

## Start the Application

### 1. Start Backend + Worker
```bash
cd /Users/macbookpro/zembro
npm start  # Backend on :4000
```

In a separate terminal:
```bash
cd /Users/macbookpro/zembro
npm run worker  # Background job processor
```

### 2. Start Frontend
```bash
cd /Users/macbookpro/zembro/web
npm run dev  # Next.js on :3000
```

## Access TED
1. Navigate to: http://localhost:3000
2. Sign in with your account
3. Go to: http://localhost:3000/app/ted
4. Start chatting! 💬

## Test Examples

### Example 1: Check Credits
```
You: Check my credits
TED: You currently have [X] credits.
```

### Example 2: Start a Lead Search
```
You: Find me 50 dentists in London
TED: I've started a lead search for 50 dentists in London. 
     The search ID is [abc123]. Crawling and enrichment are 
     running in the background.
```

### Example 3: Preview with Filters
```
You: Show me the leads from abc123, decision makers only, min score 70
TED: Found 12 decision-makers with score 70+...
```

### Example 4: Export to CSV
```
You: Export those leads to CSV
TED: Exported 12 contacts. Download ready!
```
→ Click the "📥 Download CSV" button that appears

### Example 5: Handle Insufficient Credits
```
You: Export 500 leads
TED: This export would cost 250 credits, but you only have 50.
     Would you like to upgrade or buy credits?
```
→ Click the "🚀 Upgrade or Top-up Credits" button

## Troubleshooting

### "TED is not responding"
- Check backend is running on :4000
- Check browser console for errors
- Verify `OPENAI_API_KEY` is set correctly
- Check backend logs: `tail -f logs/app.log` (if you have logging set up)

### "Insufficient credits" on first use
Grant yourself some test credits:
```bash
cd /Users/macbookpro/zembro
npm run seed:tedcredits
```

### CSV download not working
- Check browser console
- Verify the response contains `csv` field
- Try a smaller export first (< 25 leads)

### Stripe checkout links not working
- Verify `STRIPE_PRICE_*` env vars are set
- Check Stripe Dashboard for price IDs
- Ensure `APP_URL` is correct

## Credit Costs Reference
- TED message: **1 credit**
- Start lead search (DISCOVERY): **2 credits**
- Export per contact: **0.5 credits**

## What TED Can Do
✅ Check credit balance  
✅ Estimate costs  
✅ Start lead searches  
✅ Check search status  
✅ Preview leads with filters  
✅ Export leads to CSV  
✅ Generate subscription upgrade links  
✅ Generate credit top-up links  

## Important Notes
1. **Conversation persists** - TED remembers your chat history within a session
2. **CSV downloads** happen client-side (no server storage)
3. **Stripe links** open in new tabs
4. **Background jobs** - Lead searches continue processing even after TED responds
5. **Credit deduction** happens immediately (1 per message + tool costs)

---

**Have fun testing TED! 🎉**

If you encounter any issues, check the implementation guide in `TED_IMPLEMENTATION_COMPLETE.md`.
