#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  XyraTech School ERP — Development Environment Setup"
echo "=========================================================="

if [ ! -f .env ]; then
  echo "--> Copying .env.example to .env..."
  cp .env.example .env
fi

echo "--> Installing monorepo dependencies..."
pnpm install

echo "--> Generating Prisma Clients (Platform + School)..."
pnpm db:generate

echo "--> Pushing Prisma Schemas to PostgreSQL..."
pnpm db:push

echo "--> Seeding Development Platform & Default School DB..."
pnpm db:seed

echo "=========================================================="
echo "✅ Setup Complete!"
echo "Run 'pnpm dev' to launch all services and applications."
echo "Platform API:     http://localhost:4000"
echo "School API:       http://localhost:5000"
echo "Control Center:   http://localhost:3000"
echo "School ERP:       http://localhost:3001"
echo "Parent Portal:    http://localhost:3002"
echo "=========================================================="
