const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');
const { autoAddUserCourse } = require('./user_course.controllers');
const { autoAddCourseProgress } = require('./course-progres.controller');

module.exports = {
  getAllPayment: async (req, res, next) => {
    try {
      let { limit = 10, page = 1, status, search, account_id } = req.query;
      limit = Number(limit);
      page = Number(page);
      account_id = Number(account_id)

      let conditions = {}

      if (account_id) { //filter by account id
        conditions.account_id = account_id 
      }

      if (status) { //filter by status payment
        conditions.status = { contains: status, mode: 'insensitive' };
      }

      if (search) { //filter by title course
        conditions.Course = {
          title: { contains: search, mode: 'insensitive' },
        };
      }

      let payment = await prisma.riwayat_Transaksi.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: conditions,
        select: {
          riwayat_transaksi_id: true,
          account_id: true,
          Account: {
            select: {
              nama: true,
              email: true,
            },
          },
          Course: {
            select: {
              title: true,
              kode_kelas: true,
              harga: true,
              url_image_preview:true,
              Kategori: {
                select: {
                  title: true,
                },
              },
            },
          },
          metode_pembayaran: true,
          status: true,
          tanggal_pembayaran: true,
        },
      });
      const { _count } = await prisma.riwayat_Transaksi.aggregate({
        _count: { riwayat_transaksi_id: true },
        where: conditions,
      });

      let pagination = getPagination(
        req,
        _count.riwayat_transaksi_id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: { pagination, payment },
      });
    } catch (error) {
      next(error);
    }
  },

  createPayment: async (req, res, next) => {
    try {
      let { account_id, course_id } = req.body;

      let Course = await prisma.course.findUnique({
        where: {
          course_id,
        },
      });

      let account = await prisma.account.findUnique({
        where: {
          account_id,
        },
      });

      //validasi akun te registrasi atau tidak
      if (!account) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Account isnt registered',
          data: null,
        });
      }

      //validasi course te registrasi atau tidak
      if (!Course) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Course isnt registered',
          data: null,
        });
      }
      let payment = await prisma.riwayat_Transaksi.create({
        data: {
          account_id,
          course_id,
        },
      });

      //create Notification
      let titleNotif = 'Un-Successful purchase course added by admin!';
      let deskNotif = `Hii ${account.nama} you have courses that you haven't purchased yet, To get full access to the course, please complete the payment`;
      
      await prisma.notifikasi.create({
        data: {
          account_id: account.account_id,
          title: titleNotif,
          deskripsi: deskNotif,
        },
      });

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  updatePaymentStatusbyId: async (req, res, next) => {
    try {
      let { riwayat_transaksi_id } = req.params;
      let { metode_pembayaran } = req.body;
      riwayat_transaksi_id = parseInt(riwayat_transaksi_id, 10);

      let isExist = await prisma.riwayat_Transaksi.findUnique({
        where: { riwayat_transaksi_id },
      });

      //validasi payment
      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Payment id not found!',
          data: null,
        });
      }

      let account = await prisma.account.findUnique({
        where: { account_id: isExist.account_id },
      });

      let payment = await prisma.riwayat_Transaksi.update({
        where: {
          riwayat_transaksi_id,
        },
        data: {
          metode_pembayaran,
          tanggal_pembayaran: new Date(Date.now()),
          status: 'Sudah Bayar',
        },
      });

      //create Notification
      let titleNotif = 'Successful purchase course added by admin!';
      let deskNotif = `Hii ${account.nama}, Congratulations you have successfully purchased the course and got full access to the course`;
      
      await prisma.notifikasi.create({
        data: {
          account_id: account.account_id,
          title: titleNotif,
          deskripsi: deskNotif,
        },
      });

      //create UserCourse
      await autoAddUserCourse(account.account_id, payment.course_id);

      //create Course-Progress
      await autoAddCourseProgress(account.account_id, payment.course_id);

      res.status(200).json({
        success: true,
        message: `Payment with id ${riwayat_transaksi_id} updated`,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  getPaymentbyLogin: async (req, res, next) => {
    try {
      let account = req.user;
      let { limit = 10, page = 1, status, search } = req.query;
      limit = Number(limit);
      page = Number(page);

      let conditions = {
        account_id: account.account_id,
      };

      if (status) {
        conditions.status = { contains: status, mode: 'insensitive' };
      }

      if (search) {
        conditions.Course = {
          title: { contains: search, mode: 'insensitive' },
        };
      }

      let payment = await prisma.riwayat_Transaksi.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: conditions,
        select: {
          riwayat_transaksi_id: true,
          account_id: true,
          Course: {
            select: {
              title: true,
              kode_kelas: true,
              harga: true,
              url_image_preview:true,
              Kategori: {
                select: {
                  title: true,
                },
              },
              Mentor: {
                select: {
                  name: true,
                },
              },
            },
          },
          metode_pembayaran: true,
          status: true,
          tanggal_pembayaran: true,
        },
      });

      const { _count } = await prisma.riwayat_Transaksi.aggregate({
        _count: { riwayat_transaksi_id: true },
        where: conditions,
      });

      let pagination = getPagination(
        req,
        _count.riwayat_transaksi_id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: { pagination, payment },
      });
    } catch (error) {
      next(error);
    }
  },

  getPaymentById: async (req, res, next) => {
    try {
      let { riwayat_transaksi_id } = req.params;
      riwayat_transaksi_id = parseInt(riwayat_transaksi_id, 10);

      let payment = await prisma.riwayat_Transaksi.findUnique({
        where: {
          riwayat_transaksi_id,
        },
        select: {
          riwayat_transaksi_id: true,
          account_id: true,
          Account: {
            select: {
              nama: true,
              email: true,
            },
          },
          Course: {
            select: {
              title: true,
              kode_kelas: true,
              harga: true,
            },
          },
          metode_pembayaran: true,
          status: true,
          tanggal_pembayaran: true,
        },
      });

      //validasi payment
      if (!payment) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: "Payment isn't registered!",
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  createPaymentbyLogin: async (req, res, next) => {
    try {
      let account = req.user;
      let { course_id } = req.body;

      let isCourse = await prisma.course.findUnique({ where: { course_id } });

      //validasi course
      if (!isCourse) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Course not found!',
          data: null,
        });
      }

      let payment = await prisma.riwayat_Transaksi.create({
        data: {
          account_id: account.account_id,
          course_id,
        },
      });

      //create Notification
      let titleNotif = 'Un-Successful purchase course added!';
      let deskNotif = `Hii ${account.nama} you have courses that you haven't purchased yet, To get full access to the course, please complete the payment`;

      await prisma.notifikasi.create({
        data: {
          account_id: account.account_id,
          title: titleNotif,
          deskripsi: deskNotif,
        },
      });

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  updatePaymentStatusbyLogin: async (req, res, next) => {
    try {
      let account = req.user;
      let { course_id, metode_pembayaran } = req.body;

      const userTransaction = await prisma.riwayat_Transaksi.findFirst({
        where: {
          account_id: account.account_id,
          course_id
        },
      });

      if (!userTransaction) {
        return res.status(404).json({
          success: false,
          message: `Transaction not found for account ${account.account_id} and course ${course_id}`,
        });
      }

      let payment = await prisma.riwayat_Transaksi.update({
        where: {
          riwayat_transaksi_id: userTransaction.riwayat_transaksi_id,
        },
        data: {
          tanggal_pembayaran: new Date(Date.now()),
          metode_pembayaran,
          status: 'Sudah Bayar',
        },
      });

      //create Notification
      let titleNotif = 'Successful purchase course added!';
      let deskNotif = `Hii ${account.nama}, Congratulations you have successfully purchased the course and got full access to the course`;

      await prisma.notifikasi.create({
        data: {
          account_id: account.account_id,
          title: titleNotif,
          deskripsi: deskNotif,
        },
      });

      //create UserCourse
      await autoAddUserCourse(account.account_id, course_id);

      //create Course-Progress
      await autoAddCourseProgress(account.account_id, course_id);

      res.status(200).json({
        success: true,
        message: `Payment with id ${payment.riwayat_transaksi_id} updated`,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },
};
