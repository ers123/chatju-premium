#!/usr/bin/env node
// Level 5 Integration Test
// Tests complete flow with real Supabase database

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');
const { createTestPayment, getPayment } = require('../src/services/payment.service.v5');
const { generateSajuReading, getReading } = require('../src/services/saju.service.v5');

// Test user ID (using the one from schema.sql)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_EMAIL = 'test@chatju.com';

async function runLevel5Test() {
  console.log('========================================');
  console.log('Level 5: Complete Flow Integration Test');
  console.log('Database: Real Supabase PostgreSQL');
  console.log('========================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Verify test user exists
    console.log('Test 1: Verifying test user exists...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', TEST_USER_ID)
      .single();

    if (userError || !user) {
      console.error('❌ Test user not found');
      console.error('   Run database/schema.sql to create test user');
      testsFailed++;
      return;
    }

    console.log('✅ Test user found:', user.email);
    testsPassed++;

    // Test 2: Create test payment
    console.log('\nTest 2: Creating test payment...');
    const payment = await createTestPayment(TEST_USER_ID);

    console.log('✅ Payment created and completed');
    console.log('   Order ID:', payment.order_id);
    console.log('   Status:', payment.status);
    console.log('   Amount:', payment.amount, payment.currency);
    console.log('   Product:', payment.product_type);
    testsPassed++;

    // Test 3: Verify payment in database
    console.log('\nTest 3: Verifying payment persists in database...');
    const savedPayment = await getPayment(payment.order_id);

    if (savedPayment.id !== payment.id) {
      throw new Error('Payment ID mismatch');
    }

    console.log('✅ Payment persists in database');
    console.log('   Database ID:', savedPayment.id);
    testsPassed++;

    // Test 4: Generate saju reading (full calculation + AI + database storage)
    console.log('\nTest 4: Generating saju reading with database storage...');
    const readingParams = {
      userId: TEST_USER_ID,
      orderId: payment.order_id,
      birthDate: '1990-05-15',
      birthTime: '14:30',
      gender: 'male',
      language: 'ko',
      timezone: 'Asia/Seoul',
      subjectName: '테스트',
    };

    const reading = await generateSajuReading(readingParams);

    console.log('✅ Saju reading generated and saved');
    console.log('   Reading ID:', reading.readingId);
    console.log('   Created at:', reading.createdAt);
    console.log('   View URL:', reading.viewUrl);
    testsPassed++;

    // Test 5: Verify saju calculation
    console.log('\nTest 5: Verifying Manseryeok calculation...');
    const { pillars, elements } = reading.manseryeok;

    if (!pillars || !pillars.year || !pillars.month || !pillars.day || !pillars.hour) {
      throw new Error('Invalid pillars structure');
    }

    console.log('✅ Manseryeok calculation valid');
    console.log('   Year Pillar:', pillars.year.korean, `(${pillars.year.element})`);
    console.log('   Month Pillar:', pillars.month.korean, `(${pillars.month.element})`);
    console.log('   Day Pillar:', pillars.day.korean, `(${pillars.day.element})`);
    console.log('   Hour Pillar:', pillars.hour.korean, `(${pillars.hour.element})`);
    console.log('   Elements:', JSON.stringify(elements));
    testsPassed++;

    // Test 6: Verify AI interpretation
    console.log('\nTest 6: Verifying AI interpretation...');
    const { fullText, sections, metadata } = reading.aiInterpretation;

    if (!fullText || fullText.length < 50) {
      throw new Error('AI interpretation too short');
    }

    console.log('✅ AI interpretation generated');
    console.log('   Length:', fullText.length, 'characters');
    console.log('   Tokens:', metadata.tokens);
    console.log('   Model:', metadata.model);
    console.log('   Sections:', Object.keys(sections).length);
    testsPassed++;

    // Test 7: Retrieve reading from database
    console.log('\nTest 7: Retrieving reading from database...');
    const retrievedReading = await getReading(reading.readingId, TEST_USER_ID);

    if (retrievedReading.readingId !== reading.readingId) {
      throw new Error('Reading ID mismatch');
    }

    console.log('✅ Reading successfully retrieved from database');
    console.log('   Data persists after generation');
    testsPassed++;

    // Test 8: Verify reading persists in Supabase
    console.log('\nTest 8: Verifying reading in Supabase table...');
    const { data: dbReading, error: readingError } = await supabaseAdmin
      .from('readings')
      .select('*')
      .eq('id', reading.readingId)
      .single();

    if (readingError || !dbReading) {
      throw new Error('Reading not found in database');
    }

    console.log('✅ Reading exists in Supabase');
    console.log('   Birth date:', dbReading.birth_date);
    console.log('   Gender:', dbReading.gender);
    console.log('   Language:', dbReading.language);
    console.log('   Has saju_data:', !!dbReading.saju_data);
    console.log('   Has ai_interpretation:', !!dbReading.ai_interpretation);
    testsPassed++;

    // Test 9: Test data persistence (simulate server restart)
    console.log('\nTest 9: Testing data persistence...');
    console.log('   (Simulating server restart...)');

    // Query data again as if server restarted
    const { data: persistedPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', payment.id)
      .single();

    const { data: persistedReading } = await supabaseAdmin
      .from('readings')
      .select('*')
      .eq('id', reading.readingId)
      .single();

    if (!persistedPayment || !persistedReading) {
      throw new Error('Data lost after query');
    }

    console.log('✅ Data persists across queries');
    console.log('   Payment still exists:', !!persistedPayment);
    console.log('   Reading still exists:', !!persistedReading);
    testsPassed++;

    // Summary
    console.log('\n========================================');
    console.log('LEVEL 5 TEST RESULTS');
    console.log('========================================');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log('========================================');

    if (testsFailed === 0) {
      console.log('\n🎉 LEVEL 5 PASSED! 🎉');
      console.log('\nKey Achievements:');
      console.log('  ✓ Real Supabase database integration');
      console.log('  ✓ Payment records persist in PostgreSQL');
      console.log('  ✓ Reading data stored permanently');
      console.log('  ✓ Manseryeok + AI integration working');
      console.log('  ✓ Data survives server restarts');
      console.log('\nNext Steps:');
      console.log('  → Level 6: Implement real Supabase Auth');
      console.log('  → Level 7: Integrate real payment gateways');
      console.log('\n');
    } else {
      console.log('\n❌ LEVEL 5 FAILED');
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
console.log('Starting Level 5 test in 2 seconds...\n');
setTimeout(() => {
  runLevel5Test().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}, 2000);
