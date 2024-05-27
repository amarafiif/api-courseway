const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');

module.exports = {
  getAllMentor: async (req, res, next) => {
    try {
      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      const mentor = await prisma.mentor.findMany({
        skip: (page - 1) * limit,
        take: limit
      });

      const { _count } = await prisma.mentor.aggregate({
        _count: { mentor_id: true },
      });

      let pagination = getPagination(req, _count.mentor_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, mentor },
      });
    } catch (err) {
      next(err);
    }
  },

  createMentor: async (req, res, next) => {
    try{
      let {name, job} = req.body;
      let isExist = await prisma.mentor.findFirst({where: {name}});

      //validasi name mentor sudah digunakan atau belum
      if(isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'name is already used',
          data: null,
        });
      }

      let mentor = await prisma.mentor.create({
        data: {
          name,
          job
        }
      })

      return res.status(201).json({
        status: true,
        message: 'success!',
        err: null,
        data: mentor,
      });
      
    } catch (err) {
      next (err);
    }
  },

  getMentorByID: async (req, res, next) => {
    try{
      let {mentor_id} = req.params;

      let isExist = await prisma.mentor.findUnique({
        where: {
          mentor_id: Number (mentor_id),
        },
          include:{
            Course: {
              select:{
                course_id: true,
                title: true,
                harga: true,
                level:true,
                premium:true,
                Kategori:{
                    select:{
                        title: true,
                  },
                }
              }
            }
          }
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
        data: { mentor: isExist },
      });

    } catch (err) {
      next (err)
    }
  }
  
};
