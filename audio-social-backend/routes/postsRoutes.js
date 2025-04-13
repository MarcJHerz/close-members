const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const Post = require('../models/Post');
const Community = require('../models/Community');
const verifyToken = require('../middleware/authMiddleware');


// 📦 Crear carpeta si no existe
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// 📁 Configurar almacenamiento dinámico para imágenes/videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const mimeType = file.mimetype;
    let folder = 'uploads/others';

    if (mimeType.startsWith('image')) folder = 'uploads/images';
    else if (mimeType.startsWith('video')) folder = 'uploads/videos';

    ensureDir(folder); // ✅ Crea la carpeta si no existe
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg'; // agrega extensión si no tiene
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName.endsWith(ext) ? uniqueName : uniqueName + ext);
  }
});

const upload = multer({ storage });


// 📌 Crear un post en una comunidad
router.post('/create', verifyToken, upload.single('media'), async (req, res) => {
  try {
    console.log('📥 Datos recibidos en el backend:');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const { communityId, text } = req.body;

    const newPost = new Post({
      community: communityId,
      user: req.userId,
      text: text?.trim() || '',
      media: req.file
        ? [{
            url: req.file.path.replace(/\\/g, '/'), // para evitar backslashes en Window
            type: req.file.mimetype.startsWith('image') ? 'image' : 'video'
          }]
        : [],
    });

    await newPost.save();
    res.status(201).json({ message: 'Post creado con éxito', post: newPost });
  } catch (error) {
    console.error('❌ Error al crear post:', error);
    res.status(500).json({ error: 'Error al crear el post' });
  }
});



// 📌 Obtener todos los posts de una comunidad
router.get('/community/:communityId', async (req, res) => {
  try {
    const posts = await Post.find({ community: req.params.communityId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('❌ Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
});

// 📌 Obtener un post específico por ID
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name profilePicture')
      .populate('comments');

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.json(post);
  } catch (error) {
    console.error('❌ Error al obtener el post:', error);
    res.status(500).json({ error: 'Error al obtener el post' });
  }
});

// ✅ Obtener publicaciones por usuario
router.get('/user/:userId', async (req, res) => {
  const posts = await Post.find({ user: req.params.userId })
    .populate('community')
    .sort({ createdAt: -1 });

  res.json(posts);
});


// 📌 Dar "like" a un post
router.post('/:postId/like', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const userId = req.userId;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ message: 'Like actualizado', likes: post.likes.length });
  } catch (error) {
    console.error('❌ Error al dar like:', error);
    res.status(500).json({ error: 'Error al dar like al post' });
  }
});

// 📌 Eliminar un post (solo el creador puede hacerlo)
router.delete('/:postId', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post eliminado con éxito' });
  } catch (error) {
    console.error('❌ Error al eliminar post:', error);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
});

//Editar un post
// ✅ Actualizar un post (solo el autor puede hacerlo)
router.put('/:id/update', verifyToken, upload.single('media'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });

    // Verifica que el usuario que edita sea el autor del post
    if (!post.user.equals(req.userId)) {
      return res.status(403).json({ error: 'No tienes permiso para editar este post' });
    }

    // Actualiza el texto si llega
    if (req.body.text) post.text = req.body.text;

    // Si llega una nueva imagen
    if (req.file) {
      post.media = [{
        url: req.file.path.replace(/\\/g, '/'),
        type: 'image'
      }];
    }

    await post.save();
    res.json({ message: 'Post actualizado con éxito', post });
  } catch (error) {
    console.error('❌ Error al actualizar el post:', error);
    res.status(500).json({ error: 'Error al actualizar el post' });
  }
});

router.get('/feed/alliances', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Obtener aliados del usuario autenticado
    const allies = await require('../models/Ally').find({ user1: userId }).populate('user2', '_id');
    const allyIds = allies.map(a => a.user2._id.toString());

    // Incluir también al usuario actual en el feed
    const allUserIds = [...allyIds, userId];

    const posts = await Post.find({
      user: { $in: allUserIds },
      community: null, // Solo publicaciones generales
    })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('❌ Error al obtener feed de aliados:', error);
    res.status(500).json({ error: 'Error al obtener feed' });
  }
});



module.exports = router;
