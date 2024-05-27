-- AlterTable
ALTER TABLE "Notifikasi" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Riwayat_Transaksi" ALTER COLUMN "metode_pembayaran" SET DEFAULT '-',
ALTER COLUMN "tanggal_pembayaran" DROP NOT NULL;
