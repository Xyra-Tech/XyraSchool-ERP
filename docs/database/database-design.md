# XyraTech School ERP — Database Architecture & ER Design

## 1. Multi-Tenant Database Isolation Model
To ensure complete compliance, privacy, and prevent cross-tenant data leaks, XyraTech utilizes a **Dedicated Database per School** strategy:

- **Platform Database (`xyratech_platform`):** Stores SaaS accounts, subscription plans, feature entitlements, school directory, deployment configurations, and platform audit trails.
- **School Databases (`xyratech_school_<tenant_code>`):** Stores school profiles, staff accounts, roles, permissions, user sessions, invitations, recovery codes, and school audit logs.

## 2. Platform Database Schema

| Entity | Purpose |
| :--- | :--- |
| `PlatformUser` | Internal SaaS administrators (Super Admins, Support Agents). |
| `PlatformRole` | System roles within the Control Center. |
| `PlatformPermission` | Fine-grained platform operation privileges. |
| `School` | Registered school entity record with status and metadata. |
| `SchoolDeployment` | Isolated deployment details (encrypted DB URL, storage bucket, version). |
| `SubscriptionPlan` | Tier definition (Starter, Standard, Enterprise). |
| `FeatureEntitlement` | Module availability flags per subscription plan. |
| `SchoolSubscription` | Active school subscription contract and renewal dates. |
| `PlatformAuditLog` | Immutable append-only audit trail of platform actions. |

## 3. School Tenant Database Schema

| Entity | Purpose |
| :--- | :--- |
| `SchoolProfile` | Institutional metadata, CBSE/ICSE board affiliation, motto, colors. |
| `User` | School users (Principal, Admins, Teachers, Staff). |
| `Role` | School roles (PRINCIPAL, SCHOOL_ADMIN, TEACHER, STAFF). |
| `Permission` | School operational permissions (`school.profile.update`, `users.create`, etc.). |
| `UserRole` & `RolePermission` | Normalized mapping tables. |
| `UserSession` | Server-side active login sessions with revocation support. |
| `UserInvitation` | Token-based invitations allowing staff/principal self-activation. |
| `MFAConfiguration` | Encrypted base32 TOTP secret and verification state. |
| `RecoveryCode` | SHA-256 hashed one-time backup recovery codes. |
| `AuditLog` | Immutable school-level event log. |
| `SystemConfiguration` | Dynamic school setting flags. |
