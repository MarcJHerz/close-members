const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Community = require('../models/Community');
const verifyToken = require('../middleware/authMiddleware');
const Ally = require('../models/Ally');

// 📁 Crear carpeta si no existe
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// 📷 Configuración de multer para imágenes de portada
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = 'uploads/banners';
    ensureDir(folder);
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName.endsWith(ext) ? uniqueName : uniqueName + ext);
  }
});

const upload = multer({ storage });

// ✅ Crear una nueva comunidad
router.post('/create', verifyToken, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const creatorId = req.userId;

    console.log('🧾 Datos recibidos:', name, description);
    console.log('📸 Imagen recibida:', req.file);

    if (!name || !description) {
      return res.status(400).json({ error: 'Nombre y descripción son obligatorios' });
    }

    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ error: 'El nombre de la comunidad ya está en uso.' });
    }

    const newCommunity = new Community({
      name,
      description,
      coverImage: req.file ? req.file.path.replace(/\\/g, '/') : undefined,
      creator: creatorId,
      members: [creatorId],
    });

    await newCommunity.save();
    res.status(201).json({ message: 'Comunidad creada con éxito', community: newCommunity });
  } catch (error) {
    console.error('❌ Error al crear la comunidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🧠 Otras rutas quedan iguales (obtener, unirse, salir, eliminar)
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find()
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture');
    res.json(communities);
  } catch (error) {
    console.error('❌ Error al obtener comunidades:', error);
    res.status(500).json({ error: 'Error al obtener comunidades' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture');
    if (!community) return res.status(404).json({ error: 'Comunidad no encontrada' });
    res.json(community);
  } catch (error) {
    console.error('❌ Error al obtener la comunidad:', error);
    res.status(500).json({ error: 'Error al obtener la comunidad' });
  }
});

// ✅ Obtener comunidades creadas por usuario
router.get('/created-by/:userId', async (req, res) => {
  const communities = await Community.find({ creator: req.params.userId });
  res.json(communities);
});


router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Comunidad no encontrada' });

    if (!community.members.includes(req.userId)) {
      community.members.push(req.userId);
      await community.save();
    }

    for (const memberId of community.members) {
      if (memberId.toString() !== req.userId) {
        await Ally.updateOne(
          { user1: req.userId, user2: memberId },
          { user1: req.userId, user2: memberId },
          { upsert: true }
        );
        await Ally.updateOne(
          { user1: memberId, user2: req.userId },
          { user1: memberId, user2: req.userId },
          { upsert: true }
        );
      }
    }

    res.json({ message: 'Te has unido a la comunidad', community });
  } catch (error) {
    console.error('❌ Error al unirse a la comunidad:', error);
    res.status(500).json({ error: 'Error al unirse a la comunidad' });
  }
});

router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Comunidad no encontrada' });

    community.members = community.members.filter((memberId) => !memberId.equals(req.userId));
    await community.save();

    res.json({ message: 'Has salido de la comunidad', community });
  } catch (error) {
    console.error('❌ Error al salir de la comunidad:', error);
    res.status(500).json({ error: 'Error al salir de la comunidad' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Comunidad no encontrada' });

    if (!community.creator.equals(req.userId)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta comunidad' });
    }

    await Community.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comunidad eliminada con éxito' });
  } catch (error) {
    console.error('❌ Error al eliminar la comunidad:', error);
    res.status(500).json({ error: 'Error al eliminar la comunidad' });
  }
});

// ✅ Actualizar comunidad (solo el creador puede)
router.put('/:id/update', verifyToken, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (!community.creator.equals(req.userId)) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta comunidad' });
    }

    if (name) community.name = name;
    if (description) community.description = description;

    if (req.file) {
      community.coverImage = req.file.path.replace(/\\/g, '/'); // normaliza para Windows
    }

    await community.save();
    res.json({ message: 'Comunidad actualizada con éxito', community });
  } catch (error) {
    console.error('❌ Error al actualizar comunidad:', error);
    res.status(500).json({ error: 'Error al actualizar la comunidad' });
  }
});


module.exports = router;
