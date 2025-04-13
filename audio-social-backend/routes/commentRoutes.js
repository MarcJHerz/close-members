const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const verifyToken = require('../middleware/authMiddleware');

// ✅ Agregar un comentario
router.post('/:postId', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        details: { content: 'El contenido del comentario es obligatorio' }
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        error: 'Publicación no encontrada',
        details: { postId: 'La publicación no existe' }
      });
    }

    const newComment = new Comment({
      content,
      author: userId,
      post: postId
    });

    await newComment.save();
    post.comments.push(newComment._id);
    await post.save();

    res.status(201).json({ 
      message: 'Comentario agregado con éxito',
      comment: {
        _id: newComment._id,
        content: newComment.content,
        author: newComment.author,
        post: newComment.post,
        likes: newComment.likes,
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error al agregar comentario:', error);
    
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
      error: 'Error al agregar comentario',
      message: error.message 
    });
  }
});

// 🧠 Obtener comentarios de una publicación
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Comentarios obtenidos con éxito',
      comments: comments.map(comment => ({
        _id: comment._id,
        content: comment.content,
        author: comment.author,
        post: comment.post,
        likes: comment.likes,
        createdAt: comment.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener comentarios',
      message: error.message 
    });
  }
});

// ✅ Dar like a un comentario
router.post('/:commentId/like', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comentario no encontrado',
        details: { commentId: 'El comentario no existe' }
      });
    }

    if (comment.likes.includes(req.userId)) {
      return res.status(400).json({ 
        error: 'Like ya existe',
        details: { userId: 'Ya has dado like a este comentario' }
      });
    }

    comment.likes.push(req.userId);
    await comment.save();

    res.json({ 
      message: 'Like agregado con éxito',
      comment: {
        _id: comment._id,
        likes: comment.likes
      }
    });
  } catch (error) {
    console.error('❌ Error al dar like:', error);
    res.status(500).json({ 
      error: 'Error al dar like',
      message: error.message 
    });
  }
});

// ✅ Quitar like de un comentario
router.post('/:commentId/unlike', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comentario no encontrado',
        details: { commentId: 'El comentario no existe' }
      });
    }

    if (!comment.likes.includes(req.userId)) {
      return res.status(400).json({ 
        error: 'Like no existe',
        details: { userId: 'No has dado like a este comentario' }
      });
    }

    comment.likes = comment.likes.filter(id => !id.equals(req.userId));
    await comment.save();

    res.json({ 
      message: 'Like eliminado con éxito',
      comment: {
        _id: comment._id,
        likes: comment.likes
      }
    });
  } catch (error) {
    console.error('❌ Error al quitar like:', error);
    res.status(500).json({ 
      error: 'Error al quitar like',
      message: error.message 
    });
  }
});

// ✅ Eliminar un comentario
router.delete('/:commentId', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comentario no encontrado',
        details: { commentId: 'El comentario no existe' }
      });
    }

    if (!comment.author.equals(req.userId)) {
      return res.status(403).json({ 
        error: 'No autorizado',
        details: { userId: 'No tienes permiso para eliminar este comentario' }
      });
    }

    const post = await Post.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(id => !id.equals(comment._id));
      await post.save();
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comentario eliminado con éxito' });
  } catch (error) {
    console.error('❌ Error al eliminar comentario:', error);
    res.status(500).json({ 
      error: 'Error al eliminar comentario',
      message: error.message 
    });
  }
});

module.exports = router;
