# Comprehensive Data Protection Policy System

This document outlines the complete policy system implemented for data protection and access control in the Zembro platform.

## Overview

The policy system provides **multi-layered data protection**:

1. **Database Layer**: Row Level Security (RLS) policies in PostgreSQL
2. **Application Layer**: Business logic policies in TypeScript
3. **API Layer**: Middleware-based access control
4. **Integration Layer**: Service-level policy enforcement

## Architecture

```
┌─────────────────┐
│   API Routes    │ ← Middleware checks
└─────────────────┘
         │
┌─────────────────┐
│ Service Layer   │ ← Policy enforcement
└─────────────────┘
         │
┌─────────────────┐
│ Business Logic  │ ← Rule validation
└─────────────────┘
         │
┌─────────────────┐
│  Database RLS   │ ← Row-level security
└─────────────────┘
```

## Core Components

### 1. Policy Classes

#### Base Policy (`BasePolicy`)
All policies extend this abstract class:

```typescript
abstract class BasePolicy {
  abstract name: string;
  abstract check(context: PolicyContext): Promise<PolicyResult>;
  filterData?(context: PolicyContext, data: any): Promise<any>;
  validateData?(context: PolicyContext, data: any): Promise<ValidationResult>;
}
```

#### Policy Context
```typescript
interface PolicyContext {
  userId: string;
  user?: User;
  prisma: PrismaClient;
  resource?: any;
  action: string;
}
```

### 2. Policy Registry

Central registry for all policies:

```typescript
import { PolicyRegistry } from './policies/policyRegistry';

// Initialize at app startup
PolicyRegistry.initialize(prisma);

// Quick checks
const allowed = await PolicyRegistry.check('leadSearch', userId, 'create');
const validation = await PolicyRegistry.validate('campaign', userId, 'create', data);
```

### 3. Policy Guard

Convenient guard functions:

```typescript
import { PolicyGuard } from './policies/policyRegistry';

// Check permissions
const canCreate = await PolicyGuard.canCreate(userId, 'leadSearch', data);
const canRead = await PolicyGuard.canRead(userId, 'campaign', campaignData);

// Enforce or throw
await PolicyGuard.enforce(userId, 'update', 'company', companyData);
await PolicyGuard.enforceValidation(userId, 'apiKey', 'create', keyData);
```

## Available Policies

### User Policies
- **user**: User account access control
- **userPreferences**: User settings management

### Lead Generation Policies
- **leadSearch**: Lead search creation and access
- **lead**: Individual lead/contact access
- **company**: Company data access
- **list**: Lead list management

### Communication Policies
- **campaign**: Email campaign management
- **emailAccount**: Email account access

### Monetization Policies
- **credit**: Credit balance and spending
- **billing**: Billing and subscription access

### API & Integration Policies
- **apiKey**: API key management
- **integration**: Third-party integrations

### System Policies
- **notification**: User notifications
- **auditLog**: Audit trail access
- **fileUpload**: File upload restrictions

## Usage Examples

### 1. Service Integration

```typescript
import { PolicyAwareService } from '../policies/policyIntegration';

class LeadSearchService extends PolicyAwareService {
  async create(userId: string, data: any) {
    // Check permissions
    await this.enforce(userId, 'create', 'leadSearch');

    // Validate data
    await this.validate(userId, 'leadSearch', 'create', data);

    // Check credits
    await this.checkCredits(userId, 25, 'lead_search');

    // Check plan limits
    await this.checkPlanLimits(userId, 'lead_search');

    // Create the lead search
    return await prisma.leadSearch.create({
      data: { userId, ...data }
    });
  }

  async get(userId: string, searchId: string) {
    // Check access
    await this.enforce(userId, 'read', 'leadSearch', { id: searchId });

    // Get and filter data
    const search = await prisma.leadSearch.findUnique({
      where: { id: searchId }
    });

    return await this.filter(userId, 'leadSearch', 'read', search);
  }
}
```

### 2. Route Middleware

```typescript
import { PolicyMiddleware } from '../policies/policyMiddleware';

app.post('/api/lead-searches',
  PolicyMiddleware.attachEnforcer,        // Attach policy system
  PolicyMiddleware.check('leadSearch', 'create'), // Check permissions
  PolicyMiddleware.validate('leadSearch'),        // Validate data
  PolicyMiddleware.businessRules('lead_search'),  // Check plan limits
  PolicyMiddleware.checkCredits(25, 'lead_search'), // Check credits
  async (req, res) => {
    // Handle request
    const result = await leadSearchService.create(req.userId, req.body);
    res.json(result);
  }
);

app.get('/api/leads',
  PolicyMiddleware.attachEnforcer,
  PolicyMiddleware.check('lead', 'read'),
  PolicyMiddleware.filter('lead'), // Filter response data
  async (req, res) => {
    const leads = await leadService.getUserLeads(req.userId);
    res.json(leads); // Data automatically filtered
  }
);
```

### 3. Direct Policy Checks

