const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'El nombre es obligatorio.'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres.']
  }, 
  username: { 
    type: String, 
    required: [true, 'El nombre de usuario es obligatorio.'],
    unique: true, 
    lowercase: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres.'],
    match: [/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos.']
  },
  email: { 
    type: String, 
    required: [true, 'El correo es obligatorio.'],
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Por favor ingresa un email válido.']
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria.'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres.']
  },
  profilePicture: { 
    type: String, 
    default: 'https://miro.medium.com/v2/resize:fit:1400/format:webp/0*0JcYeLzvORp67c6w.jpg'
  },
  bannerImage: { 
    type: String, 
    default: 'https://cdn.venngage.com/template/thumbnail/small/47096c29-b33e-4950-a7ba-aa7ac4215872.webp'
  },
  bio: { 
    type: String, 
    default: '',
    maxlength: [500, 'La biografía no puede exceder los 500 caracteres.']
  },
  category: { 
    type: String, 
    default: '',
    enum: ['', 'Música', 'Arte', 'Deportes', 'Tecnología', 'Educación', 'Entretenimiento', 'Otro']
  },
  links: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} no es una URL válida!`
    }
  }],
  subscriptionPrice: { 
    type: Number, 
    default: 0,
    min: [0, 'El precio de suscripción no puede ser negativo.']
  },
  profileBlocks: [{
    type: {
      type: String,
      enum: ['text', 'image', 'gallery', 'video', 'link', 'embed', 'social', 'quote', 'button'],
      required: true
    },
    content: mongoose.Schema.Types.Mixed,
    position: { type: Number, default: 0 },
    styles: { type: mongoose.Schema.Types.Mixed, default: {} }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Hashear la contraseña antes de guardar el usuario
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();

    // Validar que todos los campos estén presentes antes de guardar
    if (!this.name || !this.username || !this.email || !this.password) {
      throw new Error('Todos los campos son obligatorios (nombre, nombre de usuario, correo y contraseña).');
    }

    // Verificar si el username ya existe
    const existingUser = await this.constructor.findOne({ username: this.username });
    if (existingUser && existingUser._id.toString() !== this._id.toString()) {
      throw new Error('El nombre de usuario ya está en uso.');
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Método para actualizar lastLogin
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.save();
};

// Profile Blocks


const User = mongoose.model('User', userSchema);
module.exports = User;
