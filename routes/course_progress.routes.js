const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllCourseProgress,
  createCourseProgress,
  getCourseProgressByLogin,
  getCourseProgressById,
  updateIsDone
} = require('../controllers/course-progres.controller');

router.get('/', getAllCourseProgress);
router.post('/', createCourseProgress);

// BY LOGIN
router.get('/myProgress', restrict, getCourseProgressByLogin);
router.put('/progress',restrict, updateIsDone)

// BY ID
router.get('/:course_progres_id', getCourseProgressById);

module.exports = router;
