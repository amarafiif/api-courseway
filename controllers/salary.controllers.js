const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');

module.exports = {
  getAllSalary: async (req, res, next) => {
    try {
      let { limit = 10, page = 1, course_id } = req.query;
      limit = Number(limit);
      page = Number(page);
      course_id = Number(course_id);

      let conditions = {};

      if (course_id) {
        conditions.course_id = course_id;
      }
      let salary = await prisma.salary.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: conditions,
      });

      const { _count } = await prisma.salary.aggregate({
        where: conditions,
        _count: { salary_id: true },
      });

      let pagination = getPagination(req, _count.salary_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        err: null,
        data: { pagination, salary },
      });
    } catch (err) {
      next(err);
    }
  },
  getSalarybyId: async (req, res, next) => {
    try {
      let { salary_id } = req.params;
      salary_id = Number(salary_id);

      let isExist = await prisma.salary.findUnique({ where: { salary_id } });

      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request',
          err: 'salary id not found',
          data: null,
        });
      }

      res.status(200).json({
        status: true,
        message: 'success',
        err: null,
        data: { salary: isExist },
      });
    } catch (err) {
      next(err);
    }
  },
  createSalary: async (req, res, next) => {
    try {
      let { course_id, gaji_dn, gaji_ln } = req.body;

      let isCourseExist = await prisma.course.findUnique({
        where: { course_id },
      });

      if (!isCourseExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request',
          err: 'course id not found!',
          data: null,
        });
      }

      let salary = await prisma.salary.create({
        data: {
          course_id,
          gaji_dn,
          gaji_ln,
        },
      });

      return res.status(200).json({
        status: true,
        message: 'success',
        err: null,
        data: { salary },
      });
    } catch (err) {
      next(err);
    }
  },
  getSalarybyCourseId: async (req, res, next) => {
    try {
      let { course_id } = req.params;
      course_id = Number(course_id);

      let isCourseExist = await prisma.course.findUnique({
        where: { course_id },
      });
      let isExist = await prisma.salary.findFirst({ where: { course_id } });

      if (!isCourseExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request',
          err: 'Course id not found',
          data: null,
        });
      }
      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request',
          err: 'data not found',
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: 'success',
        err: null,
        data: { salary: isExist },
      });
    } catch (err) {
      next(err);
    }
  },
};
