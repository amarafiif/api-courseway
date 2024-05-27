const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { getPagination } = require('../helper/index');


module.exports ={
    getCount: async(req,res,next)=>{
        try {
            // Menghitung jumlah pengguna yang is_verified bernilai true
            const activeUsersCount = await prisma.account.count({
                where: {
                    is_verified: true,
                },
            });

            const activeCourseCount = await prisma.course.count({
                where: {
                    User_course: {
                        some:{}
                    }
                },
            });

            const premiumCourseCount = await prisma.course.count({
                where: {
                    premium: true,
                },
            });
            res.status(200).json({
                success: true,
                data: {
                    activeUsersCount,
                    activeCourseCount,
                    premiumCourseCount
                },
            });
        } catch (error) {
            next(error);
        }
    },

    getAllPayment: async(req,res,next)=>{
        try {
            let { limit = 10, page = 1 } = req.query;
            limit = Number(limit);
            page = Number(page);
            let payment = await prisma.riwayat_Transaksi.findMany({
              skip: (page - 1) * limit,
              take: limit,
              select:{
                riwayat_transaksi_id: true,
                account_id: true,
                Account:{
                  select:{
                    nama: true,
                    email: true,
                  }
                },
                Course:{
                  select:{
                    title: true,
                    kode_kelas:true,
                    Kategori:{
                        select:{
                            title:true
                        }
                    }
                  }
                },
                status: true,
                tanggal_pembayaran: true,
              }
            });
            const { _count } = await prisma.riwayat_Transaksi.aggregate({
              _count: { riwayat_transaksi_id: true },
            });
      
            let pagination = getPagination(req, _count.riwayat_transaksi_id, page, limit);
      
            res.status(200).json({
              success: true,
              data: { pagination, payment },
            });
          } catch (error) {
            next(error);
          }
    }
}
