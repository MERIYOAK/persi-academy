let stripe, createCheckoutSession, verifyWebhook;

if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  createCheckoutSession = async ({ user, course, successUrl, cancelUrl }) => {
    try {
      console.log('🔧 Creating Stripe checkout session...');
      console.log(`   - User: ${user.email}`);
      console.log(`   - Course: ${course.title} ($${course.price})`);
      console.log(`   - Success URL: ${successUrl}`);
      console.log(`   - Cancel URL: ${cancelUrl}`);

      // Get user ID from token (handle both userId and _id formats)
      const userId = user.userId || user._id;
      const courseId = course._id;

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!courseId) {
        throw new Error('Course ID is required');
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description: course.description || 'Educational course',
                images: course.thumbnailURL ? [course.thumbnailURL] : [],
              },
              unit_amount: Math.round(course.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId.toString(),
          courseId: courseId.toString(),
          userEmail: user.email,
        },
        // Add billing address collection for better fraud prevention
        billing_address_collection: 'required',
        // Add customer creation for future reference
        customer_creation: 'always',
      });

      console.log('✅ Stripe session created successfully');
      console.log(`   - Session ID: ${session.id}`);
      console.log(`   - Checkout URL: ${session.url}`);

      return session;
    } catch (error) {
      console.error('❌ Error creating Stripe session:', error);
      throw error;
    }
  };

  verifyWebhook = (req) => {
    try {
      const sig = req.headers['stripe-signature'];
      
      // In development mode, bypass signature verification
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode - bypassing signature verification');
        
        // Parse the body as JSON
        let eventData;
        try {
          const body = req.body;
          if (Buffer.isBuffer(body)) {
            const bodyString = body.toString();
            console.log('🔍 Parsed body string:', bodyString);
            eventData = JSON.parse(bodyString);
          } else if (typeof body === 'string') {
            eventData = JSON.parse(body);
          } else if (typeof body === 'object' && body !== null) {
            eventData = body;
          } else {
            throw new Error('Unknown body type: ' + typeof body);
          }
          
          console.log('✅ Parsed webhook data:', eventData.type);
          console.log('✅ Webhook metadata:', eventData.data?.object?.metadata);
          return eventData;
        } catch (parseError) {
          console.log('⚠️  Could not parse webhook body:', parseError.message);
          console.log('⚠️  Creating fallback event with actual request data');
          
          // Use the actual request body if available
          const actualBody = req.body;
          console.log('🔍 Actual request body:', actualBody);
          
          return {
            type: 'checkout.session.completed',
            id: `dev_webhook_${Date.now()}`,
            data: {
              object: {
                id: `dev_session_${Date.now()}`,
                metadata: actualBody?.data?.object?.metadata || {
                  userId: 'dev_user',
                  courseId: 'dev_course',
                  userEmail: 'dev@example.com'
                }
              }
            }
          };
        }
      }
      
      // Production mode verification
      if (!sig) {
        throw new Error('No Stripe signature found');
      }
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
      }

      console.log('🔧 Verifying Stripe webhook signature...');
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log('✅ Webhook signature verified');
      console.log(`   - Event type: ${event.type}`);
      console.log(`   - Event ID: ${event.id}`);
      
      return event;
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      throw error;
    }
  };
} else {
  // Development stub: no Stripe key present
  console.log('⚠️  Stripe not configured - using development mode');
  stripe = null;
  
  createCheckoutSession = async ({ user, course, successUrl, cancelUrl }) => {
    console.log('🔧 Creating development checkout session...');
    console.log(`   - User: ${user.email}`);
    console.log(`   - Course: ${course.title} ($${course.price})`);
    
    // Get user ID from token (handle both userId and _id formats)
    const userId = user.userId || user._id;
    const courseId = course._id;

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!courseId) {
      throw new Error('Course ID is required');
    }
    
    // Simulate a Stripe session object
    const session = {
      id: `dev_session_${Date.now()}`,
      url: successUrl || 'http://localhost:5173/checkout/success',
      metadata: {
        userId: userId.toString(),
        courseId: courseId.toString(),
        userEmail: user.email,
      }
    };
    
    console.log('✅ Development session created');
    console.log(`   - Session ID: ${session.id}`);
    console.log(`   - Redirect URL: ${session.url}`);
    
    return session;
  };
  
  verifyWebhook = (req) => {
    console.log('🔧 Development webhook verification (bypassing signature check)');
    
    // Try to parse the webhook body
    let eventData;
    try {
      // The body should be available from express.raw() middleware
      const body = req.body;
      console.log('🔍 Webhook body type:', typeof body);
      console.log('🔍 Webhook body length:', body ? body.length : 'No body');
      
      if (Buffer.isBuffer(body)) {
        const bodyString = body.toString();
        console.log('🔍 Parsed body string:', bodyString);
        eventData = JSON.parse(bodyString);
      } else if (typeof body === 'string') {
        eventData = JSON.parse(body);
      } else if (typeof body === 'object' && body !== null) {
        eventData = body;
      } else {
        throw new Error('Unknown body type: ' + typeof body);
      }
      
      console.log('✅ Parsed webhook data:', eventData.type);
      console.log('✅ Webhook metadata:', eventData.data?.object?.metadata);
      return eventData;
    } catch (parseError) {
      console.log('⚠️  Could not parse webhook body:', parseError.message);
      console.log('⚠️  Creating fallback event with actual request data');
      
      // Use the actual request body if available
      const actualBody = req.body;
      console.log('🔍 Actual request body:', actualBody);
      
      return {
        type: 'checkout.session.completed',
        id: `dev_webhook_${Date.now()}`,
        data: {
          object: {
            id: `dev_session_${Date.now()}`,
            metadata: actualBody?.data?.object?.metadata || {
              userId: 'dev_user',
              courseId: 'dev_course',
              userEmail: 'dev@example.com'
            }
          }
        }
      };
    }
  };
}

module.exports = { stripe, createCheckoutSession, verifyWebhook }; 