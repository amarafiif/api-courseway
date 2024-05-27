const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');

module.exports = {
  //get seluruh rating berdasarkan course_id dan skor atau rating_id
  getAllRating: async (req, res, next) => {
    try {
      let {course_id, skor, rating_id} = req.query;
      let conditions = {}

      //course_id
      if(course_id){
        const courseIds = Array.isArray(course_id) ? course_id.map(id => parseInt(id, 10)) : [parseInt(course_id, 10)];
        conditions.course_id = {
          in: courseIds.filter(id => !isNaN(id)), // Filter out NaN values

        }
      }

      //skor
      if(skor){
        const skorIds = Array.isArray(skor) ? skor.map(id => parseInt(id, 10)) : [parseInt(skor, 10)];
        conditions.skor = {
          in: skorIds.filter(id => !isNaN(id)), // Filter out NaN values

        }
      }

      //rating_id
      if(rating_id){
        const Rating_id = Array.isArray(rating_id) ? rating_id.map(id => parseInt(id, 10)) : [parseInt(rating_id, 10)];
        conditions.rating_id = {
          in: Rating_id.filter(id => !isNaN(id)), // Filter out NaN values

        }
      }

      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      const rating = await prisma.rating.findMany({
        where : conditions,
        skip: (page - 1) * limit,
        take: limit,
        include:{
          Account:{
            select:{
              nama: true,
              email: true,
              url_image:true
            }
          },
        }
      });

      const { _count } = await prisma.rating.aggregate({
        _count: { rating_id: true },
      });

      let pagination = getPagination(req, _count.rating_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, rating },
      });
    } catch (err) {
      next(err);
    }
  },

  //Membuat rating
  createRatingbyLogin: async (req, res, next) => {
    try {
        const { course_id, skor, comment } = req.body;
        let { account_id } = req.user;
        //check all requirement is inputed
        if (!course_id || !skor || !comment) {
            return res.status(400).json({
                status: false,
                message: 'bad request',
                err: "Please fill all required field",
                data: null,
            });
        }
        // Check if the course exists
        let isExist = await prisma.course.findUnique({
            where: { course_id },
        });

        if (!isExist) {
            return res.status(400).json({
                status: false,
                message: 'bad request',
                err: "Course not found",
                data: null,
            });
        }

        // Check if the rating already exists
        let existingRating = await prisma.rating.findFirst({
            where: {
                course_id,
                account_id
            }
        });
        if (existingRating) {
            return res.status(400).json({
                status: false,
                message: 'bad request',
                err: "Rating already exists",
                data: null,
            });
        }

        // Validate skor to be within range (0 to 5)
        const skorValue = parseInt(skor, 10);
        if (skorValue < 0 || skorValue > 5 || isNaN(skorValue)) {
            return res.status(400).json({
                status: false,
                message: 'bad request',
                err: "Skor should be a number between 0 and 5",
                data: null,
            });
        }

        const createRating = await prisma.rating.create({
            data: {
                account_id: account_id,
                course_id,
                skor: skorValue,
                comment
            }
        });

        return res.status(201).json({
            status: true,
            message: 'Successful create rating',
            err: null,
            data: { createRating }
        });

    } catch (err) {
        next(err)
    }
  },

  //mendapatkan rating dari login
  getRatingbyLogin: async (req, res, next) => {
    try {
      let {account_id} = req.user
      
      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      const rating = await prisma.rating.findMany({
        where: {
          account_id: account_id // Filter berdasarkan account_id
        },
        skip: (page - 1) * limit,
        take: limit
      });

      const { _count } = await prisma.rating.aggregate({
        _count: { rating_id: true },
      });

      let pagination = getPagination(req, _count.rating_id, page, limit);

      res.status(200).json({
        stauts: true,
        message: 'success',
        data: { pagination, rating },
      });
    } catch (err) {
      next(err);
    }
  },

  //melakukan update rating
  updateRating: async (req, res, next) => {
    try {
      const { skor, comment } = req.body;
      const { account_id } = req.user;
      const { rating_id } = req.params;
  
      // Periksa apakah rating dengan rating_id yang diberikan ada dalam database
      const existingRating = await prisma.rating.findUnique({
        where: {
          rating_id: Number(rating_id)
        }
      });
  
      // Validasi apakah rating dengan rating_id yang diberikan ada
      if (!existingRating) {
        return res.status(400).json({
          status: false,
          message: 'Bad request!',
          err: 'Rating not found',
          data: null,
        });
      }
  
      // Lakukan pembaruan rating
      const updatedRating = await prisma.rating.update({
        where: {
          rating_id: Number(rating_id)
        },
        data: { skor, comment }
      });
  
      return res.status(200).json({
        status: true,
        message: 'Successful update rating',
        err: null,
        data: { rating: updatedRating }
      });
  
    } catch (err) {
      next(err);
    }
  },

  //melakukan delete rating
  deleteRating : async (req, res, next) => {
    try{
        let { rating_id } = req.params;
        let {account_id} = req.user;

        let isExist = await prisma.rating.findUnique({
          where: {
            rating_id: Number(rating_id)
          },
        });

        if (!isExist) {
          return res.status(400).json({
            status: false,
            message: 'bad request!',
            err: 'rating not found!',
            data: null,
          });
        }

        const deleteRating = await prisma.rating.delete({
            where: {
                rating_id: Number(rating_id)
            }
        });

        return res.status(200).json({
            status: true,
            message: 'Successful delete rating',
            err: null,
            data: deleteRating
        });

      } catch (err) {
          next (err)
      }     
    } 
};