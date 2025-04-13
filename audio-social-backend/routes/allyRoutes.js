const express = require('express');
const router = express.Router();
const Ally = require('../models/Ally');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// 🔹 Obtener mis aliados
router.get('/my-allies', verifyToken, async (req, res) => {
  try {
    const allies = await Ally.find({ user1: req.userId })
      .populate('user2', 'name username profilePicture bio category');
    
    res.json({
      message: 'Aliados obtenidos con éxito',
      allies: allies.map(a => ({
        _id: a.user2._id,
        name: a.user2.name,
        username: a.user2.username,
        profilePicture: a.user2.profilePicture,
        bio: a.user2.bio,
        category: a.user2.category
      }))
    });
  } catch (error) {
    console.error('❌ Error al obtener aliados:', error);
    res.status(500).json({ 
      error: 'Error al obtener aliados',
      message: error.message 
    });
  }
});

// 🔹 Agregar un aliado
router.post('/add-ally', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        details: { userId: 'El ID del usuario es obligatorio' }
      });
    }

    // Verificar que el usuario a agregar existe
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        details: { userId: 'El usuario que intentas agregar no existe' }
      });
    }

    // Verificar que no sea el mismo usuario
    if (userId === req.userId) {
      return res.status(400).json({ 
        error: 'Operación inválida',
        details: { userId: 'No puedes agregarte a ti mismo como aliado' }
      });
    }

    // Verificar que no sean ya aliados
    const existingAlly = await Ally.findOne({
      $or: [
        { user1: req.userId, user2: userId },
        { user1: userId, user2: req.userId }
      ]
    });

    if (existingAlly) {
      return res.status(400).json({ 
        error: 'Aliado existente',
        details: { userId: 'Ya eres aliado de este usuario' }
      });
    }

    // Crear la relación de aliados
    const newAlly = new Ally({
      user1: req.userId,
      user2: userId
    });

    await newAlly.save();

    res.status(201).json({
      message: 'Aliado agregado con éxito',
      ally: {
        _id: userToAdd._id,
        name: userToAdd.name,
        username: userToAdd.username,
        profilePicture: userToAdd.profilePicture
      }
    });
  } catch (error) {
    console.error('❌ Error al agregar aliado:', error);
    
    if (error.code === 11000) { // Error de duplicado
      return res.status(400).json({ 
        error: 'Aliado existente',
        details: { userId: 'Ya eres aliado de este usuario' }
      });
    }

    res.status(500).json({ 
      error: 'Error al agregar aliado',
      message: error.message 
    });
  }
});

// 🔹 Eliminar un aliado
router.delete('/remove-ally/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        details: { userId: 'El ID del usuario es obligatorio' }
      });
    }

    const result = await Ally.findOneAndDelete({
      $or: [
        { user1: req.userId, user2: userId },
        { user1: userId, user2: req.userId }
      ]
    });

    if (!result) {
      return res.status(404).json({ 
        error: 'Aliado no encontrado',
        details: { userId: 'No existe una relación de aliados con este usuario' }
      });
    }

    res.json({
      message: 'Aliado eliminado con éxito'
    });
  } catch (error) {
    console.error('❌ Error al eliminar aliado:', error);
    res.status(500).json({ 
      error: 'Error al eliminar aliado',
      message: error.message 
    });
  }
});

module.exports = router;
