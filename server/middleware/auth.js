const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Protected route: valid access token required
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw new AppError('Not authorized, token missing', 401);

  const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_ACCESS_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
});

// RBAC: authorize('author', 'admin')
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Role '${req.user.role}' is not allowed to access this route`, 403));
  }
  next();
};

// Optional auth: attaches req.user if a valid token is sent, otherwise continues as guest
exports.optionalAuth = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) {
      const d = jwt.verify(h.split(' ')[1], process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(d.id);
    }
  } catch (e) { /* treat as guest */ }
  next();
};