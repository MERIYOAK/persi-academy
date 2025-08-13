let stripe, createCheckoutSession, verifyWebhook;

if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  createCheckoutSession = async ({ user, course, successUrl, cancelUrl }) => {
    return await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(course.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user._id.toString(),
        courseId: course._id.toString(),
      },
    });
  };

  verifyWebhook = (req) => {
    const sig = req.headers['stripe-signature'];
    return stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  };
} else {
  // Development stub: no Stripe key present
  stripe = null;
  createCheckoutSession = async ({ user, course, successUrl, cancelUrl }) => {
    // Simulate a Stripe session object
    return {
      id: 'dev_session_id',
      url: successUrl || 'http://localhost:5173/checkout/success',
    };
  };
  verifyWebhook = (req) => ({ type: 'checkout.session.completed', data: { object: { id: 'dev_session_id', metadata: { userId: 'dev', courseId: 'dev' } } } });
}

module.exports = { stripe, createCheckoutSession, verifyWebhook }; 