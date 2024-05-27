const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPagination } = require('../helper/index');
const imagekit = require('../libs/imagekit');
const path = require('path');

module.exports = {
  getAllCategory: async (req, res, next) => {
    try {
      let { limit = 10, page = 1 } = req.query;
      limit = Number(limit);
      page = Number(page);

      let category = await prisma.kategori.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      const { _count } = await prisma.kategori.aggregate({
        _count: { kategori_id: true },
      });

      let pagination = getPagination(req, _count.kategori_id, page, limit);

      res.status(200).json({
        status: true,
        message: 'success',
        data: { pagination, category },
      });
    } catch (err) {
      next(err);
    }
  },

  createCategory: async (req, res, next) => {
    try {
      let { title, deskripsi, url_img_preview } = req.body;
      let isExist = await prisma.kategori.findFirst({ where: { title } });

      // validasi title sudah digunakan atau belum
      if (isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'title is already used',
          data: null,
        });
      }

      if (req.file) {
        // Jika ada file yang di-upload
        let strFile = req.file.buffer.toString('base64');
        let uploadedFile = await imagekit.upload({
            fileName: Date.now() + path.extname(req.file.originalname),
            file: strFile
        });
        url = uploadedFile.url; // Ambil URL gambar yang di-upload
      } else  {
        // Jika tidak ada file yang di-upload tetapi ada url_img_preview dalam permintaan
        url = null; 
      }

      let category = await prisma.kategori.create({
        data: {
          title,
          deskripsi,
          url_img_preview : url,
        },
      });

      return res.status(201).json({
        status: true,
        message: 'success!',
        err: null,
        data: category,
      });
    } catch (err) {
      next(err);
    }
  },

  getCategoryById: async (req, res, next) => {
    try {
      let { kategori_id } = req.params;
      kategori_id = Number(kategori_id)

      let isExist = await prisma.kategori.findUnique({
        where: {
          kategori_id,
        },
      });

      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'category not found!',
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: 'success!',
        err: null,
        data: { category: isExist },
      });
    } catch (err) {
      next(err);
    }
  },

  updateCategory: async (req, res, next) => {
  try {
    const { title, deskripsi, url_img_preview } = req.body;
    const { kategori_id } = req.params;

    // Periksa apakah kategori dengan kategori_id yang diberikan ada dalam database
    const existingCategory = await prisma.kategori.findUnique({
      where: {
        kategori_id: Number(kategori_id)
      }
    });

    // Validasi apakah kategori dengan kategori_id yang diberikan ada
    if (!existingCategory) {
      return res.status(404).json({
        status: false,
        message: 'Bad request!',
        err: 'Category not found',
        data: null,
      });
    }

    // Jika title yang baru tidak sama dengan title yang ada dalam database,
    // periksa apakah title baru sudah ada di database selain kategori yang sedang diperbarui
    if (title && title !== existingCategory.title) {
      const categoryWithSameTitle = await prisma.kategori.findFirst({
        where: {
          NOT: {
            kategori_id: Number(kategori_id)
          },
          title
        }
      });

      if (categoryWithSameTitle) {
        return res.status(400).json({
          status: false,
          message: 'Bad request!',
          err: 'Title already exists',
          data: null,
        });
      }
    }

    let url = url_img_preview; // Menggunakan URL yang disediakan dalam permintaan secara default

    if (req.file) {
      // Jika ada file yang di-upload
      let strFile = req.file.buffer.toString('base64');
      let uploadedFile = await imagekit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile
      });
      url = uploadedFile.url; // Ambil URL gambar yang di-upload
    }

    // Lakukan pembaruan kategori
    const updateCategory = await prisma.kategori.update({
      where: {
        kategori_id: Number(kategori_id)
      },
      data: { title, deskripsi, url_img_preview: url }
    });

    return res.status(200).json({
      status: true,
      message: 'Successful update category',
      err: null,
      data: { category: updateCategory },
    });
  } catch (err) {
    next(err);
  }
},

deleteCategory : async (req, res, next) => {
  try{
      let { kategori_id } = req.params;

      let isExist = await prisma.kategori.findUnique({
        where: {
          kategori_id: Number(kategori_id)
        },
      });

      if (!isExist) {
        return res.status(400).json({
          status: false,
          message: 'bad request!',
          err: 'category not found!',
          data: null,
        });
      }

      const deleteCategory = await prisma.kategori.delete({
          where: {
              kategori_id: Number(kategori_id)
          }
      });

      return res.status(200).json({
          status: true,
          message: 'Successful delete category',
          err: null,
          data: deleteCategory
      });

  } catch (err) {
      next (err)
  }
} 

};
