const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');

module.exports = {
  getAllVideo: async (req, res, next) => {
    try {
      let { limit = 10, page = 1, chapter_id } = req.query;
      limit = Number(limit);
      page = Number(page);
      chapter_id = Number(chapter_id);

      let conditions = {};

      if (chapter_id) {
        conditions.chapter_id = chapter_id;
      }

      let video = await prisma.video.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: conditions,
      });
      const { _count } = await prisma.video.aggregate({
        where: conditions,
        _count: { video_id: true },
      });

      let pagination = getPagination(req, _count.video_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, video },
      });
    } catch (err) {
      next(err);
    }
  },

  createVideo: async (req, res, next) => {
    try {
      let { chapter_id, title, deskripsi, url_video, is_preview } = req.body;

      let isChapterExist = await prisma.chapter.findUnique({
        where: { chapter_id },
      });
      if (!isChapterExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request',
          err: "chapter doesn't exist!, please create one or choose another chapter!",
          data: null,
        });
      }

      let video = await prisma.video.create({
        data: {
          chapter_id,
          title,
          deskripsi,
          url_video,
          is_preview,
        },
      });

      return res.status(200).json({
        status: true,
        message: 'success',
        err: null,
        data: { video },
      });
    } catch (err) {
      next(err);
    }
  },

  getVideobyId: async (req, res, next) => {
    try {
      let { video_id } = req.params;
      video_id = Number(video_id);

      let isExist = await prisma.video.findUnique({ where: { video_id } });

      //validasi id ditemukan apa tidak
      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'id not found!',
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: 'success!',
        err: null,
        data: { video: isExist },
      });
    } catch (err) {
      next(err);
    }
  },
  updateVideobyId: async (req, res, next) => {
    try {
      let { video_id } = req.params;
      let { chapter_id, title, deskripsi, url_video, is_preview } = req.body;
      video_id = Number(video_id);

      let isExist = await prisma.video.findUnique({ where: { video_id } });
      let isChapterExist = await prisma.chapter.findUnique({
        where: { chapter_id },
      });

      if (!isChapterExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request',
          err: "chapter doesn't exist!, please create one or choose another chapter!",
          data: null,
        });
      }
      //validasi id ditemukan apa tidak
      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'id not found!',
          data: null,
        });
      }

      let newVideo = await prisma.video.update({
        where: { video_id },
        data: {
          chapter_id,
          title,
          deskripsi,
          url_video,
          is_preview,
        },
      });

      return res.status(200).json({
        status: true,
        message: 'success update video!',
        err: null,
        data: { video: newVideo },
      });
    } catch (err) {
      next(err);
    }
  },
  deleteVideobyId: async (req, res, next) => {
    try {
      let { video_id } = req.params;
      video_id = Number(video_id);

      let isExist = await prisma.video.findUnique({ where: { video_id } });

      //validasi id ditemukan apa tidak
      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'id not found!',
          data: null,
        });
      }

      let deleteVideo = await prisma.video.delete({ where: { video_id } });

      return res.status(200).json({
        status: true,
        message: 'success!',
        err: null,
        data: { deletedVideo: deleteVideo },
      });
    } catch (err) {
      next(err);
    }
  },
};
