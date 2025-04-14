const express = require('express');
const router = express.Router();
const Ally = require('../models/Ally');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// 🔹 Obtener mis aliados
router.get('/my-allies', verifyToken, async (req, res) => {
  try {
    const allies = await Ally.find({
      $or: [
        { user1: req.userId },
        { user2: req.userId }
      ]
    })
    .populate('user1', 'name username profilePicture bio category')
    .populate('user2', 'name username profilePicture bio category');
    
    const formattedAllies = allies.map(a => {
      const allyUser = a.user1._id.toString() === req.userId.toString() ? a.user2 : a.user1;
      return {
        _id: allyUser._id,
        name: allyUser.name,
        username: allyUser.username,
        profilePicture: allyUser.profilePicture,
        bio: allyUser.bio,
        category: allyUser.category
      };
    });

    res.json({
      message: 'Aliados obtenidos con éxito',
      allies: formattedAllies
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

// 🔹 Crear aliados automáticamente entre todos los usuarios
router.post('/create-all-allies', verifyToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({}, '_id');
    
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const user1 = users[i];
        const user2 = users[j];
        
        // Verificar si ya son aliados
        const existingAlly = await Ally.findOne({
          $or: [
            { user1: user1._id, user2: user2._id },
            { user1: user2._id, user2: user1._id }
          ]
        });

        if (!existingAlly) {
          // Crear relación de aliados
          await new Ally({
            user1: user1._id,
            user2: user2._id
          }).save();
          console.log(`✅ Relación de aliados creada entre ${user1._id} y ${user2._id}`);
        }
      }
    }

    res.json({ message: 'Relaciones de aliados creadas exitosamente' });
  } catch (error) {
    console.error('Error al crear aliados automáticamente:', error);
    res.status(500).json({ error: 'Error al crear aliados automáticamente' });
  }
});

module.exports = router;
