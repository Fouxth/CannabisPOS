-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "tenants" ADD COLUMN "expiresAt" TIMESTAMP(3);
