"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLeadKey = generateLeadKey;
exports.hasLeadBeenDelivered = hasLeadBeenDelivered;
const normalizeDomain_1 = require("../utils/normalizeDomain");
/**
 * Generate a deterministic lead key for deduplication and charging.
 * Priority order: website/domain > google_maps_place_id > normalized companyName + city + country
 */
function generateLeadKey(contact) {
    const { company } = contact;
    // Priority 1: Normalized domain from website
    if (company?.domain) {
        return `domain:${(0, normalizeDomain_1.normalizeDomain)(company.domain)}`;
    }
    if (company?.websiteUrl) {
        const domain = (0, normalizeDomain_1.normalizeDomain)(company.websiteUrl);
        if (domain) {
            return `domain:${domain}`;
        }
    }
    // Priority 2: Google Maps Place ID (if available)
    if (company?.googleMapsPlaceId) {
        return `place:${company.googleMapsPlaceId}`;
    }
    // Priority 3: Normalized company name + location
    if (company?.name) {
        const normalizedName = company.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '_'); // Replace spaces with underscores
        const city = company.city?.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_') || '';
        const country = company.country?.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_') || '';
        const locationKey = city && country ? `${city}_${country}` :
            city ? city :
                country ? country : '';
        return `company:${normalizedName}${locationKey ? `_${locationKey}` : ''}`;
    }
    // Fallback: Just use email domain
    const emailDomain = contact.email.split('@')[1]?.toLowerCase();
    return `email:${emailDomain || 'unknown'}`;
}
/**
 * Check if a lead key has already been delivered to a user
 */
async function hasLeadBeenDelivered(userId, leadKey) {
    const { prisma } = await Promise.resolve().then(() => __importStar(require("../db")));
    const existingTransaction = await prisma.creditTransaction.findFirst({
        where: {
            userId,
            leadKey,
            creditsDelta: -1, // Only count actual charges, not refunds
        },
    });
    return !!existingTransaction;
}
//# sourceMappingURL=leadKeyUtils.js.map