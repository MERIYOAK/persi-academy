const { createCheckoutSession, stripe, verifyWebhook } = require('../utils/stripe');
const Course = require('../models/Course');
const User = require('../models/User');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');

/**
 * Create a Stripe checkout session for course purchase
 * POST /api/payments/create-checkout-session
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    console.log('🔧 Creating checkout session...');
    console.log(`   - User ID: ${req.user?.userId || req.user?._id || 'undefined'}`);
    console.log(`   - User Email: ${req.user?.email || 'undefined'}`);
    console.log(`   - Request Body:`, req.body);

    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      console.log('❌ User not authenticated or invalid user data');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course ID is required' 
      });
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      console.log(`❌ Course not found: ${courseId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    console.log(`✅ Course found: ${course.title} ($${course.price})`);

    // Get user ID from token (handle both userId and _id formats)
    const userId = req.user.userId || req.user._id;

    // Check if user already purchased this course
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User not found in database: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Initialize purchasedCourses array if it doesn't exist
    if (!user.purchasedCourses) {
      user.purchasedCourses = [];
      await user.save();
    }

    if (user.purchasedCourses.includes(courseId)) {
      console.log(`⚠️  User already purchased this course`);
      return res.status(400).json({ 
        success: false, 
        message: 'You already own this course' 
      });
    }

    // If Stripe is not configured, mark as purchased immediately (development mode)
    if (!stripe) {
      console.log('⚠️  Stripe not configured - marking as purchased in development mode');
      
      // Add course to user's purchased courses
      await User.findByIdAndUpdate(
        userId, 
        { $addToSet: { purchasedCourses: courseId } }
      );
      
      // Create a payment record for development mode
      const devPaymentData = {
        userId: userId,
        courseId: courseId,
        stripeSessionId: `dev_session_${Date.now()}`,
        amount: course.price,
        currency: 'usd',
        status: 'completed',
        paymentMethod: 'card',
        metadata: {
          userEmail: req.user.email,
          courseTitle: course.title,
          paymentDate: new Date()
        }
      };

      // Create or update payment record
      await Payment.findOneAndUpdate(
        { userId: userId, courseId: courseId, status: 'completed' },
        devPaymentData,
        { upsert: true, new: true }
      );
      
      console.log(`✅ Course added to user's purchased courses in development mode`);
      console.log(`✅ Payment record created: $${course.price}`);
      
      return res.json({ 
        success: true,
        url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout/success?courseId=${courseId}`,
        message: 'Course purchased successfully (development mode)'
      });
    }

    // Create Stripe checkout session
    const successUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout/success?courseId=${courseId}`;
    const cancelUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkout/cancel?courseId=${courseId}`;

    const session = await createCheckoutSession({
      user: req.user,
      course,
      successUrl,
      cancelUrl,
    });

    console.log(`✅ Stripe session created: ${session.id}`);

    res.json({ 
      success: true,
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create checkout session',
      error: error.message 
    });
  }
};

/**
 * Handle Stripe webhook events
 * POST /api/payments/webhook
 */
exports.webhook = async (req, res) => {
  console.log('🔧 Webhook received...');
  console.log(`   - Headers:`, req.headers);
  console.log(`   - Body length:`, req.rawBody ? req.rawBody.length : 'No raw body');
  console.log(`   - NODE_ENV:`, process.env.NODE_ENV);
  console.log(`   - STRIPE_SECRET_KEY:`, process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');

  let event;

  try {
    // Verify webhook signature
    console.log('🔧 Calling verifyWebhook function...');
    event = verifyWebhook(req);
    console.log(`✅ Webhook verified: ${event.type}`);
    console.log(`✅ Event data:`, JSON.stringify(event, null, 2));
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        break;
      
      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;
      
      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Webhook processing failed',
      error: error.message 
    });
  }
};

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('🔧 Processing checkout session completion...');
  console.log(`   - Session ID: ${session.id}`);
  console.log(`   - Customer Email: ${session.customer_email}`);
  console.log(`   - Metadata:`, session.metadata);

  try {
    const { userId, courseId, userEmail } = session.metadata;

    if (!userId || !courseId) {
      throw new Error('Missing userId or courseId in session metadata');
    }

    // Verify the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Update user's purchased courses
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { purchasedCourses: courseId } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error(`User not found: ${userId}`);
    }

    // Store payment information
    const paymentData = {
      userId: userId,
      courseId: courseId,
      stripeSessionId: session.id,
      amount: session.amount_total / 100, // Convert from cents to dollars
      currency: session.currency,
      status: 'completed',
      paymentMethod: 'card',
      metadata: {
        userEmail: userEmail,
        courseTitle: course.title,
        paymentDate: new Date()
      }
    };

    // Create or update payment record
    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      paymentData,
      { upsert: true, new: true }
    );

    console.log(`✅ Course access granted successfully`);
    console.log(`   - User: ${updatedUser.email}`);
    console.log(`   - Course: ${course.title}`);
    console.log(`   - Total purchased courses: ${updatedUser.purchasedCourses.length}`);
    console.log(`   - Payment recorded: $${paymentData.amount}`);

    // You could also send an email confirmation here
    // await sendPurchaseConfirmationEmail(userEmail, course.title);

  } catch (error) {
    console.error('❌ Error processing checkout completion:', error);
    throw error;
  }
}

