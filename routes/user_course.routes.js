const express = require('express');
const router = express.Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllUserCourse,
  getUserCoursebyLogin,
  createUserCourse,
  getUserCoursebyAccountId,
} = require('../controllers/user_course.controllers');

router.get('/', getAllUserCourse);
router.post('/', createUserCourse);

// BY LOGIN
router.get('/myclass', restrict, getUserCoursebyLogin);

// BY ID
router.get('/:account_id', getUserCoursebyAccountId);

module.exports = router;
