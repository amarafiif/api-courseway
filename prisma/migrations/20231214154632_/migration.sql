/*
  Warnings:

  - Made the column `status` on table `Riwayat_Transaksi` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Riwayat_Transaksi" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'waiting';
