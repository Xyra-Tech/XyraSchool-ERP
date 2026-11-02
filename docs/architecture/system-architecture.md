# XyraTech School ERP — System Architecture Document

## 1. Executive Overview
XyraTech School ERP is an enterprise multi-school school management ecosystem. It provides distinct operational planes for SaaS platform administration, school administration and academic management, and parent/student engagement.

## 2. Core Architectural Planes

### A. Platform Control Plane (XyraTech Control Center)
- **Actors:** Super Admin, Support Agents, Release Managers, Billing Admins.
- **Scope:** School onboarding, automated tenant provisioning, subscription entitlement, system health monitoring, and platform-level audit logging.
- **Boundaries:** Does not directly query school operational data. All diagnostic access requires audited, time-limited tokens.

### B. School Business Plane (School ERP & Parent/Student Portal)
- **Actors:** Principal, School Admins, Teachers, Operational Staff, Parents, Students.
- **Scope:** Academic hierarchies, user lifecycle, attendance, timetables, examinations, fee transactions, and communication.
- **Boundaries:** Every school runs against its own dedicated database and private storage bucket. Cross-school access is strictly forbidden at both application and network layers.

## 3. Technology Stack Reference
- **Web Frontend:** React 18, Vite, TypeScript, Material UI (MUI), React Router, Axios.
- **Backend API:** Node.js, Express, TypeScript (modular monolith architecture; `/api/v1`).
- **Data Layer:** PostgreSQL 15, Prisma ORM (distinct schemas for Platform and School databases).
- **Cache & Async Work:** Redis 7, BullMQ.
- **Cryptography & Security:** Argon2id password hashing, AES-256-GCM field encryption, RFC 6238 TOTP, SHA-256 recovery tokens.
- **Testing:** Vitest, Supertest, Playwright.
