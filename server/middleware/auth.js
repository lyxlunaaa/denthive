const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

async function attachCurrentUser(req, res, next) {
  // Optional: if Authorization header exists, attach decoded user
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return next();

    const token = auth.slice('Bearer '.length);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id role username displayId').lean();
    if (!user) return next();

    req.currentUser = user;
  } catch {
    // ignore
  }
  next();
}

function requireAuth(roles = []) {
  return (req, res, next) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
      }

      const token = auth.slice('Bearer '.length);
      const payload = jwt.verify(token, JWT_SECRET);

      req.user = payload; // { sub, role }

      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

module.exports = {
  signToken,
  requireAuth,
  attachCurrentUser
};

