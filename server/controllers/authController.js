const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signAccess, signRefresh } = require('../utils/tokens');

const issueTokens = async (user) => {
  const accessToken = signAccess(user._id);
  const refreshToken = signRefresh(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, bio: u.bio });

// POST /api/auth/register   (role: reader | author only; admin is created via DB)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const safeRole = role === 'author' ? 'author' : 'reader';
  const user = await User.create({ name, email, password, role: safeRole });
  const tokens = await issueTokens(user);
  res.status(201).json({ success: true, user: publicUser(user), ...tokens });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password required', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new AppError('Invalid credentials', 401);

  const tokens = await issueTokens(user);
  res.json({ success: true, user: publicUser(user), ...tokens });
});

// POST /api/auth/refresh   body: { refreshToken }
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) throw new AppError('Invalid refresh token', 401);

  const tokens = await issueTokens(user); // rotation
  res.json({ success: true, ...tokens });
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});