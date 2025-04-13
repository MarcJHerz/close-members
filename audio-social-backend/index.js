const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 5000;

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// ✅ Importar rutas
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const communitiesRoutes = require('./routes/communitiesRoutes');
const subscriptionsRoutes = require('./routes/subscriptionsRoutes');
const postRoutes = require('./routes/postsRoutes');
const commentRoutes = require('./routes/commentRoutes');
const allyRoutes = require('./routes/allyRoutes');



// ✅ Rutas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/allies', allyRoutes);

// ✅ Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// ✅ Conexión a MongoDB (Corrección de opciones)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));


// ✅ Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
