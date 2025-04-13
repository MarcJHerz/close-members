//const mongoose = require('mongoose');
//const dotenv = require('dotenv');
//const Community = require('./models/Community');
//const User = require('./models/User'); // Importar modelo de usuario

//dotenv.config();

// 📌 Conectar a MongoDB
//mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  //.then(async () => {
    //console.log('✅ Conectado a MongoDB');

    // 🔹 Eliminar datos previos para evitar duplicados
    //await Community.deleteMany();
    //await User.deleteMany();

    // 🔹 Crear usuario de prueba (ahora con `username`)
    //const testUser = new User({
      //name: 'Admin',
      //username: 'adminuser', // ✅ Se agregó `username`
      //email: 'admin@example.com',
      //password: 'admin123' // NOTA: En producción, usa hash bcrypt
    //});

    //await testUser.save();
    //console.log('👤 Usuario de prueba creado:', testUser);

    // 🔹 Insertar comunidades con `creator` definido
    //await Community.insertMany([
      //{ name: 'Desarrollo Web', description: 'Comunidad para aprender desarrollo web', coverImage: 'https://via.placeholder.com/300', creator: testUser._id },
      //{ name: 'Programación en Python', description: 'Grupo para compartir proyectos en Python', coverImage: 'https://via.placeholder.com/300', creator: testUser._id },
      //{ name: 'Emprendedores Tech', description: 'Comunidad de emprendedores tecnológicos', coverImage: 'https://via.placeholder.com/300', creator: testUser._id }
    //]);

    //console.log('🎉 Comunidades agregadas a MongoDB');
    //mongoose.connection.close(); // Cierra la conexión después de insertar los datos
  //})
  //.catch(err => {
    //console.error('❌ Error:', err);
  //});
