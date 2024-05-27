-- CreateTable
CREATE TABLE "Account" (
    "account_id" SERIAL NOT NULL,
    "nama" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "no_telp" TEXT,
    "negara" TEXT,
    "kota" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "url_image" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "otp_id" SERIAL NOT NULL,
    "otp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "account_id" INTEGER NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("otp_id")
);

-- CreateTable
CREATE TABLE "Mentor" (
    "mentor_id" SERIAL NOT NULL,
    "name" TEXT,
    "job" TEXT,

    CONSTRAINT "Mentor_pkey" PRIMARY KEY ("mentor_id")
);

-- CreateTable
CREATE TABLE "Kategori" (
    "kategori_id" SERIAL NOT NULL,
    "title" TEXT,
    "deskripsi" TEXT,
    "url_img_preview" TEXT,

    CONSTRAINT "Kategori_pkey" PRIMARY KEY ("kategori_id")
);

-- CreateTable
CREATE TABLE "Course" (
    "course_id" SERIAL NOT NULL,
    "title" TEXT,
    "deskripsi" TEXT,
    "kode_kelas" TEXT,
    "kategori_id" INTEGER NOT NULL,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "mentor_id" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "harga" DOUBLE PRECISION NOT NULL,
    "url_image_preview" TEXT,
    "url_gc_tele" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "chapter_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "course_id" INTEGER NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("chapter_id")
);

-- CreateTable
CREATE TABLE "Video" (
    "video_id" SERIAL NOT NULL,
    "chapter_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "deskripsi" TEXT,
    "url_video" TEXT NOT NULL,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("video_id")
);

-- CreateTable
CREATE TABLE "User_course" (
    "user_course_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,

    CONSTRAINT "User_course_pkey" PRIMARY KEY ("user_course_id")
);

-- CreateTable
CREATE TABLE "Mentor_course" (
    "mentor_course_id" SERIAL NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,

    CONSTRAINT "Mentor_course_pkey" PRIMARY KEY ("mentor_course_id")
);

-- CreateTable
CREATE TABLE "Course_progress" (
    "course_progres_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "video_id" INTEGER NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "last_access" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_progress_pkey" PRIMARY KEY ("course_progres_id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "rating_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "skor" INTEGER,
    "comment" TEXT,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("rating_id")
);

-- CreateTable
CREATE TABLE "Promo" (
    "promo_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "deskripsi" TEXT,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "total_promo" INTEGER NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("promo_id")
);

-- CreateTable
CREATE TABLE "Riwayat_Transaksi" (
    "riwayat_transaksi_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "metode_pembayaran" TEXT NOT NULL,
    "tanggal_pembayaran" TIMESTAMP(3) NOT NULL,
    "status" TEXT,

    CONSTRAINT "Riwayat_Transaksi_pkey" PRIMARY KEY ("riwayat_transaksi_id")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "notifikasi_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "title" TEXT,
    "deskripsi" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("notifikasi_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Otp_account_id_key" ON "Otp"("account_id");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "Kategori"("kategori_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "Mentor"("mentor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "Chapter"("chapter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_course" ADD CONSTRAINT "User_course_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_course" ADD CONSTRAINT "User_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor_course" ADD CONSTRAINT "Mentor_course_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "Mentor"("mentor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor_course" ADD CONSTRAINT "Mentor_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course_progress" ADD CONSTRAINT "Course_progress_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course_progress" ADD CONSTRAINT "Course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course_progress" ADD CONSTRAINT "Course_progress_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("video_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promo" ADD CONSTRAINT "Promo_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riwayat_Transaksi" ADD CONSTRAINT "Riwayat_Transaksi_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riwayat_Transaksi" ADD CONSTRAINT "Riwayat_Transaksi_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
