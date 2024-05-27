const prisma = require('../libs/prisma');
const { getPagination } = require('../helper/index');

module.exports = {
  getAllPromo: async (req, res, next) => {
    try {
      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      let promo = await prisma.promo.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      const { _count } = await prisma.promo.aggregate({
        _count: { promo_id: true },
      });

      let pagination = getPagination(req, _count.promo_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, promo },
      });
    } catch (error) {
      next(error);
    }
  },

  getPromoById: async (req, res, next) => {
    try {
      const promoId = parseInt(req.params.promo_id);

      const promo = await prisma.promo.findUnique({
        where: {
          promo_id: promoId,
        },
      });

      if (!promo) {
        res.status(404).json({
          success: false,
          message: 'Promo not found',
        });
        return;
      }

      res.status(200).json({
        status: true,
        message: 'success',
        data: { promo },
      });
    } catch (error) {
      next(error);
    }
  },

  addPromo: async (req, res, next) => {
    try {
      const { course_id, title, deskripsi, tanggal_mulai, tanggal_selesai, total_promo } = req.body;

      // Input validation
      if ( !course_id || !title || !deskripsi || !tanggal_mulai || !tanggal_selesai || !total_promo ) {
        return res.status(400).json({
          success: false,
          message: 'Missing required data.',
        });
      }

      const newPromo = await prisma.promo.create({
        data: {
          course_id,
          title,
          deskripsi,
          tanggal_mulai,
          tanggal_selesai,
          total_promo,
        },
      });

      res.status(200).json({
        status: true,
        message: 'Add new promo successfully',
        data: { newPromo },
      });
    } catch (error) {
      next(error);
    }
  },

  updatePromo: async (req, res, next) => {
    try {
      const promoId = parseInt(req.params.promo_id);
      const { deskripsi, title, tanggal_mulai, tanggal_selesai, total_promo } = req.body;

      // Input validation
      if (!deskripsi || !title || !tanggal_mulai || !tanggal_selesai || !total_promo) {
        return res.status(400).json({
          success: false,
          message: 'Missing required data.',
        });
      }

      const promo = await prisma.promo.findUnique({
        where: {
          promo_id: promoId,
        },
      });

      if (!promo) {
        res.status(404).json({
          success: false,
          message: 'Promo not found',
        });
        return;
      }

      const updatedPromo = await prisma.promo.update({
        where: {
          promo_id: promoId,
        },
        data: {
          title,
          deskripsi,
          tanggal_mulai,
          tanggal_selesai,
          total_promo,
        },
      });

      res.status(200).json({
        status: true,
        message: 'Update promo successfully',
        data: { updatedPromo },
      });
    } catch (error) {
      next(error);
    }
  },

  deletePromo: async (req, res, next) => {
    try {
      const promoId = parseInt(req.params.promo_id);

      const promo = await prisma.promo.findUnique({
        where: {
          promo_id: promoId,
        },
      });

      if (!promo) {
        res.status(404).json({
          success: false,
          message: 'Promo not found',
        });
        return;
      }

      const deletedPromo = await prisma.promo.delete({
        where: {
          promo_id: promoId,
        },
      });

      res.status(200).json({
        status: true,
        message: 'Delete promo successfully',
        data: { deletedPromo },
      });
    } catch (error) {
      next(error);
    }
  },
};