/**
 * Success page handler
 * GET /api/payments/success
 */
exports.success = (req, res) => {
  console.log('🔧 Payment success page accessed');
  console.log(`   - Query params:`, req.query);
  
  res.json({ 
    success: true,
    message: 'Payment successful! You now have access to the course.',
    courseId: req.query.courseId
  });
};

/**
 * Cancel page handler
 * GET /api/payments/cancel
 */
exports.cancel = (req, res) => {
  console.log('🔧 Payment cancelled');
  console.log(`   - Query params:`, req.query);
  
  res.json({ 
    success: false,
    message: 'Payment was cancelled. You can try again anytime.',
    courseId: req.query.courseId
  });
};

/**
 * Check if user has purchased a course
 * GET /api/payment/check-purchase/:courseId
 */
exports.checkPurchase = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      console.log('❌ User not authenticated in checkPurchase');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get user ID from token (handle both userId and _id formats)
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Checking purchase status...`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Course ID: ${courseId}`);

    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User not found in database: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Initialize purchasedCourses array if it doesn't exist
    if (!user.purchasedCourses) {
      user.purchasedCourses = [];
      await user.save();
    }

    const hasPurchased = user.purchasedCourses.some(purchasedId => 
      purchasedId.toString() === courseId || purchasedId === courseId
    );
    
    console.log(`✅ Purchase check completed: ${hasPurchased}`);

    res.json({ 
      success: true,
      data: {
        hasPurchased,
        courseId
      }
    });

  } catch (error) {
    console.error('❌ Error checking purchase status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check purchase status',
      error: error.message 
    });
  }
}; 

/**
 * Get payment receipt information
 * GET /api/payment/receipt/:courseId
 */
exports.getReceipt = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      console.log('❌ User not authenticated in getReceipt');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get user ID from token (handle both userId and _id formats)
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Getting receipt for payment...`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Course ID: ${courseId}`);

    // Validate courseId format
    if (!courseId || courseId === 'undefined' || courseId === 'null') {
      console.log('❌ Invalid course ID provided:', courseId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course ID' 
      });
    }

    // Validate courseId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('❌ Invalid MongoDB ObjectId format:', courseId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course ID format' 
      });
    }

    // Find the payment record
    let payment = await Payment.findOne({
      userId: userId,
      courseId: courseId,
      status: 'completed'
    }).populate('courseId', 'title description');

    // If no payment record exists, check if user has purchased the course
    if (!payment) {
      console.log(`⚠️  No payment record found, checking if user owns the course...`);
      
      const user = await User.findById(userId);
      if (!user) {
        console.log(`❌ User not found: ${userId}`);
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
        console.log(`❌ User ${userId} has not purchased course ${courseId}`);
        return res.status(404).json({ 
          success: false, 
          message: 'Payment not found. The course may not have been purchased yet or the payment is still processing.' 
        });
      }

      // User owns the course but no payment record exists (development mode or webhook failed)
      console.log(`✅ User owns course but no payment record - creating fallback receipt`);
      
      const course = await Course.findById(courseId);
      if (!course) {
        console.log(`❌ Course not found: ${courseId}`);
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }

      // Create a fallback payment record
      const fallbackPaymentData = {
        userId: userId,
        courseId: courseId,
        stripeSessionId: `fallback_${Date.now()}`,
        amount: course.price,
        currency: 'usd',
        status: 'completed',
        paymentMethod: 'card',
        metadata: {
          userEmail: user.email,
          courseTitle: course.title,
          paymentDate: new Date()
        }
      };

      payment = new Payment(fallbackPaymentData);
      await payment.save();
      
      console.log(`✅ Fallback payment record created: $${payment.amount}`);
    }

    // Format receipt data
    const receipt = {
      orderId: payment._id.toString().slice(-8).toUpperCase(),
      courseTitle: payment.metadata.courseTitle,
      amount: payment.amount,
      currency: payment.currency.toUpperCase(),
      paymentDate: payment.createdAt,
      paymentMethod: payment.paymentMethod,
      userEmail: payment.metadata.userEmail,
      status: payment.status
    };

    console.log(`✅ Receipt generated for payment ${payment._id}`);

    res.json({ 
      success: true,
      receipt
    });

  } catch (error) {
    console.error('❌ Error getting receipt:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get receipt information',
      error: error.message 
    });
  }
};

