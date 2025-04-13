const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'No autorizado',
        details: { token: 'Token no proporcionado' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('❌ Error al verificar el token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        details: { token: 'El token proporcionado no es válido' }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        details: { token: 'El token ha expirado' }
      });
    }

    return res.status(500).json({ 
      error: 'Error al verificar autenticación',
      message: error.message 
    });
  }
};

module.exports = verifyToken;
