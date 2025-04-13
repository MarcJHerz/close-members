const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  coverImage: { type: String, default: '' }, // Imagen de portada
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Dueño de la comunidad
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Miembros de la comunidad
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Community', CommunitySchema);
