const router = require('express').Router();
const {imageFilter} = require('../libs/multer');
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllCategory,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controllers');

router.get('/', getAllCategory);
router.post('/', imageFilter.single('url_img_preview'), createCategory);

// BY ID
router.get('/:kategori_id', getCategoryById);
// UPDATE
router.put('/:kategori_id', imageFilter.single('url_img_preview'), updateCategory);
// DELETE
router.delete('/:kategori_id', deleteCategory);


module.exports = router;
