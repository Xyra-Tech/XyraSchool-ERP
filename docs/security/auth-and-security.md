# XyraTech School ERP — Authentication & Security Architecture

## 1. Core Principles & Governance
1. **Principal Credential Ownership:**
   XyraTech provisions the school deployment and issues a cryptographically secure, time-limited invitation token. XyraTech operators **never** set, know, or reset the Principal's password. The Principal sets their own password at `/activate`.
2. **Authoritative Backend Authorization:**
   Frontend hiding is never treated as a security boundary. Every protected backend route strictly verifies the requester's authenticated token, active status, and explicit permission code.
3. **Defense in Depth:**
   - Password Hashing: Argon2id with 19 MiB memory cost, 2 iterations, 1 parallelism.
   - Field Encryption: AES-256-GCM authenticated encryption for connection strings and MFA secrets.
   - Multi-Factor Authentication: RFC 6238 TOTP with +/- 1 time-step drift tolerance.
   - Brute-Force Defense: Rate-limiting per IP and progressive 15-minute account lockout after 5 failed login attempts.
   - Immutable Auditing: Every login, failed attempt, privilege delegation, and provisioning action writes an append-only audit record.
