const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');
const {
  getAllRating,
  createRatingbyLogin,
  getRatingbyLogin,
  updateRating,
  deleteRating,
} = require('../controllers/rating.controllers');

//get all by id/course_id/skor
router.get('/', getAllRating);

// BY LOGIN
router.get('/myRates', restrict, getRatingbyLogin);
router.post('/rate', restrict, createRatingbyLogin);
router.put('/:rating_id', restrict, updateRating);
router.delete('/:rating_id', restrict, deleteRating);


module.exports = router;