/**
 * Download receipt as PDF
 * GET /api/payment/download-receipt/:courseId
 */
exports.downloadReceipt = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      console.log('❌ User not authenticated in downloadReceipt');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get user ID from token (handle both userId and _id formats)
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Downloading receipt for payment...`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Course ID: ${courseId}`);

    // Find the payment record
    let payment = await Payment.findOne({
      userId: userId,
      courseId: courseId,
      status: 'completed'
    }).populate('courseId', 'title description');

    // If no payment record exists, check if user has purchased the course
    if (!payment) {
      console.log(`⚠️  No payment record found, checking if user owns the course...`);
      
      const user = await User.findById(userId);
      if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
        console.log(`❌ User ${userId} has not purchased course ${courseId}`);
        return res.status(404).json({ 
          success: false, 
          message: 'Payment not found' 
        });
      }

      // User owns the course but no payment record exists (development mode or webhook failed)
      console.log(`✅ User owns course but no payment record - creating fallback receipt`);
      
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }

      // Create a fallback payment record
      const fallbackPaymentData = {
        userId: userId,
        courseId: courseId,
        stripeSessionId: `fallback_${Date.now()}`,
        amount: course.price,
        currency: 'usd',
        status: 'completed',
        paymentMethod: 'card',
        metadata: {
          userEmail: user.email,
          courseTitle: course.title,
          paymentDate: new Date()
        }
      };

      payment = new Payment(fallbackPaymentData);
      await payment.save();
      
      console.log(`✅ Fallback payment record created: $${payment.amount}`);
    }

    // Generate receipt HTML
    const receiptHtml = generateReceiptHTML(payment);

    // Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(receiptHtml, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment._id.toString().slice(-8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`✅ Receipt PDF generated for payment ${payment._id}`);

    // Alternative approach: use res.write() and res.end() for binary data
    res.write(pdfBuffer);
    res.end();

  } catch (error) {
    console.error('❌ Error downloading receipt:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download receipt',
      error: error.message 
    });
  }
};

/**
 * Download course resources as PDF
 * GET /api/payment/download-resources/:courseId
 */
