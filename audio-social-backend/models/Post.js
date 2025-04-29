const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true }, // ✅ Solo acepta imagen o video
});

const PostSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  media: [MediaSchema],  // ✅ Aceptamos un array de objetos `{ url, type }`
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  postType: { 
    type: String, 
    enum: ['general', 'community'], 
    default: 'general',
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', PostSchema);

