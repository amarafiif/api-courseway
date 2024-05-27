/*
  Warnings:

  - Added the required column `title` to the `Promo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Promo" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Riwayat_Transaksi" ALTER COLUMN "status" SET DEFAULT 'Waiting for Payment';
