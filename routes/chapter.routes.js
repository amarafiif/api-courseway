const router = require('express').Router();
const { getAllChapter, getChapterByCourseId, addChapter, updateChapter, deleteChapter } = require('../controllers/chapter.controllers');
const { restrict } = require('../middlewares/auth.middlewares');

router.get('/', getAllChapter);
router.get('/:course_id', getChapterByCourseId);
router.post('/addChapter', restrict, addChapter);
router.put('/updateChapter/:chapter_id', restrict, updateChapter);
router.delete('/deleteChapter/:chapter_id', restrict, deleteChapter);

module.exports = router;
