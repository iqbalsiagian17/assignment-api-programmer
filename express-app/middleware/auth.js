const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 108,
        message: 'Token tidak tidak valid atau kadaluwarsa',
        data: null
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userEmail = decoded.email;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    return res.status(401).json({
      status: 108,
      message: 'Token tidak tidak valid atau kadaluwarsa',
      data: null
    });
  }
};

module.exports = authMiddleware;