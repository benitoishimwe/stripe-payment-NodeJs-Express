const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const webhookController = (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
      // Fulfil the order here (e.g. update DB, send confirmation email)
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent failed: ${paymentIntent.id}`);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = webhookController;
