const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'spendwise_development_secret';

function authenticateToken(req, res, next) {
  // Get the token from the request header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    // Attach the user ID to the request so other routes can use it
    req.user = decoded;
    next();
  });
}

module.exports = authenticateToken;