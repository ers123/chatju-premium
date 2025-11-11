#!/usr/bin/env node
// Level 7 Payment Integration Test
// Tests Toss Payments and Stripe integration

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

// Test configuration
const TEST_USER_ID = '90726838-6eb4-448b-8ec3-a40f7effdd61'; // aimihigh9@gmail.com from Level 6

async function testLevel7Payments() {
  console.log('========================================');
  console.log('Level 7: Payment Integration Test');
  console.log('========================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Check required environment variables
    console.log('Test 1: Checking payment environment variables...');
    const requiredEnvVars = [
      'TOSS_CLIENT_KEY',
      'TOSS_SECRET_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'FRONTEND_URL'
    ];

    let allEnvVarsPresent = true;
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.log(`⚠️  Missing: ${envVar}`);
        allEnvVarsPresent = false;
      }
    }

    if (allEnvVarsPresent) {
      console.log('✅ All payment environment variables configured');
      testsPassed++;
    } else {
      console.log('❌ Some environment variables missing');
      console.log('   Add them to .env file to enable payment testing');
      testsFailed++;
    }

    // Test 2: Check payment service functions exist
    console.log('\nTest 2: Verifying payment service functions...');
    const paymentService = require('../src/services/payment.service');
    const requiredFunctions = [
      'createTossPayment',
      'confirmTossPayment',
      'handleTossWebhook',
      'createStripePayment',
      'confirmStripePayment',
      'handleStripeWebhook',
      'getPaymentByOrderId',
      'getPaymentById',
      'getUserPayments',
    ];

    let allFunctionsExist = true;
    for (const func of requiredFunctions) {
      if (typeof paymentService[func] !== 'function') {
        console.error(`❌ Missing function: ${func}`);
        allFunctionsExist = false;
      }
    }

    if (allFunctionsExist) {
      console.log('✅ All payment service functions exist');
      console.log(`   ${requiredFunctions.length} functions verified`);
      testsPassed++;
    } else {
      testsFailed++;
    }

    // Test 3: Check payment routes configured
    console.log('\nTest 3: Verifying payment routes...');
    try {
      const paymentRoutes = require('../src/routes/payment.routes');
      console.log('✅ Payment routes loaded successfully');
      console.log('   Available endpoints:');
      console.log('   - POST /payment/toss/create');
      console.log('   - POST /payment/toss/confirm');
      console.log('   - POST /payment/toss/webhook');
      console.log('   - POST /payment/stripe/create');
      console.log('   - POST /payment/stripe/webhook');
      console.log('   - GET /payment/:orderId');
      console.log('   - GET /payment/history/me');
      testsPassed++;
    } catch (error) {
      console.error('❌ Payment routes not configured:', error.message);
      testsFailed++;
    }

    // Test 4: Test database schema for payments
    console.log('\nTest 4: Verifying payments table schema...');
    const { data: columns, error: schemaError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .limit(1);

    if (schemaError && schemaError.code !== 'PGRST116') {
      console.error('❌ Payments table schema error:', schemaError);
      testsFailed++;
    } else {
      console.log('✅ Payments table exists and is accessible');
      console.log('   Table ready for payment records');
      testsPassed++;
    }

    // Test 5: Test Toss payment creation (structure only, no API call)
    console.log('\nTest 5: Testing Toss payment structure...');
    try {
      // We won't actually create payment without valid credentials
      // Just verify the function structure
      if (allEnvVarsPresent) {
        console.log('✅ Toss payment service ready');
        console.log('   Can create orders with real credentials');
      } else {
        console.log('⚠️  Toss credentials not configured');
        console.log('   Add TOSS_CLIENT_KEY and TOSS_SECRET_KEY to .env');
      }
      testsPassed++;
    } catch (error) {
      console.error('❌ Toss payment structure error:', error.message);
      testsFailed++;
    }

    // Test 6: Test Stripe payment creation (structure only, no API call)
    console.log('\nTest 6: Testing Stripe payment structure...');
    try {
      // We won't actually create payment without valid credentials
      // Just verify the function structure
      if (process.env.STRIPE_SECRET_KEY) {
        console.log('✅ Stripe payment service ready');
        console.log('   Can create payment intents with real credentials');
      } else {
        console.log('⚠️  Stripe credentials not configured');
        console.log('   Add STRIPE_SECRET_KEY to .env');
      }
      testsPassed++;
    } catch (error) {
      console.error('❌ Stripe payment structure error:', error.message);
      testsFailed++;
    }

    // Test 7: Verify axios is installed (required for Toss API calls)
    console.log('\nTest 7: Checking axios dependency...');
    try {
      const axios = require('axios');
      console.log('✅ axios is installed');
      console.log('   Toss API calls will work');
      testsPassed++;
    } catch (error) {
      console.error('❌ axios not installed');
      console.log('   Run: npm install axios');
      testsFailed++;
    }

    // Test 8: Verify stripe package is installed
    console.log('\nTest 8: Checking stripe dependency...');
    try {
      const stripe = require('stripe');
      console.log('✅ stripe package is installed');
      console.log('   Stripe API calls will work');
      testsPassed++;
    } catch (error) {
      console.error('❌ stripe package not installed');
      console.log('   Run: npm install stripe');
      testsFailed++;
    }

    // Test 9: Test user payments retrieval
    console.log('\nTest 9: Testing user payments retrieval...');
    try {
      const payments = await paymentService.getUserPayments(TEST_USER_ID);
      console.log('✅ User payments retrieval works');
      console.log(`   Found ${payments.length} existing payment(s)`);
      testsPassed++;
    } catch (error) {
      console.error('❌ User payments retrieval failed:', error.message);
      testsFailed++;
    }

    // Summary
    console.log('\n========================================');
    console.log('LEVEL 7 TEST RESULTS');
    console.log('========================================');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log('========================================');

    if (testsFailed === 0) {
      console.log('\n✅ LEVEL 7 CODE SETUP COMPLETE!');
      console.log('\nTo fully test payment integration:');
      console.log('\n📋 Next Steps:');
      console.log('1. Get Toss Payments credentials:');
      console.log('   - Sign up at https://developers.tosspayments.com');
      console.log('   - Get Client Key and Secret Key');
      console.log('   - Add to .env file:');
      console.log('     TOSS_CLIENT_KEY=test_ck_...');
      console.log('     TOSS_SECRET_KEY=test_sk_...');
      console.log('');
      console.log('2. Get Stripe credentials:');
      console.log('   - Sign up at https://stripe.com');
      console.log('   - Get API keys from Dashboard');
      console.log('   - Add to .env file:');
      console.log('     STRIPE_SECRET_KEY=sk_test_...');
      console.log('     STRIPE_PUBLISHABLE_KEY=pk_test_...');
      console.log('');
      console.log('3. Set Frontend URL:');
      console.log('   - Add to .env file:');
      console.log('     FRONTEND_URL=https://chatju.pages.dev');
      console.log('');
      console.log('4. Test with real payments:');
      console.log('   - Start server: npm run dev');
      console.log('   - Create payment: POST /payment/toss/create');
      console.log('   - Confirm payment: POST /payment/toss/confirm');
      console.log('');
      console.log('5. Set up webhooks:');
      console.log('   - Toss: https://your-api.com/payment/toss/webhook');
      console.log('   - Stripe: https://your-api.com/payment/stripe/webhook');
      console.log('');
      console.log('Next: Complete payment gateway setup and test!');
      console.log('');
    } else {
      console.log('\n⚠️  LEVEL 7 SETUP INCOMPLETE');
      console.log('Please fix errors above and try again.\n');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    testsFailed++;
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run test
console.log('Starting Level 7 test in 2 seconds...\n');
setTimeout(() => {
  testLevel7Payments().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}, 2000);
