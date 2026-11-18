const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/:id', optionalAuth, c.getProfile);
router.post('/:id/follow', protect, c.toggleFollow);

module.exports = router;