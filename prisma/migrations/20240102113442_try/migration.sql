-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "is_visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Riwayat_Transaksi" ALTER COLUMN "status" SET DEFAULT 'Belum Bayar';
