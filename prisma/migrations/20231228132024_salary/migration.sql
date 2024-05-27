-- CreateTable
CREATE TABLE "Salary" (
    "salary_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "gaji_dn" INTEGER,
    "gaji_ln" INTEGER,

    CONSTRAINT "Salary_pkey" PRIMARY KEY ("salary_id")
);
