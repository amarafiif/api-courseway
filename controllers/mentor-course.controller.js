const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');

module.exports = {
  getAllMentorCourse: async (req, res, next) => {
    try {
      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      const mentorCourse = await prisma.mentor_course.findMany({
        include: {
          Mentor: {
            select: {
              name: true,
              job: true
            }
          },
          Course: {
            select: {
              title: true,
              harga: true,
              level: true,
              premium: true,
              Kategori: {
                select: {
                  title: true,
                },
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit
      });

      const { _count } = await prisma.mentor_course.aggregate({
        _count: { mentor_course_id: true },
      });

      let pagination = getPagination(req, _count.mentor_course_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, mentorCourse },
      });
    
    } catch (err) {
      next(err);
    }
  },

  getMentorCourseById: async (req, res, next) => {
    try{
      let {mentor_course_id} = req.params;

      let isExist = await prisma.mentor_course.findUnique({
        where: {
          mentor_course_id: Number (mentor_course_id),
        },
        include: {
          Mentor: {
            select: {
              name: true,
              job: true
            }
          },
          Course: {
            select: {
              title: true,
              harga: true,
              level: true,
              premium: true,
              Kategori: {
                select: {
                  title: true,
                },
              }
            }
          }
        },
      })
  
      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'mentor not found!',
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: 'success!',
        err: null,
        data: { mentorCourse: isExist },
      });
      
    } catch (err) {
      next (err)
    }
  }
  
};
