/*
  Warnings:

  - The values [REFUNDED] on the enum `BillStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PURCHASE,TRANSFER_IN,TRANSFER_OUT] on the enum `MovementType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `promotionId` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `voidReason` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `voidedAt` on the `bills` table. All the data in the column will be lost.
  - You are about to drop the column `barcode` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `maxStock` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `taxable` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `pointsEarned` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `promotionId` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `activity_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loyalty_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promotions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchase_order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchase_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_shifts` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BillStatus_new" AS ENUM ('COMPLETED', 'VOIDED');
ALTER TABLE "public"."bills" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bills" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "public"."BillStatus_old";
ALTER TABLE "bills" ALTER COLUMN "status" SET DEFAULT 'COMPLETED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MovementType_new" AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGED');
ALTER TABLE "stock_movements" ALTER COLUMN "movementType" TYPE "MovementType_new" USING ("movementType"::text::"MovementType_new");
ALTER TYPE "MovementType" RENAME TO "MovementType_old";
ALTER TYPE "MovementType_new" RENAME TO "MovementType";
DROP TYPE "public"."MovementType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "bills" DROP CONSTRAINT "bills_customerId_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_customerId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_purchaseOrderId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_userId_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_customerId_fkey";

-- DropIndex
DROP INDEX "products_barcode_key";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "bills" DROP COLUMN "promotionId",
DROP COLUMN "voidReason",
DROP COLUMN "voidedAt";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "barcode",
DROP COLUMN "maxStock",
DROP COLUMN "sku",
DROP COLUMN "supplierId",
DROP COLUMN "taxable";

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "pointsEarned",
DROP COLUMN "promotionId";

-- AlterTable - Rename email to username (preserving data)
ALTER TABLE "users" RENAME COLUMN "email" TO "username";

-- DropTable
DROP TABLE "activity_logs";

-- DropTable
DROP TABLE "customers";

-- DropTable
DROP TABLE "loyalty_transactions";

-- DropTable
DROP TABLE "promotions";

-- DropTable
DROP TABLE "purchase_order_items";

-- DropTable
DROP TABLE "purchase_orders";

-- DropTable
DROP TABLE "suppliers";

-- DropTable
DROP TABLE "work_shifts";

-- DropEnum
DROP TYPE "DiscountType";

-- DropEnum
DROP TYPE "LoyaltyTransactionType";

-- DropEnum
DROP TYPE "MemberType";

-- DropEnum
DROP TYPE "PromotionType";

-- DropEnum
DROP TYPE "PurchaseOrderStatus";

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
