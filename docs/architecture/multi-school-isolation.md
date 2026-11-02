# XyraTech School ERP — Multi-School Isolation Architecture

## 1. Isolation Strategy
XyraTech adheres strictly to the rule:
$$\text{One School} = \text{One Isolated Deployment} + \text{One Database} + \text{One Storage Boundary} + \text{Dedicated Secrets}$$

## 2. Dynamic Tenant Resolution & Connection Manager
- **Tenant Context Verification:**
  The School API rejects arbitrary client-supplied IDs. Unauthenticated requests resolve tenant identity through trusted server configuration or the `x-school-code` header. Authenticated requests extract the cryptographically signed `schoolId` and `schoolCode` directly from the validated JWT token.
- **Tenant Connection Manager:**
  The `tenantConnectionManager` dynamically resolves the isolated database connection string from the platform deployment registry, decrypts the credentials via AES-256-GCM, and pools dedicated PrismaClient instances per tenant.
- **Cross-Tenant Attack Mitigation:**
  Cross-school database access is impossible because queries are routed to distinct PostgreSQL databases rather than filtered by shared column clauses.
