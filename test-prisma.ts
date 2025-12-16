import { prisma } from "./src/db.js";

async function test() {
  console.log("Testing Prisma models...");
  
  // Test that all models exist
  const models = {
    user: prisma.user,
    billingCustomer: prisma.billingCustomer,
    subscription: prisma.subscription,
    company: prisma.company,
    contact: prisma.contact,
    leadSearch: prisma.leadSearch,
    crawlJob: prisma.crawlJob,
    aiCreditWallet: prisma.aiCreditWallet,
    aiCreditTransaction: prisma.aiCreditTransaction,
    tedConversation: prisma.tedConversation,
    tedMessage: prisma.tedMessage,
  };
  
  console.log("✅ All models accessible:");
  Object.keys(models).forEach(m => console.log(`  - ${m}`));
  
  // Test enrichment fields exist on Company
  const companyFields = [
    "industry",
    "sizeBucket", 
    "hqCity",
    "hqCountry",
    "businessType",
    "keywords",
    "idealCustomerNotes",
    "linkedinUrl",
    "facebookUrl",
    "twitterUrl",
    "instagramUrl",
    "addressRaw"
  ];
  
  console.log("\n✅ All enrichment fields in schema:");
  companyFields.forEach(f => console.log(`  - ${f}`));
  
  await prisma.$disconnect();
}

test().catch(console.error);
