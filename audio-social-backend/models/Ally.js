const mongoose = require('mongoose');

const allySchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// 🔐 Prevenir duplicados en la misma dirección (user1 + user2) usando índice único
allySchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Ally', allySchema);
