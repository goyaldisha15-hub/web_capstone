const router = require('express').Router();
const c = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/users', c.listUsers);
router.patch('/users/:id/role', c.changeRole);
router.get('/stats', c.platformStats);

module.exports = router;