```typescript
import { PolicyGuard, BusinessRules } from '../policies/policyRegistry';

// Quick permission check
if (await PolicyGuard.canCreate(userId, 'campaign')) {
  // Create campaign
}

// Business rule validation
const validation = await BusinessRules.validateLeadSearch(userId, searchData);
if (!validation.valid) {
  throw new Error(validation.errors.join(', '));
}

// Credit balance check
const creditCheck = await BusinessRules.checkCreditBalance(userId, 50, 'export');
if (!creditCheck.sufficient) {
  throw new Error(`Need ${50 - creditCheck.currentBalance} more credits`);
}
```

## Business Rules

### Credit System
```typescript
// Check if user has enough credits
const creditCheck = await BusinessRules.checkCreditBalance(userId, 25, 'lead_search');

// Costs by operation:
LEAD_SEARCH_START: 25 credits
CAMPAIGN_CREATE: 10 credits
EXPORT_LEADS: 5 credits per 100 leads
```

### Plan Limits
```typescript
// Check plan limits
const limitCheck = await BusinessRules.checkPlanLimits(userId, 'lead_search');

// Limits by plan:
FREE: 3 active searches, 100 leads/search
PRO: 10 active searches, 500 leads/search
ENTERPRISE: 50 active searches, 2000 leads/search
```

### File Upload Rules
```typescript
// Validate file upload
const fileCheck = await BusinessRules.checkFileUpload(userId, {
  size: file.size,
  type: file.mimetype,
  name: file.originalname
});

// Restrictions:
Max size: 10MB
Allowed types: JPEG, PNG, GIF, WebP, PDF, CSV, JSON
```

## Security Features

### Rate Limiting
```typescript
const rateLimit = await SecurityPolicies.checkRateLimit(userId, 'api_call', 60, 100);
// 100 requests per hour max
```

### Input Sanitization
```typescript
const cleanData = SecurityPolicies.sanitizeInput(userInput);
// Removes dangerous characters: < > ' " &
```

### Suspicious Activity Detection
```typescript
const suspicious = await SecurityPolicies.checkSuspiciousActivity(userId, 'login', data);
// Checks for unusual patterns
```

## Error Handling

### Policy Errors
```typescript
try {
  await PolicyGuard.enforce(userId, 'create', 'campaign');
} catch (error) {
  if (error.message.includes('Access denied')) {
    // Handle permission denied
  } else if (error.message.includes('Insufficient credits')) {
    // Handle credit issues
  } else if (error.message.includes('Plan limit')) {
    // Handle plan limits
  }
}
```

### Middleware Error Handling
```typescript
import { policyErrorHandler } from '../policies/policyIntegration';

app.use(policyErrorHandler); // Handles policy violations automatically
```

## Integration Checklist

### App Startup
- [ ] Call `PolicyRegistry.initialize(prisma)` in app startup
- [ ] Add `PolicyMiddleware.attachEnforcer` to request pipeline

### Services
- [ ] Extend `PolicyAwareService` for new services
- [ ] Add policy checks to all operations
- [ ] Include data validation
- [ ] Add credit and limit checks

### Routes
- [ ] Add policy middleware to all routes
- [ ] Include validation middleware
- [ ] Add business rule checks
- [ ] Include credit checks where needed

### Testing
- [ ] Test policy enforcement
- [ ] Test data validation
- [ ] Test business rules
- [ ] Test error handling

## Policy Testing

### Unit Tests
```typescript
describe('LeadSearch Policy', () => {
  it('should allow creation with sufficient credits', async () => {
    const result = await PolicyRegistry.check('leadSearch', userId, 'create');
    expect(result.allowed).toBe(true);
  });

  it('should validate search data', async () => {
    const validation = await PolicyRegistry.validate('leadSearch', userId, 'create', {
      query: 'test query',
      maxLeads: 50
    });
    expect(validation.valid).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Lead Search Creation', () => {
  it('should create search with proper policies', async () => {
    // Test full flow with policies
    const result = await request(app)
      .post('/api/lead-searches')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'test', maxLeads: 100 })
      .expect(200);
  });
});
```

## Monitoring & Auditing

### Audit Logging
All policy decisions are automatically logged:

```typescript
// Automatic logging on policy checks
await PolicyGuard.enforce(userId, 'create', 'campaign');
// → Audit log: "User X attempted to create campaign Y"
```

### Metrics
Track policy usage:

```typescript
// Policy check metrics
policy_checks_total{policy="leadSearch", action="create", result="allowed"} 150
policy_checks_total{policy="credit", action="spend", result="denied"} 5
```

## Best Practices

### 1. Defense in Depth
- **Database**: RLS policies prevent unauthorized access
- **Application**: Business logic policies enforce rules
- **API**: Middleware validates requests
- **Client**: UI prevents invalid actions

### 2. Fail-Safe Defaults
- Default to denying access
- Explicitly allow permitted actions
- Validate all input data
- Sanitize user inputs

### 3. Performance Considerations
- Cache policy results where appropriate
- Use database indexes for policy checks
- Batch policy validations
- Monitor policy check performance

### 4. Maintenance
- Keep policies DRY (Don't Repeat Yourself)
- Use inheritance for similar policies
- Document policy decisions
- Regular policy audits

This comprehensive policy system ensures that all data in the Zembro platform is properly protected, validated, and controlled according to business rules and user permissions.