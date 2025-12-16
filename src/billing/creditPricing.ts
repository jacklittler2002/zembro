/**
 * Credit costs for various Zembro features
 * 
 * Future TODO: Make these dynamic per plan tier
 */

export const CREDIT_COSTS = {
  TED_MESSAGE: 1,
  DISCOVERY: 2,
  CRAWL: 2,
  ENRICH: 1,
  EXPORT_PER_CONTACT: 0.5,
};

/**
 * Monthly credit grants per subscription plan
 */
export const PLAN_MONTHLY_CREDITS = {
  FREE: 100,
  STARTER: 3000,
  GROWTH: 15000,
  SCALE: 50000,
};

/**
 * Credit pack options
 */
export const CREDIT_PACKS = {
  "5K": {
    credits: 5000,
    price: 49, // £49
    priceId: process.env.STRIPE_PRICE_5K_CREDITS,
  },
  "20K": {
    credits: 20000,
    price: 149, // £149
    priceId: process.env.STRIPE_PRICE_20K_CREDITS,
  },
  "50K": {
    credits: 50000,
    price: 299, // £299
    priceId: process.env.STRIPE_PRICE_50K_CREDITS,
  },
};

/**
 * Subscription plan price IDs
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    monthlyCredits: 100,
    price: 0,
    priceId: null,
  },
  STARTER: {
    name: "Starter",
    monthlyCredits: 3000,
    price: 49, // £49/mo
    priceId: process.env.STRIPE_PRICE_STARTER,
  },
  GROWTH: {
    name: "Growth",
    monthlyCredits: 15000,
    price: 149, // £149/mo
    priceId: process.env.STRIPE_PRICE_GROWTH,
  },
  SCALE: {
    name: "Scale",
    monthlyCredits: 50000,
    price: 399, // £399/mo
    priceId: process.env.STRIPE_PRICE_SCALE,
  },
};
