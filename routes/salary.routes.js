const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');
const { getAllSalary, getSalarybyId, getSalarybyCourseId, createSalary } = require('../controllers/salary.controllers');

// MAIN
router.get('/', getAllSalary);
router.post('/', createSalary);

// BY COURSE PARAMS
router.get('/course/:course_id', getSalarybyCourseId);

// BY SALARY PARAMS
router.get('/:salary_id', getSalarybyId);


module.exports = router
