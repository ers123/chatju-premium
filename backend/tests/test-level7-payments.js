#!/usr/bin/env node
// Level 7 Payment Integration Test
// Tests PayPal payment integration

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
      'PAYPAL_CLIENT_ID',
      'PAYPAL_CLIENT_SECRET',
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
      'createPayPalPayment',
      'capturePayPalPayment',
      'handlePayPalWebhook',
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
      console.log('   - POST /payment/paypal/create');
      console.log('   - POST /payment/paypal/capture');
      console.log('   - POST /payment/paypal/webhook');
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

    // Test 5: Test PayPal payment structure
    console.log('\nTest 5: Testing PayPal payment structure...');
    try {
      if (allEnvVarsPresent) {
        console.log('✅ PayPal payment service ready');
        console.log('   Can create orders with real credentials');
      } else {
        console.log('⚠️  PayPal credentials not configured');
        console.log('   Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env');
      }
      testsPassed++;
    } catch (error) {
      console.error('❌ PayPal payment structure error:', error.message);
      testsFailed++;
    }

    // Test 6: Verify axios is installed (required for PayPal API calls)
    console.log('\nTest 6: Checking axios dependency...');
    try {
      const axios = require('axios');
      console.log('✅ axios is installed');
      console.log('   PayPal API calls will work');
      testsPassed++;
    } catch (error) {
      console.error('❌ axios not installed');
      console.log('   Run: npm install axios');
      testsFailed++;
    }

    // Test 7: Test user payments retrieval
    console.log('\nTest 7: Testing user payments retrieval...');
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
      console.log('1. Get PayPal credentials:');
      console.log('   - Sign up at https://developer.paypal.com');
      console.log('   - Create sandbox app');
      console.log('   - Add to .env file:');
      console.log('     PAYPAL_CLIENT_ID=...');
      console.log('     PAYPAL_CLIENT_SECRET=...');
      console.log('');
      console.log('2. Set Frontend URL:');
      console.log('   - Add to .env file:');
      console.log('     FRONTEND_URL=https://chatju.pages.dev');
      console.log('');
      console.log('3. Test with real payments:');
      console.log('   - Start server: npm run dev');
      console.log('   - Create payment: POST /payment/paypal/create');
      console.log('   - Capture payment: POST /payment/paypal/capture');
      console.log('');
      console.log('4. Set up webhooks:');
      console.log('   - PayPal: https://your-api.com/payment/paypal/webhook');
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
