const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Community = require('../models/Community');
const verifyToken = require('../middleware/authMiddleware');
const Ally = require('../models/Ally');

// 📌 Suscribirse a una comunidad
router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const { communityId, amount, paymentMethod } = req.body;
    const userId = req.userId;

    // Validar communityId
    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ error: 'ID de comunidad inválido.' });
    }

    // Verificar si la comunidad existe
    const communityExists = await Community.findById(communityId);
    if (!communityExists) {
      return res.status(404).json({ error: 'La comunidad no existe.' });
    }

    // Verificar si el usuario ya está suscrito
    const existingSubscription = await Subscription.findOne({ 
      user: userId, 
      community: communityId, 
      status: 'active' 
    });
    
    if (existingSubscription) {
      return res.status(400).json({ error: 'Ya estás suscrito a esta comunidad.' });
    }

    // Crear nueva suscripción
    const newSubscription = new Subscription({
      user: userId,
      community: communityId,
      amount: amount || 0,
      paymentMethod: paymentMethod || 'manual',
      status: 'active',
      startDate: new Date(),
    });

    await newSubscription.save();
    
    // Añadir usuario como miembro de la comunidad si no lo es ya
    if (!communityExists.members.includes(userId)) {
      communityExists.members.push(userId);
      await communityExists.save();
    }
    
    res.status(201).json({ 
      message: 'Suscripción exitosa', 
      subscription: newSubscription 
    });
  } catch (error) {
    console.error('❌ Error al suscribirse:', error);
    res.status(500).json({ error: 'Error al procesar la suscripción' });
  }
});

// 📌 Cancelar suscripción
router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const userId = req.userId;

    // Buscar la suscripción
    const subscription = await Subscription.findOne({ 
      _id: subscriptionId, 
      user: userId, 
      status: 'active' 
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'No tienes una suscripción activa con este ID.' });
    }

    // Cancelar suscripción
    subscription.status = 'canceled';
    subscription.endDate = new Date();
    await subscription.save();

    // También removemos al usuario de los miembros de la comunidad
    await Community.findByIdAndUpdate(
      subscription.community,
      { $pull: { members: userId } }
    );

    res.json({ 
      message: 'Suscripción cancelada con éxito', 
      subscription 
    });
  } catch (error) {
    console.error('❌ Error al cancelar suscripción:', error);
    res.status(500).json({ error: 'Error al cancelar suscripción' });
  }
});

