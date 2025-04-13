const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, // Post al que pertenece el comentario
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Usuario que hizo el comentario
  text: { type: String, required: true }, // Contenido del comentario
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Usuarios que dieron like al comentario
  createdAt: { type: Date, default: Date.now }, // Fecha de creación
});

module.exports = mongoose.model('Comment', CommentSchema);
