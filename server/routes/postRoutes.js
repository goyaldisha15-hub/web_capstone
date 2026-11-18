const router = require('express').Router();
const c = require('../controllers/postController');
const cc = require('../controllers/commentController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', c.getPosts);
router.get('/trending', c.getTrending);
router.get('/feed', protect, c.getFeed);
router.get('/mine', protect, authorize('author', 'admin'), c.getMyPosts);
router.get('/stats/me', protect, authorize('author', 'admin'), c.getMyStats);
router.post('/', protect, authorize('author', 'admin'), c.createPost);

router.get('/:id', optionalAuth, c.getPost);
router.put('/:id', protect, authorize('author', 'admin'), c.updatePost);
router.delete('/:id', protect, authorize('author', 'admin'), c.deletePost);
router.post('/:id/like', protect, c.toggleLike);

router.get('/:postId/comments', cc.getComments);
router.post('/:postId/comments', protect, cc.addComment);

module.exports = router;