// 📌 Obtener suscripciones del usuario (todas, activas e inactivas)
router.get('/my-subscriptions', verifyToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.userId })
      .populate('community', 'name description coverImage members creator');

    // Filtramos suscripciones sin comunidad (por si acaso alguna está corrupta)
    const filtered = subscriptions.filter(sub => sub.community !== null);

    res.json(filtered);
  } catch (err) {
    console.error('❌ Error al obtener suscripciones:', err);
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

// 📌 Obtener solamente comunidades activas (suscripciones activas)
// 📌 Obtener solamente comunidades activas (suscripciones activas)
// 📌 Obtener solamente comunidades activas (suscripciones activas)
router.get('/by-user', verifyToken, async (req, res) => {
  try {
    // Obtener todas las suscripciones activas
    const subscriptions = await Subscription.find({
      user: req.userId,
      status: 'active'
    });

    console.log(`🔍 Encontradas ${subscriptions.length} suscripciones activas para el usuario ${req.userId}`);
    
    // Extraer solo los IDs de comunidades
    const communityIds = subscriptions
      .filter(sub => sub.community) // Filtrar casos donde community es null
      .map(sub => sub.community.toString());
    
    if (communityIds.length === 0) {
      console.log('ℹ️ No hay comunidades suscritas activas');
      return res.json([]);
    }
    
    // Buscar las comunidades completas
    const communities = await Community.find({
      _id: { $in: communityIds }
    });
    
    console.log(`✅ Retornando ${communities.length} comunidades activas`);
    
    // Formatear respuesta
    const formattedCommunities = communities.map(community => {
      const formattedCommunity = community.toObject();
      if (formattedCommunity.coverImage && !formattedCommunity.coverImage.startsWith('http')) {
        formattedCommunity.coverImage = `http://192.168.1.87:5000/${formattedCommunity.coverImage.replace(/^\//, '')}`;
      }
      return formattedCommunity;
    });
    
    res.json(formattedCommunities);
  } catch (error) {
    console.error('❌ Error al obtener comunidades suscritas:', error);
    res.status(500).json({ error: 'Error al obtener comunidades suscritas' });
  }
});

// 📌 Unirse a una comunidad (suscripción gratuita)
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.userId;
    
    console.log('📩 Solicitud de suscripción recibida para comunidad:', communityId);
    console.log('👤 Usuario autenticado:', userId);
    
    // Verificar si la comunidad existe
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    
    // Verificar si ya existe una suscripción
    const existing = await Subscription.findOne({
      user: userId,
      community: communityId,
      status: 'active'
    });

    if (existing) {
      return res.status(400).json({ message: 'Ya estás suscrito a esta comunidad' });
    }

    // Crear nueva suscripción
    const subscription = new Subscription({
      user: userId,
      community: communityId,
      startDate: new Date(),
      paymentMethod: 'manual',
      amount: 0,
      status: 'active',
    });

    await subscription.save();
    console.log(`✅ Suscripción creada con éxito: ${subscription._id}`);
    
    // Añadir el usuario como miembro de la comunidad
    if (!community.members.includes(userId)) {
      community.members.push(userId);
      await community.save();
      console.log(`✅ Usuario añadido como miembro de la comunidad`);

      // Crear relaciones de aliados con los miembros existentes
      for (const memberId of community.members) {
        if (memberId.toString() !== userId.toString()) {
          // Verificar si ya son aliados
          const existingAlly = await Ally.findOne({
            $or: [
              { user1: userId, user2: memberId },
              { user1: memberId, user2: userId }
            ]
          });

          if (!existingAlly) {
            // Crear relación de aliados
            await new Ally({
              user1: userId,
              user2: memberId
            }).save();
            console.log(`✅ Relación de aliados creada entre ${userId} y ${memberId}`);
          }
        }
      }
    }

    res.json({ 
      message: 'Te has unido a la comunidad exitosamente', 
      subscription 
    });
  } catch (err) {
    console.error('❌ Error al suscribirse:', err);
    res.status(500).json({ error: 'Error al unirse a la comunidad' });
  }
});

// 📌 Verificar suscripción a una comunidad específica
router.get('/check/:communityId', verifyToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.userId;
    
    const subscription = await Subscription.findOne({
      user: userId,
      community: communityId,
      status: 'active'
    });
    
    res.json({
      isSubscribed: !!subscription,
      subscription: subscription
    });
  } catch (error) {
    console.error('❌ Error al verificar suscripción:', error);
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
});

// 📌 Ruta de diagnóstico para verificar suscripciones
router.get('/debug-subscriptions', verifyToken, async (req, res) => {
  try {
    // Obtener suscripciones con toda la información
    const subscriptions = await Subscription.find({ user: req.userId })
      .populate('community')
      .populate('user', 'name email');
    
    // Información detallada para cada suscripción
    const detailedInfo = subscriptions.map(sub => ({
      subscriptionId: sub._id,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      paymentMethod: sub.paymentMethod,
      user: sub.user ? {
        id: sub.user._id,
        name: sub.user.name,
        email: sub.user.email
      } : 'Usuario no encontrado',
      community: sub.community ? {
        id: sub.community._id,
        name: sub.community.name,
        coverImage: sub.community.coverImage,
        memberCount: sub.community.members?.length || 0
      } : 'Comunidad no encontrada',
    }));
    
    res.json({
      userId: req.userId,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      subscriptions: detailedInfo
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico de suscripciones:', error);
    res.status(500).json({ error: 'Error en diagnóstico de suscripciones' });
  }
});

module.exports = router;