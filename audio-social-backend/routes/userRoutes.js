const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const verifyToken = require('../middleware/authMiddleware'); // Add this line to import verifyToken

// 📌 Asegurar que las carpetas de imágenes existen
const profilePicturesPath = 'uploads/profile_pictures/';
const bannerImagesPath = 'uploads/banners/';

if (!fs.existsSync(profilePicturesPath)) {
  fs.mkdirSync(profilePicturesPath, { recursive: true });
}
if (!fs.existsSync(bannerImagesPath)) {
  fs.mkdirSync(bannerImagesPath, { recursive: true });
}

// 📌 Configurar `multer` para imágenes de perfil y banner
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = profilePicturesPath;
    if (req.url.includes('/profile/banner')) {
      folder = bannerImagesPath;
    } else if (req.url.includes('/profile/upload-image')) {
      // For the new upload-image endpoint, store in a dedicated folder
      const uploadFolder = 'uploads/profile_content';
      if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
      }
      folder = uploadFolder;
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ✅ Ruta para subir imágenes de perfil y banner (evita duplicados)
router.put('/profile/photo', upload.single('profilePicture'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado. Token faltante.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen.' });

    const profilePicturePath = `uploads/profile_pictures/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, { profilePicture: profilePicturePath }, { new: true });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ message: 'Foto de perfil actualizada', profilePicture: `http://192.168.1.87:5000/${profilePicturePath}` });
  } catch (error) {
    console.error('❌ Error al actualizar la foto de perfil:', error);
    res.status(500).json({ error: 'Error al actualizar la foto de perfil' });
  }
});

router.put('/profile/banner', upload.single('bannerImage'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado. Token faltante.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen.' });

    const bannerImagePath = `uploads/banners/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(userId, { bannerImage: bannerImagePath }, { new: true });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ message: 'Banner actualizado con éxito', bannerImage: `http://192.168.1.87:5000/${bannerImagePath}` });
  } catch (error) {
    console.error('❌ Error al actualizar el banner:', error);
    res.status(500).json({ error: 'Error al actualizar el banner' });
  }
});

// ✅ Ruta para obtener el perfil del usuario autenticado
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No autorizado. Token faltante.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture?.startsWith('http') ? user.profilePicture : `http://192.168.1.87:5000/${user.profilePicture}`,
      bannerImage: user.bannerImage?.startsWith('http') ? user.bannerImage : `http://192.168.1.87:5000/${user.bannerImage}`,
      bio: user.bio || '',
      category: user.category || '',
      links: user.links || [],
      profileBlocks: user.profileBlocks || [], // Make sure to include profileBlocks
      subscriptionPrice: user.subscriptionPrice ?? 0,
    });
  } catch (error) {
    console.error('❌ Error al obtener el perfil:', error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// ✅ Ruta para obtener el perfil de cualquier usuario
router.get('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el userId en la solicitud.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture?.startsWith('http') ? user.profilePicture : `http://192.168.1.87:5000/${user.profilePicture}`,
      bannerImage: user.bannerImage?.startsWith('http') ? user.bannerImage : `http://192.168.1.87:5000/${user.bannerImage}`,      
      bio: user.bio || '',
      category: user.category || '',
      links: user.links || [],
      profileBlocks: user.profileBlocks || [],
      subscriptionPrice: user.subscriptionPrice ?? 0
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil de usuario:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    res.status(500).json({ error: 'Error al obtener perfil de usuario' });
  }
});

// ✅ Ruta para actualizar datos de perfil
router.put('/profile/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado. Token faltante.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { username, bio, profilePicture, bannerImage, category, links, subscriptionPrice } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // ✅ Actualizar solo si hay datos nuevos
    if (username) user.username = username;
    if (bio) user.bio = bio;  // ✅ Asegurar que la bio se actualiza correctamente
    if (profilePicture) user.profilePicture = profilePicture;
    if (bannerImage) user.bannerImage = bannerImage;
    if (category) user.category = category;
    if (links) user.links = Array.isArray(links) ? links : links.split(',').map(link => link.trim());
    if (subscriptionPrice !== undefined) user.subscriptionPrice = subscriptionPrice;

    await user.save();
    res.json({ message: 'Perfil actualizado con éxito', user });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// 📌 Ruta para obtener usuarios recomendados
router.get('/recommended', async (req, res) => {
  try {
    const users = await User.find().limit(10).select('_id name profilePicture bio');
    res.json(users);
  } catch (error) {
    console.error('❌ Error al obtener usuarios recomendados:', error);
    res.status(500).json({ error: 'Error al obtener usuarios recomendados' });
  }
});

// 📌 Ruta para buscar usuarios por nombre o username
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'La consulta de búsqueda no puede estar vacía.' });
  }

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } }, // 🔹 Buscar en el nombre
        { username: { $regex: query, $options: 'i' } } // 🔹 Buscar en el username
      ]
    }).select('_id name username profilePicture');

    res.json(users);
  } catch (error) {
    console.error('❌ Error en la búsqueda de usuarios:', error);
    res.status(500).json({ error: 'Error en la búsqueda de usuarios' });
  }
});

router.put('/profile/blocks', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado. Token faltante.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { profileBlocks } = req.body;

    // Validate that profileBlocks is an array
    if (!Array.isArray(profileBlocks)) {
      return res.status(400).json({ error: 'profileBlocks debe ser un array' });
    }

    // Use findByIdAndUpdate instead of save() to avoid full validation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileBlocks: profileBlocks },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Perfil actualizado con éxito', profileBlocks });
  } catch (error) {
    console.error('❌ Error al actualizar los bloques del perfil:', error);
    res.status(500).json({ error: 'Error al actualizar los bloques del perfil' });
  }
});

router.post('/profile/upload-image', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen.' });
    }

    // Get the path of the uploaded image
    const imagePath = req.file.path.replace(/\\/g, '/');
    
    // Return the URL of the uploaded image
    const imageUrl = `http://192.168.1.87:5000/${imagePath}`;
    
    res.json({ 
      message: 'Imagen subida con éxito',
      url: imageUrl
    });
  } catch (error) {
    console.error('❌ Error al subir imagen:', error);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

module.exports = router;