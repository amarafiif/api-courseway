const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');

module.exports = {
  getAllCourseProgress: async (req, res, next) => {
    try {
      let { limit = 10, page = 1, account_id } = req.query;
      limit = Number(limit);
      page = Number(page);

      let conditions = {};

      if (account_id) {
        let accountIds = Array.isArray(account_id)
          ? account_id.map((id) => Number(id))
          : [Number(account_id)];
        conditions.account_id = {
          in: accountIds.filter((id) => !isNaN(id)),
        };
      }

      let course_progress = await prisma.course_progress.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: conditions
      });
      const { _count } = await prisma.course_progress.aggregate({
        where: conditions,
        _count: { course_progres_id: true },
      });

      let pagination = getPagination(
        req,
        _count.course_progres_id,
        page,
        limit
      );

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, course_progress },
      });
    } catch (err) {
      next(err);
    }
  },

  createCourseProgress: async (req, res, next) => {
    try {
      let { account_id, course_id, video_id } = req.body;

      let isAccount = await prisma.account.findUnique({
        where: { account_id },
      });
      let isCourse = await prisma.course.findUnique({ where: { course_id } });
      let isVideo = await prisma.video.findUnique({ where: { video_id } });

      //validasi id ditemukan apa tidak
      if (!isAccount) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Account not found!',
          data: null,
        });
      }
      if (!isCourse) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Course not found!',
          data: null,
        });
      }
      if (!isVideo) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Video not found!',
          data: null,
        });
      }

      let progress = await prisma.course_progress.create({
        data: {
          account_id,
          course_id,
          video_id,
        },
      });

      res.status(201).json({
        status: true,
        message: 'success!',
        err: null,
        data: { progress },
      });
    } catch (err) {
      next(err);
    }
  },

  getCourseProgressById: async (req, res, next) => {
    try {
      let { course_progres_id } = req.params;
      course_progres_id = Number(course_progres_id);

      let isExist = await prisma.course_progress.findUnique({
        where: { course_progres_id },
      });

      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'Course-progress not found!',
          data: null,
        });
      }

      res.status(200).json({
        status: true,
        message: 'success!',
        err: null,
        data: { progress: isExist },
      });
    } catch (err) {
      next(err);
    }
  },

  getCourseProgressByLogin: async (req, res, next) => {
    try {
      let { account_id } = req.user;
      let { limit = 10, page = 1 ,course_id} = req.query;

      limit = Number(limit);
      page = Number(page);
      let conditions = {}
      conditions.account_id=account_id

      if(course_id){
        conditions.course_id =Number(course_id)
      }
      // all err get user dihandle oleh restrict
      // let progress = await prisma.course_progress.aggregate({
      //   where: conditions,
      //   _count:{
      //     is_done:true
      //   }
      // });

      const progressByCourse = await prisma.course_progress.groupBy({
        by: ['course_id'],
        _count: {
          is_done: true,
        },
        where: conditions
      });
      // conditions.is_done= true;
      // conditions.account_id = account_id;
      const isDoneCourse = await prisma.course_progress.groupBy({
        by: ['course_id'],
        _count: {
          is_done: true,
        },
        where: {
          account_id: account_id,
          is_done: true
        }
      });
      
      const doneEntriesByCourse = {};

      isDoneCourse.forEach(courseProgress => {
        doneEntriesByCourse[courseProgress.course_id] = courseProgress._count.is_done;
      });
      
      // console.log(isDoneCourse);
      // console.log(progressByCourse);
      
      const result = progressByCourse.map(courseProgress => {
        const totalEntries = courseProgress._count.is_done;
        const doneEntries = doneEntriesByCourse[courseProgress.course_id]

        // Hindari pembagian dengan nol
        let percentage = totalEntries > 0 ? ((doneEntries / totalEntries) * 100).toFixed(1) : 0;
        if (percentage == "NaN") percentage = 0
        percentage = +percentage
        return {
          course_id: courseProgress.course_id,
          percentage,
        };
      });

      // const { _count } = await prisma.course_progress.aggregate({
      //   where:{account_id},
      //   _count: { course_progres_id: true },
      // });
      let _count = result.length
      
      // let pagination = getPagination(req,_count.course_progres_id,page,limit);
      let pagination = getPagination(req,_count,page,limit);

      res.status(200).json({
        status: true,
        message: 'success!',
        err: null,
        data: { pagination, result },
      });
    } catch (err) {
      next(err);
    }
  },
  
  autoAddCourseProgress: async (account_id, course_id, res) => {
    try {
      let pickChapter = [];
      let pickVideo = [];
      let userProgress = [];

      // VALIDASI DOUBLE CHECK DATA
      let isExist = await prisma.course_progress.findFirst({where:{account_id, course_id}})
      if (isExist) {
        return console.log('Progress anda sudah terdaftar! & progress anda tetap terrsimpan bersama kami');
      }

      //filter chapter yg mau di add berdasar course
      let chapter = await prisma.chapter.findMany({
        where: { course_id },
      });
      //push kedalam array pickChapter
      chapter.forEach((c) => {
        let chapterId = c.chapter_id;
        //push tiap id kedalam array
        pickChapter.push(chapterId);
      });

      // mencari tiap video berdasar chapter
      let video = await prisma.video.findMany({
        where: { chapter_id: { in: pickChapter } },
      });
      video.forEach((v) => {
        let videoId = v.video_id;
        //push tiap id kedalam array
        pickVideo.push(videoId);
      });

      pickVideo.forEach(async (v) => {
        userProgress.push({
          account_id,
          course_id,
          video_id: v,
        });
      });

      // blast data berdasar array userProgress
      await prisma.course_progress.createMany({
        data: userProgress,
      });
    } catch (err) {
      console.log(err);
    }
  },

  updateIsDone:async (req,res,next)=>{
    try {
      let {account_id} = req.user
      let {video_id} = req.body

      let findCourseProgress = await prisma.course_progress.findFirst({
        where:{
          account_id,
          video_id
        }
      })

      let updateIsDone = await prisma.course_progress.update({
        where:{
          course_progres_id:findCourseProgress.course_progres_id
        },
        data:{
          is_done:true
        }
      })
      res.status(200).json({
        status: true,
        message: 'success!',
        err: null,
        data: { updateIsDone },
      });

    } catch (err) {
      next(err)
    }
  }
};
