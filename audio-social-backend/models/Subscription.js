const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Usuario que paga la suscripción
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true }, // Comunidad suscrita
  status: { 
    type: String, 
    enum: ['active', 'canceled', 'expired'], 
    default: 'active' 
  }, // Estado de la suscripción
  startDate: { type: Date, default: Date.now }, // Fecha de inicio
  endDate: { type: Date }, // Fecha de expiración (si aplica)
  paymentMethod: { type: String, default: 'stripe' }, // Método de pago (Stripe, PayPal, etc.)
  amount: { type: Number, required: true }, // Precio pagado
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
