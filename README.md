# XyraTech School ERP — Monorepo

> **Phase 1 Production Technical Foundation:** Enterprise Multi-School Management Ecosystem

[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-indigo.svg)](docs/architecture/system-architecture.md)
[![Isolation](https://img.shields.io/badge/Multi--Tenancy-Dedicated%20DB%20per%20School-emerald.svg)](docs/architecture/multi-school-isolation.md)
[![Security](https://img.shields.io/badge/Security-Argon2id%20%7C%20MFA%20%7C%20AES--256--GCM-red.svg)](docs/security/auth-and-security.md)

---

## 1. Ecosystem Applications & Services

| Application / Service | Role / Boundary | Port | Tech Stack |
| :--- | :--- | :---: | :--- |
| **Control Center** (`apps/control-center`) | Platform SaaS plane for Super Admins | `3000` | React, Vite, TS, MUI |
| **School ERP** (`apps/school-erp`) | School business plane for Principals & Staff | `3001` | React, Vite, TS, MUI |
| **Parent/Student Portal** (`apps/parent-student-portal`) | Connected student & parent portal shell | `3002` | React, Vite, TS, MUI |
| **Platform API** (`services/platform-api`) | Provisioning, subscriptions, platform audit | `4000` | Node.js, Express, TS, Prisma |
| **School Core API** (`services/school-api`) | School auth, RBAC, profile, staff accounts | `5000` | Node.js, Express, TS, Prisma |

---

## 2. Quick Start for Local Development

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x (`npm install -g pnpm`)
- PostgreSQL 15 & Redis 7 (or Docker Compose)

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/xyratech/XyraSchool-ERP.git
cd XyraSchool-ERP

# 2. Configure Environment
cp .env.example .env

# 3. Install Monorepo Dependencies
pnpm install

# 4. Generate Prisma Clients & Push Schema
pnpm db:generate
pnpm db:push

# 5. Seed Initial Platform Data & Demo School
pnpm db:seed

# 6. Launch All Services & Frontends in Parallel
pnpm dev
```

### Docker Compose Quick Start
```bash
docker compose up --build
```

---

## 3. Default Development Credentials

> **Notice:** These accounts are seeded for **local development and testing ONLY**.

- **Platform Super Admin:**
  - URL: `http://localhost:3000`
  - Email: `superadmin@xyratech.internal`
  - Password: `SuperAdmin@Xyra2026!`
- **Principal Activation Flow:**
  - Provision a school via the Control Center or use the demo invitation token.
  - Activation URL: `http://localhost:3001/activate?token=<TOKEN>`
  - The Principal sets their own password according to security rules.

---

## 4. Documentation Index

- [System Architecture Document](docs/architecture/system-architecture.md)
- [Database Schema & ER Models](docs/database/database-design.md)
- [Authentication & Security Suite](docs/security/auth-and-security.md)
- [Multi-School Tenant Isolation](docs/architecture/multi-school-isolation.md)
- [Phase Requirements Master Blueprint](XyraTech_Phase_Documents_V1.0/)

---

## 5. Automated Verification & Testing
```bash
# Run complete test suite (Unit, Security, Isolation, Integration)
pnpm test
```
