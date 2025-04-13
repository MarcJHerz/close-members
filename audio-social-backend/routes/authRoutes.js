const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// 🔹 Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    
    // Validaciones básicas
    if (!name || !username || !email || !password) {
      return res.status(400).json({ 
        error: 'Todos los campos son obligatorios',
        details: {
          name: !name ? 'El nombre es obligatorio' : null,
          username: !username ? 'El nombre de usuario es obligatorio' : null,
          email: !email ? 'El email es obligatorio' : null,
          password: !password ? 'La contraseña es obligatoria' : null
        }
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email inválido',
        details: { email: 'Por favor ingresa un email válido' }
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Contraseña inválida',
        details: { password: 'La contraseña debe tener al menos 6 caracteres' }
      });
    }

    // Validar si ya existe el usuario por email o username
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      const details = {};
      if (existingUser.email === email) {
        details.email = 'Este email ya está registrado';
      }
      if (existingUser.username === username.toLowerCase()) {
        details.username = 'Este nombre de usuario ya está en uso';
      }
      return res.status(400).json({ 
        error: 'Usuario ya existe',
        details
      });
    }

    // Crear nuevo usuario
    const newUser = new User({ 
      name, 
      username: username.toLowerCase(), 
      email: email.toLowerCase(), 
      password 
    });
    
    await newUser.save();

    // Generar token JWT
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      message: 'Usuario registrado con éxito', 
      token, 
      user: { 
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture
      } 
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const details = {};
      Object.keys(error.errors).forEach(key => {
        details[key] = error.errors[key].message;
      });
      return res.status(400).json({ 
        error: 'Error de validación',
        details
      });
    }

    res.status(500).json({ 
      error: 'Error al registrar usuario',
      message: error.message 
    });
  }
});

// 🔹 Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Credenciales incompletas',
        details: {
          email: !email ? 'El email es obligatorio' : null,
          password: !password ? 'La contraseña es obligatoria' : null
        }
      });
    }

    // Buscar usuario en la base de datos
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ 
        error: 'Credenciales incorrectas',
        details: { email: 'Usuario no encontrado' }
      });
    }

    // Comparar contraseñas
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Credenciales incorrectas',
        details: { password: 'Contraseña incorrecta' }
      });
    }

    // Actualizar último login
    await user.updateLastLogin();

    // Generar token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: 'Inicio de sesión exitoso', 
      token, 
      user: { 
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      } 
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      message: error.message 
    });
  }
});

// 🔹 Verificar usuario autenticado
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'No autorizado',
        details: { token: 'Token no proporcionado' }
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        details: { user: 'El usuario asociado al token no existe' }
      });
    }

    res.json({ 
      user: { 
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        category: user.category,
        links: user.links,
        subscriptionPrice: user.subscriptionPrice
      } 
    });
  } catch (error) {
    console.error('❌ Error al verificar usuario:', error);
    
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

    res.status(500).json({ 
      error: 'Error al verificar usuario',
      message: error.message 
    });
  }
});

module.exports = router;
