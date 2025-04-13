const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Conexión exitosa a MongoDB');
        mongoose.connection.close(); // Cierra la conexión
    })
    .catch(err => {
        console.error('Error al conectar a MongoDB:', err.message);
    });
