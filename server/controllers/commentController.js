const Comment = require('../models/Comment');
const Post = require('../models/Post');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

// POST /api/posts/:postId/comments   body: { text, parent? }
exports.addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post || post.status !== 'published') throw new AppError('Post not found', 404);

  const { text, parent } = req.body;
  if (parent) {
    const p = await Comment.findOne({ _id: parent, post: post._id });
    if (!p) throw new AppError('Parent comment not found on this post', 404);
  }
  const comment = await Comment.create({ post: post._id, author: req.user._id, parent: parent || null, text });
  await notify(req, { recipient: post.author, sender: req.user._id, type: 'comment', post: post._id });
  res.status(201).json({ success: true, comment });
});

// GET /api/posts/:postId/comments   (returns nested tree)
exports.getComments = asyncHandler(async (req, res) => {
  const flat = await Comment.find({ post: req.params.postId })
    .populate('author', 'name').sort({ createdAt: 1 }).lean();

  const map = {};
  flat.forEach((c) => { c.replies = []; map[c._id] = c; });
  const roots = [];
  flat.forEach((c) => {
    if (c.parent && map[c.parent]) map[c.parent].replies.push(c);
    else roots.push(c);
  });
  res.json({ success: true, comments: roots });
});

// DELETE /api/comments/:id   (owner or admin; also removes replies)
exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new AppError('Comment not found', 404);
  if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not allowed to delete this comment', 403);
  }
  let ids = [comment._id];
  let frontier = [comment._id];
  while (frontier.length) {
    const kids = await Comment.find({ parent: { $in: frontier } }).select('_id');
    frontier = kids.map((k) => k._id);
    ids = ids.concat(frontier);
  }
  await Comment.deleteMany({ _id: { $in: ids } });
  res.json({ success: true, message: 'Comment deleted' });
});