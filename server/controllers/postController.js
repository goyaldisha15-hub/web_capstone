const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const notify = require('../utils/notify');

// POST /api/posts   (author, admin)
exports.createPost = asyncHandler(async (req, res) => {
  const { title, content, tags, status } = req.body;
  const post = await Post.create({ title, content, tags, status, author: req.user._id });
  res.status(201).json({ success: true, post });
});

// GET /api/posts?q=&tag=&page=&limit=   (published posts, text search)
exports.getPosts = asyncHandler(async (req, res) => {
  const { q, tag } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const filter = { status: 'published' };
  if (q) filter.$text = { $search: q };
  if (tag) filter.tags = tag.toLowerCase();

  const [posts, total] = await Promise.all([
    Post.find(filter).populate('author', 'name').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit),
    Post.countDocuments(filter)
  ]);
  res.json({ success: true, total, page, posts });
});

// GET /api/posts/mine   (own posts incl. drafts)
exports.getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, posts });
});

// GET /api/posts/feed   (posts from followed authors)
exports.getFeed = asyncHandler(async (req, res) => {
  const follows = await Follow.find({ follower: req.user._id }).select('following');
  const ids = follows.map((f) => f.following);
  const posts = await Post.find({ author: { $in: ids }, status: 'published' })
    .populate('author', 'name').sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, posts });
});

// GET /api/posts/:id
exports.getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name bio');
  if (!post) throw new AppError('Post not found', 404);

  const isOwner = req.user && String(post.author._id) === String(req.user._id);
  if (post.status === 'draft' && !isOwner && req.user?.role !== 'admin') {
    throw new AppError('Post not found', 404);
  }
  res.json({ success: true, post });
});

// PUT /api/posts/:id   (owner or admin)
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError('Post not found', 404);
  if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not allowed to edit this post', 403);
  }
  ['title', 'content', 'tags', 'status'].forEach((k) => {
    if (req.body[k] !== undefined) post[k] = req.body[k];
  });
  await post.save();
  res.json({ success: true, post });
});

// DELETE /api/posts/:id   (owner or admin)
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new AppError('Post not found', 404);
  if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not allowed to delete this post', 403);
  }
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

// POST /api/posts/:id/like   (toggle like + live notification)
exports.toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.status !== 'published') throw new AppError('Post not found', 404);

  const uid = String(req.user._id);
  const liked = post.likes.some((l) => String(l) === uid);
  if (liked) post.likes.pull(req.user._id);
  else post.likes.push(req.user._id);
  await post.save();

  if (!liked) await notify(req, { recipient: post.author, sender: req.user._id, type: 'like', post: post._id });
  res.json({ success: true, liked: !liked, likesCount: post.likes.length });
});

// ---------- AGGREGATIONS ----------

// GET /api/posts/trending   (score = likes + 2*comments, joined with author)
exports.getTrending = asyncHandler(async (req, res) => {
  const posts = await Post.aggregate([
    { $match: { status: 'published' } },
    { $lookup: { from: 'comments', localField: '_id', foreignField: 'post', as: 'comments' } },
    { $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' }
    } },
    { $addFields: { score: { $add: ['$likesCount', { $multiply: ['$commentsCount', 2] }] } } },
    { $sort: { score: -1, createdAt: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
    { $unwind: '$author' },
    { $project: { title: 1, tags: 1, createdAt: 1, likesCount: 1, commentsCount: 1, score: 1,
                  'author._id': 1, 'author.name': 1 } }
  ]);
  res.json({ success: true, posts });
});

// GET /api/posts/stats/me   (author dashboard: totals per status, likes, top tags)
exports.getMyStats = asyncHandler(async (req, res) => {
  const authorId = new mongoose.Types.ObjectId(req.user._id);
  const [totals] = await Post.aggregate([
    { $match: { author: authorId } },
    { $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        drafts: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        totalLikes: { $sum: { $size: '$likes' } }
    } },
    { $project: { _id: 0 } }
  ]);
  const topTags = await Post.aggregate([
    { $match: { author: authorId } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  res.json({ success: true, stats: totals || { totalPosts: 0, published: 0, drafts: 0, totalLikes: 0 }, topTags });
});