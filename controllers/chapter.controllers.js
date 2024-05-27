const prisma = require('../libs/prisma');
const { getPagination } = require('../helper/index');

module.exports = {
  getAllChapter: async (req, res, next) => {
    try {
      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      let chapter = await prisma.chapter.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      const { _count } = await prisma.chapter.aggregate({
        _count: { chapter_id: true },
      });

      let pagination = getPagination(req, _count.chapter_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, chapter },
      });
    } catch (error) {
      next(error);
    }
  },

  getChapterByCourseId: async (req, res, next) => {
    const courseId = parseInt(req.params.course_id);

    try {
      // Lakukan pengecekan apakah course_id valid sesuai dengan data Course yang ada
      const existingCourse = await prisma.course.findUnique({
        where: {
          course_id: courseId,
        },
      });

      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found.',
        });
      }

      const chapters = await prisma.chapter.findMany({
        where: {
          course_id: courseId,
        },
      });

      res.status(200).json({
        success: true,
        data: chapters,
      });
    } catch (error) {
      next(error);
    }
  },

  addChapter: async (req, res, next) => {
    const { chapter_title, course_id, video_id } = req.body;

    try {
      // Input validation
      if (!chapter_title || !course_id || !video_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required data.',
        });
      }

      // Data type validation
      if (
        typeof chapter_title !== 'string' ||
        typeof course_id !== 'number' ||
        typeof video_id !== 'number'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data types.',
        });
      }

      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: {
          course_id: course_id,
        },
      });

      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found.',
        });
      }

      // Check if video exists
      const existingVideo = await prisma.video.findUnique({
        where: {
          video_id: video_id,
        },
      });

      if (!existingVideo) {
        return res.status(404).json({
          success: false,
          message: 'Video not found.',
        });
      }

      // Create chapter along with the related video
      const newChapter = await prisma.chapter.create({
        data: {
          title: chapter_title,
          course_id: course_id,
          Video: {
            connect: {
              video_id: video_id,
            },
          },
        },
        select: {
          chapter_id: true,
          title: true,
          course_id: true,
          Course: true,
          Video: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Create chapter successfully.',
        data: newChapter,
      });
    } catch (error) {
      next(error);
    }
  },

  updateChapter: async (req, res, next) => {
    try {
      const chapterId = parseInt(req.params.chapter_id);
      const { chapter_title, course_id, video_id } = req.body;

      // Lakukan pengecekan data yang diberikan
      if (!chapterId || !chapter_title || !course_id || !video_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required data.',
        });
      }

      // Cek apakah chapter_id valid sesuai dengan data Chapter yang ada
      const existingChapter = await prisma.chapter.findUnique({
        where: {
          chapter_id: chapterId,
        },
      });

      if (!existingChapter) {
        return res.status(404).json({
          success: false,
          message: 'Chapter not found.',
        });
      }

      // Cek apakah course_id valid sesuai dengan data Course yang ada
      const existingCourse = await prisma.course.findUnique({
        where: {
          course_id: course_id,
        },
      });

      if (!existingCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found.',
        });
      }

      // Cek apakah video valid sesuai dengan data Video yang ada
      const existingVideo = await prisma.video.findUnique({
        where: {
          video_id: video_id,
        },
      });

      if (!existingVideo) {
        return res.status(404).json({
          success: false,
          message: 'Video not found.',
        });
      }

      // Update the chapter
      const updatedChapter = await prisma.chapter.update({
        where: { chapter_id: chapterId },
        data: {
          title: chapter_title,
          Course: { connect: { course_id: course_id } }, // Connect to an existing Course by course_id
          Video: { connect: { video_id: video_id } }, // Connect to an existing Video by video_id
        },
        select: {
          chapter_id: true,
          title: true,
          course_id: true,
          Course: true,
          Video: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'update chapter successfully.',
        data: updatedChapter,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteChapter: async (req, res, next) => {
    try {
      const chapter_id = parseInt(req.params.chapter_id);

      // Cari chapter berdasarkan ID
      const chapter = await prisma.chapter.findUnique({
        where: { chapter_id: chapter_id },
        include: { Video: true },
      });

      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: 'Chapter not found.',
        });
      }

      // Delete associated Videos
      await prisma.video.deleteMany({
        where: { chapter_id: chapter_id },
      });

      // Hapus chapter berdasarkan chapter id
      await prisma.chapter.delete({
        where: { chapter_id: chapter_id },
      });

      res.status(200).json({
        success: true,
        message: 'Delete chapter successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
