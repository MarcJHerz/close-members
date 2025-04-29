const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const Post = require('../models/Post');
const Community = require('../models/Community');
const verifyToken = require('../middleware/authMiddleware');
const Ally = require('../models/Ally');


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
    const postType = communityId ? 'community' : 'general';

    const newPost = new Post({
      community: communityId,
      user: req.userId,
      text: text?.trim() || '',
      postType: postType,
      media: req.file
        ? [{
            url: req.file.path.replace(/\\/g, '/'),
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
router.get('/:postId', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Buscando post con ID:', req.params.postId);
    
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username profilePicture'
        }
      });

    if (!post) {
      console.log('❌ Post no encontrado');
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Procesar la imagen de perfil del usuario
    if (post.user && post.user.profilePicture) {
      post.user.profilePicture = post.user.profilePicture.startsWith('http') 
        ? post.user.profilePicture 
        : `${process.env.BASE_URL}/${post.user.profilePicture}`;
    }

    // Procesar imágenes de perfil en los comentarios
    if (post.comments && post.comments.length > 0) {
      post.comments = post.comments.map(comment => {
        if (comment.user && comment.user.profilePicture) {
          comment.user.profilePicture = comment.user.profilePicture.startsWith('http')
            ? comment.user.profilePicture
            : `${process.env.BASE_URL}/${comment.user.profilePicture}`;
        }
        return comment;
      });
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
      return res.status(404).json({ 
        error: 'Post no encontrado',
        details: { postId: 'El post no existe' }
      });
    }

    // Verificar si el usuario ya dio like
    if (post.likes.includes(req.userId)) {
      return res.status(400).json({ 
        error: 'Like ya existe',
        details: { userId: 'Ya has dado like a este post' }
      });
    }

    // Agregar el like
    post.likes.push(req.userId);
    await post.save();

    res.json({ 
      message: 'Like agregado con éxito',
      likes: post.likes.length,
      isLiked: true
    });
  } catch (error) {
    console.error('❌ Error al dar like:', error);
    res.status(500).json({ 
      error: 'Error al dar like',
      message: error.message 
    });
  }
});

// ✅ Quitar like de un post
router.post('/:postId/unlike', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ 
        error: 'Post no encontrado',
        details: { postId: 'El post no existe' }
      });
    }

    // Verificar si el usuario no ha dado like
    if (!post.likes.includes(req.userId)) {
      return res.status(400).json({ 
        error: 'Like no existe',
        details: { userId: 'No has dado like a este post' }
      });
    }

    // Quitar el like
    post.likes = post.likes.filter(id => !id.equals(req.userId));
    await post.save();

    res.json({ 
      message: 'Like eliminado con éxito',
      likes: post.likes.length,
      isLiked: false
    });
  } catch (error) {
    console.error('❌ Error al quitar like:', error);
    res.status(500).json({ 
      error: 'Error al quitar like',
      message: error.message 
    });
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
    const allies = await Ally.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    }).populate('user1', '_id').populate('user2', '_id');

    // Obtener IDs de todos los aliados
    const allyIds = allies.map(a => {
      return a.user1._id.toString() === userId.toString() 
        ? a.user2._id.toString() 
        : a.user1._id.toString();
    });

    // Incluir también al usuario actual en el feed
    const allUserIds = [...allyIds, userId];

    const posts = await Post.find({
      user: { $in: allUserIds }
    })
      .populate('user', 'name profilePicture')
      .populate('community', 'name')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('❌ Error al obtener feed de aliados:', error);
    res.status(500).json({ error: 'Error al obtener feed' });
  }
});

// 📌 Obtener posts para el HomeScreen (posts generales y de comunidad)
router.get('/home/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Obtener todas las comunidades del usuario
    const userCommunities = await Community.find({ members: userId });
    const communityIds = userCommunities.map(c => c._id);

    // 2. Obtener aliados del usuario
    const allies = await Ally.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    });

    // 3. Obtener IDs de todos los aliados
    const allyIds = allies.map(a => {
      return a.user1.toString() === userId 
        ? a.user2.toString() 
        : a.user1.toString();
    });

    // 4. Obtener posts de aliados y de comunidades
    const posts = await Post.find({
      $or: [
        // Posts generales de aliados
        {
          user: { $in: [...allyIds, userId] }, // Incluir posts del usuario actual
          postType: 'general'
        },
        // Posts de comunidades a las que pertenece el usuario
        {
          community: { $in: communityIds },
          postType: 'community'
        }
      ]
    })
    .populate('user', 'name username profilePicture')
    .populate('community', 'name coverImage')
    .sort({ createdAt: -1 });

    // 5. Procesar los posts para incluir URLs completas
    const processedPosts = posts.map(post => {
      const processedPost = post.toObject();
      
      // Procesar imagen de perfil del usuario
      if (processedPost.user && processedPost.user.profilePicture) {
        processedPost.user.profilePicture = processedPost.user.profilePicture.startsWith('http')
          ? processedPost.user.profilePicture
          : `${process.env.BASE_URL}/${processedPost.user.profilePicture}`;
      }

      // Procesar imagen de portada de la comunidad si existe
      if (processedPost.community && processedPost.community.coverImage) {
        processedPost.community.coverImage = processedPost.community.coverImage.startsWith('http')
          ? processedPost.community.coverImage
          : `${process.env.BASE_URL}/${processedPost.community.coverImage}`;
      }

      return processedPost;
    });

    res.json(processedPosts);
  } catch (error) {
    console.error('❌ Error al obtener posts para HomeScreen:', error);
    res.status(500).json({ 
      error: 'Error al obtener los posts',
      details: error.message 
    });
  }
});

module.exports = router;
