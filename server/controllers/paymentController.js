const { createCheckoutSession, stripe, verifyWebhook } = require('../utils/stripe');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // If Stripe is not configured, mark as purchased immediately
    if (!stripe) {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { purchasedCourses: course._id } });
      await Transaction.create({
        userId: req.user._id,
        courseId: course._id,
        amount: course.price,
        stripeSessionId: 'dev_session_id',
        status: 'completed',
      });
      return res.json({ url: `${process.env.CLIENT_URL}/checkout/success` });
    }
    const session = await createCheckoutSession({
      user: req.user,
      course,
      successUrl: `${process.env.CLIENT_URL}/checkout/success`,
      cancelUrl: `${process.env.CLIENT_URL}/checkout/cancel`,
    });
    // Save transaction
    await Transaction.create({
      userId: req.user._id,
      courseId: course._id,
      amount: course.price,
      stripeSessionId: session.id,
      status: 'pending',
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: 'Stripe session failed', error: err.message });
  }
};

exports.webhook = async (req, res) => {
  // In development, just return success
  if (!stripe) return res.json({ received: true });
  let event;
  try {
    event = verifyWebhook(req);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const courseId = session.metadata.courseId;
    // Mark transaction as completed
    await Transaction.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: 'completed' }
    );
    // Add course to user's purchasedCourses
    await User.findByIdAndUpdate(userId, { $addToSet: { purchasedCourses: courseId } });
  }
  res.json({ received: true });
};

exports.success = (req, res) => {
  res.json({ message: 'Payment successful' });
};

exports.cancel = (req, res) => {
  res.json({ message: 'Payment cancelled' });
}; 