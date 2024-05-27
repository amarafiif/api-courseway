const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllMentorCourse,
  getMentorCourseById,
} = require('../controllers/mentor-course.controller');

router.get('/', getAllMentorCourse);

//GET MENTOR BY ID
router.get('/:mentor_course_id', getMentorCourseById);

module.exports = router;
