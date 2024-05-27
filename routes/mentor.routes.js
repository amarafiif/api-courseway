const router = require('express').Router();
const { restrict } = require('../middlewares/auth.middlewares');

const { 
    getAllMentor, 
    createMentor, 
    getMentorByID,
 } = require('../controllers/mentor.controllers');

router.get('/', getAllMentor);
router.post('/', createMentor);

//GET MENTOR BY ID
router.get('/:mentor_id', getMentorByID);


module.exports = router;
