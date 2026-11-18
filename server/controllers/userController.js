const User = require('../models/User');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users/:id   (public author profile)
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name bio role createdAt');
  if (!user) throw new AppError('User not found', 404);

  const [followers, following, posts] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
    Post.find({ author: user._id, status: 'published' }).sort({ createdAt: -1 })
  ]);
  const isFollowing = req.user
    ? !!(await Follow.exists({ follower: req.user._id, following: user._id }))
    : false;
  res.json({ success: true, user, followers, following, isFollowing, posts });
});

// POST /api/users/:id/follow   (toggle follow)
exports.toggleFollow = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (String(targetId) === String(req.user._id)) throw new AppError("You can't follow yourself", 400);
  if (!(await User.exists({ _id: targetId }))) throw new AppError('User not found', 404);

  const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, following: false });
  }
  await Follow.create({ follower: req.user._id, following: targetId });
  res.json({ success: true, following: true });
});

// ---------- ADMIN ----------
exports.listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

exports.changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['reader', 'author', 'admin'].includes(role)) throw new AppError('Invalid role', 400);
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true })
    .select('name email role');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, user });
});

exports.platformStats = asyncHandler(async (req, res) => {
  const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  const topAuthors = await Post.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$author', posts: { $sum: 1 }, likes: { $sum: { $size: '$likes' } } } },
    { $sort: { posts: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'author' } },
    { $unwind: '$author' },
    { $project: { _id: 0, name: '$author.name', posts: 1, likes: 1 } }
  ]);
  res.json({ success: true, usersByRole, topAuthors });
});