exports.downloadResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Validate user authentication
    if (!req.user || (!req.user.userId && !req.user._id)) {
      console.log('❌ User not authenticated in downloadResources');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Get user ID from token (handle both userId and _id formats)
    const userId = req.user.userId || req.user._id;

    console.log(`🔧 Downloading resources for course...`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Course ID: ${courseId}`);

    // Check if user has purchased the course
    const user = await User.findById(userId);
    if (!user || !user.purchasedCourses || !user.purchasedCourses.includes(courseId)) {
      console.log(`❌ User ${userId} has not purchased course ${courseId}`);
      return res.status(403).json({ 
        success: false, 
        message: 'You must purchase this course to access resources' 
      });
    }

    // Find the course with videos
    const course = await Course.findById(courseId).populate('videos');
    if (!course) {
      console.log(`❌ Course not found: ${courseId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Generate comprehensive resources HTML
    const resourcesHtml = generateResourcesHTML(course);

    // Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set content and wait for it to load
    await page.setContent(resourcesHtml, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resources-${course.title.replace(/\s+/g, '-')}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log(`✅ Resources PDF generated for course ${courseId}`);

    // Alternative approach: use res.write() and res.end() for binary data
    res.write(pdfBuffer);
    res.end();

  } catch (error) {
    console.error('❌ Error downloading resources:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download resources',
      error: error.message 
    });
  }
};

/**
 * Generate receipt HTML
 */
function generateReceiptHTML(payment) {
  const orderId = payment._id.toString().slice(-8).toUpperCase();
  const paymentDate = payment.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${orderId}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .receipt-title {
            font-size: 18px;
            color: #374151;
            margin-bottom: 5px;
        }
        .order-id {
            font-size: 14px;
            color: #6b7280;
        }
        .details {
            margin-bottom: 30px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-label {
            font-weight: 500;
            color: #374151;
        }
        .detail-value {
            color: #1f2937;
        }
        .total {
            border-top: 2px solid #e5e5e5;
            padding-top: 20px;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: bold;
            color: #059669;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">Persi Academy</div>
            <div class="receipt-title">Payment Receipt</div>
            <div class="order-id">Order #${orderId}</div>
        </div>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Course:</span>
                <span class="detail-value">${payment.metadata.courseTitle}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${payment.metadata.userEmail}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Date:</span>
                <span class="detail-value">${paymentDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">Credit Card</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Completed</span>
            </div>
        </div>
        
        <div class="total">
            <div class="total-row">
                <span>Total Amount:</span>
                <span>$${payment.amount.toFixed(2)} ${payment.currency.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>This receipt serves as proof of payment for your course purchase.</p>
            <p>For support, contact us at support@persiacademy.com</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate comprehensive resources HTML
 */
function generateResourcesHTML(course) {
  // Generate course outline from videos
  const courseOutline = course.videos && course.videos.length > 0 
    ? course.videos.map((video, index) => `
        <div class="lesson-item">
          <div class="lesson-number">${index + 1}</div>
          <div class="lesson-content">
            <div class="lesson-title">${video.title}</div>
            <div class="lesson-duration">${video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Duration not available'}</div>
          </div>
        </div>
      `).join('')
    : '<div class="lesson-item"><div class="lesson-content"><div class="lesson-title">Course content will be available soon</div></div></div>';

  // Generate learning objectives based on course category
  const learningObjectives = getLearningObjectives(course.category);
  
  // Generate practice exercises based on course category
  const practiceExercises = getPracticeExercises(course.category);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Resources - ${course.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .resources {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .course-title {
            font-size: 20px;
            color: #374151;
            margin-bottom: 10px;
        }
        .course-description {
            color: #6b7280;
            line-height: 1.6;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e5e5;
        }
        .resource-item {
            margin-bottom: 15px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .resource-title {
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .resource-description {
            color: #6b7280;
            font-size: 14px;
        }
        .lesson-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background: #f9fafb;
            border-radius: 6px;
        }
        .lesson-number {
            background: #2563eb;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .lesson-content {
            flex: 1;
        }
        .lesson-title {
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 2px;
        }
        .lesson-duration {
            font-size: 12px;
            color: #6b7280;
        }
        .objective-item {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .objective-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #059669;
            font-weight: bold;
        }
        .exercise-item {
            margin-bottom: 12px;
            padding: 12px;
            background: #f0f9ff;
            border-radius: 6px;
            border-left: 3px solid #0ea5e9;
        }
        .exercise-title {
            font-weight: 500;
            color: #0c4a6e;
            margin-bottom: 5px;
        }
        .exercise-description {
            font-size: 14px;
            color: #0369a1;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="resources">
        <div class="header">
            <div class="logo">Persi Academy</div>
            <div class="course-title">${course.title}</div>
            <div class="course-description">${course.description || 'Comprehensive course resources and learning materials'}</div>
        </div>
        
        <div class="section">
            <div class="section-title">🎯 Learning Objectives</div>
            <div class="resource-item">
                <div class="resource-title">What You'll Learn</div>
                <div class="resource-description">
                    ${learningObjectives}
            </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📋 Course Outline</div>
            <div class="resource-item">
                <div class="resource-title">Lesson Structure</div>
                <div class="resource-description">
                    ${courseOutline}
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">💡 Practice Exercises</div>
            <div class="resource-item">
                <div class="resource-title">Hands-on Activities</div>
                <div class="resource-description">
                    ${practiceExercises}
            </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📚 Additional Resources</div>
            <div class="resource-item">
                <div class="resource-title">Study Materials</div>
                <div class="resource-description">
                    <div class="objective-item">Course notes and key takeaways from each lesson</div>
                    <div class="objective-item">Reference guides and cheat sheets</div>
                    <div class="objective-item">Recommended reading materials</div>
                    <div class="objective-item">Online resources and tools</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">🏆 Certification</div>
            <div class="resource-item">
                <div class="resource-title">Course Completion</div>
                <div class="resource-description">
                    <div class="objective-item">Complete all video lessons</div>
                    <div class="objective-item">Finish all practice exercises</div>
                    <div class="objective-item">Pass the final assessment (if applicable)</div>
                    <div class="objective-item">Download your completion certificate</div>
            </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📞 Support & Community</div>
            <div class="resource-item">
                <div class="resource-title">Get Help When You Need It</div>
                <div class="resource-description">
                    <div class="objective-item">Email support: support@persiacademy.com</div>
                    <div class="objective-item">Community forum for peer discussions</div>
                    <div class="objective-item">Office hours for live Q&A sessions</div>
                    <div class="objective-item">Technical support for platform issues</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Persi Academy</strong> - Empowering your learning journey</p>
            <p>This resource guide is your companion throughout the course.</p>
            <p>For technical support, contact us at support@persiacademy.com</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Get learning objectives based on course category
 */
function getLearningObjectives(category) {
  const objectives = {
    'youtube mastering': [
      'Master YouTube algorithm optimization techniques',
      'Create compelling thumbnails and titles that drive clicks',
      'Develop effective content strategies for different niches',
      'Understand analytics and data-driven decision making',
      'Build a sustainable YouTube business model',
      'Optimize video SEO and discoverability'
    ],
    'video editing': [
      'Master professional video editing software',
      'Learn advanced editing techniques and workflows',
      'Create engaging visual effects and transitions',
      'Understand color grading and audio enhancement',
      'Develop efficient editing workflows',
      'Export optimized videos for different platforms'
    ],
    'camera': [
      'Master camera settings and manual controls',
      'Understand composition and framing techniques',
      'Learn lighting setup and natural light photography',
      'Develop storytelling through visual imagery',
      'Master different photography styles and genres',
      'Optimize camera gear for various shooting conditions'
    ]
  };

  const defaultObjectives = [
    'Gain comprehensive knowledge in the subject area',
    'Develop practical skills through hands-on exercises',
    'Apply learned concepts to real-world scenarios',
    'Build confidence in your abilities',
    'Create a portfolio of work to showcase your skills'
  ];

  const categoryObjectives = objectives[category] || defaultObjectives;
  
  return categoryObjectives.map(objective => 
    `<div class="objective-item">${objective}</div>`
  ).join('');
}

/**
 * Get practice exercises based on course category
 */
function getPracticeExercises(category) {
  const exercises = {
    'youtube mastering': [
      { title: 'Channel Audit', description: 'Analyze your current channel and identify improvement opportunities' },
      { title: 'Thumbnail Design', description: 'Create 5 different thumbnail designs for the same video' },
      { title: 'Title Optimization', description: 'Write 10 different titles and test them for click-through rate' },
      { title: 'Content Calendar', description: 'Plan a 30-day content calendar with specific topics and goals' },
      { title: 'Analytics Review', description: 'Analyze your channel analytics and create an improvement plan' }
    ],
    'video editing': [
      { title: 'Basic Editing Project', description: 'Edit a 2-minute video using basic cuts and transitions' },
      { title: 'Color Grading Exercise', description: 'Apply different color grades to the same footage' },
      { title: 'Audio Enhancement', description: 'Clean and enhance audio for a video project' },
      { title: 'Visual Effects', description: 'Create a video with custom visual effects and overlays' },
      { title: 'Multi-Camera Edit', description: 'Edit footage from multiple camera angles' }
    ],
    'camera': [
      { title: 'Manual Mode Practice', description: 'Take 50 photos using only manual camera settings' },
      { title: 'Composition Exercise', description: 'Practice rule of thirds, leading lines, and framing' },
      { title: 'Lighting Setup', description: 'Create portraits using different lighting techniques' },
      { title: 'Storytelling Series', description: 'Create a photo series that tells a complete story' },
      { title: 'Gear Optimization', description: 'Test different lenses and settings for various scenarios' }
    ]
  };

  const defaultExercises = [
    { title: 'Practice Project 1', description: 'Apply the concepts learned in the first module' },
    { title: 'Practice Project 2', description: 'Create a comprehensive project using multiple techniques' },
    { title: 'Final Project', description: 'Complete a capstone project showcasing all learned skills' }
  ];

  const categoryExercises = exercises[category] || defaultExercises;
  
  return categoryExercises.map(exercise => 
    `<div class="exercise-item">
      <div class="exercise-title">${exercise.title}</div>
      <div class="exercise-description">${exercise.description}</div>
    </div>`
  ).join('');
}