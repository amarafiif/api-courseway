const prisma = require('../libs/prisma');
const { getPagination } = require('../helper/index');

module.exports = {
  getAllUserCourse: async (req, res, next) => {
    try {
      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      let userCourse = await prisma.user_course.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          user_course_id: true,
          account_id: true,
          course_id: true,
          Course: {
            select: {
              title: true,
              harga: true,
              Kategori: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      const { _count } = await prisma.user_course.aggregate({
        _count: { account_id: true },
      });

      let pagination = getPagination(req, _count.account_id, page, limit);

      if (!userCourse) return res.json('User Course isnt registered');

      res.status(200).json({
        success: true,
        data: { pagination, userCourse },
      });
    } catch (error) {
      next(error);
    }
  },

  getUserCoursebyLogin: async (req, res, next) => {
    try {
      let account = req.user;
      let { limit = 10, page = 1, search, category_ids, sort, order="asc", level } = req.query;
        limit = Number(limit);
        page = Number(page);
        
        let conditions = {};
        let orderBy = {};
        
        if (search) {
            conditions.title = {
                contains: search,
                mode: 'insensitive',
            };
        }
        if (category_ids) {
            const kategoriIds = Array.isArray(category_ids) ? category_ids.map(id => parseInt(id, 10)) : [parseInt(category_ids, 10)];
            conditions.kategori_id = {
                in: kategoriIds.filter(id => !isNaN(id)), // Filter out NaN values
            };
        }
        if (level) {
            const levelList = Array.isArray(level) ? level : [level];
            conditions.level = {
                in: levelList,
            };
        }
        if (sort && order) {
            //skip langkah jika ingin mengsorting berdasarkan rating
            if (sort && order && sort.toLowerCase() === 'rating') {
                
            }else{
                orderBy = sort && order ? { [sort]: order } : undefined;
            }
        }
        if(account){
          conditions.User_course = {
            some:{account_id:account.account_id}
        }
      }
      const { _count } = await prisma.course.aggregate({
            where:conditions,
            _count: { course_id: true },
        });
      let userCourse = await prisma.course.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: conditions,
        orderBy:{course_id:'asc'},
        select: {
          course_id: true,
          title: true,
          kode_kelas: true,
          kategori_id: true,
          premium: true,
          harga: true,
          level: true,
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
          Rating: {
              select: {
                  skor: true,
              },
          },
          Chapter: {
              select: {
                _count: {
                  select: {
                    Video: true,
                  },
                },
              },
          },
          Course_progress:{
            where:{account_id: account.account_id},
            select:{
              is_done: true,
              course_id: true,
            }
          }
        },
      });

      userCourse.forEach((c) => {
        const totalSkor = c.Rating.reduce((acc, rating) => acc + rating.skor, 0);
        const avgSkor = c.Rating.length > 0 ? totalSkor / c.Rating.length : 0;
        c.avgRating = avgSkor;

        c.module = c.Chapter.reduce((acc, chapter) => acc + chapter._count.Video,0); 

        const progressByCourse = c.Course_progress.length
        const doneByCourse = c.Course_progress.reduce((acc, current) => acc + current.is_done,0)

        let percentage = progressByCourse > 0 ? ((doneByCourse / progressByCourse) * 100).toFixed(1) : 0;
        percentage = +percentage
        c.progress = percentage
      });


      userCourse.forEach(object=>{
        delete object['Rating']
        delete object['Chapter']
        delete object['Course_progress']
      })
      let pagination = getPagination(req, _count.course_id, page, limit);

      if (!userCourse) return res.json('User Course isnt registered');

      res.status(200).json({
        success: true,
        data: {pagination, userCourse},
      });
    } catch (error) {
      next(error);
    }
  },

  createUserCourse: async (req, res, next) => {
    try {
      let { course_id, account_id } = req.body;
      course_id = parseInt(course_id, 10);
      let course = await prisma.course.findUnique({ where: { course_id } });
      if (!course) return res.status(404).json('Course isnt registered');

      //jika data sudah ada maka data akan di update
      let existingData = await prisma.user_course.findFirst({
        where: {
          account_id,
          course_id, // Cari entri Data berdasarkan account_id & course_id
        },
      });
      if (existingData) {
        return await prisma.user_course.update({
          where: { user_course_id: existingData.user_course_id },
          data: { account_id, course_id },
        });
      }

      let userCourse = await prisma.user_course.create({
        data: {
          account_id,
          course_id,
        },
      });

      res.status(200).json({
        success: true,
        data: userCourse,
      });
    } catch (error) {
      next(error);
    }
  },

  getUserCoursebyAccountId: async (req, res, next) => {
    try {
      let { account_id } = req.params;
      account_id = parseInt(account_id, 10);
      let userCourse = await prisma.user_course.findMany({
        where: {
          account_id: account_id,
        },
        select: {
          user_course_id: true,
          account_id: true,
          course_id: true,
          Course: {
            select: {
              title: true,
              harga: true,
              Kategori: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      if (!userCourse) return res.json('User Course isnt registered');

      res.status(200).json({
        success: true,
        data: userCourse,
      });
    } catch (error) {
      next(error);
    }
  },

  autoAddUserCourse: async (account_id, course_id, res) => {
    try {
      let existingData = await prisma.user_course.findFirst({
        where: {
          account_id,
          course_id, // Cari entri Data berdasarkan account_id & course_id
        },
      });
      if (existingData) {
        return await prisma.user_course.update({
          where: { user_course_id: existingData.user_course_id },
          data: { account_id, course_id },
        });
      }

      await prisma.user_course.create({
        data: {
          account_id,
          course_id
        },
      });
    } catch (err) {
      console.log(err);
    }
  },
};
