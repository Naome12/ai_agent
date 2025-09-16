#!/bin/sh

set -e
echo "⏳ Waiting for database at tms-db:3306..."
until nc -z tms-db 3306; do
  sleep 2
done

echo "Database is up, running migrations and seeding..."

# Run Prisma migrations
npx prisma migrate deploy

# Seed the database
# npx prisma db seed || echo "No seed script configured, skipping seeding."
npx tsx prisma/seed.ts

echo "Starting backend..."
exec node dist/src/server.js