#!/usr/bin/env node
// Test Supabase Connection
// Run this first to verify Supabase is configured correctly

require('dotenv').config();
const { supabase, supabaseAdmin, testConnection } = require('../src/config/supabase');

async function testSupabaseConnection() {
  console.log('========================================');
  console.log('Level 5: Supabase Connection Test');
  console.log('========================================\n');

  let errorCount = 0;

  // Test 1: Environment variables
  console.log('Test 1: Checking environment variables...');
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'placeholder') {
    console.error('❌ SUPABASE_URL not configured');
    errorCount++;
  } else {
    console.log('✅ SUPABASE_URL configured:', process.env.SUPABASE_URL);
  }

  if (!process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY === 'placeholder') {
    console.error('❌ SUPABASE_ANON_KEY not configured');
    errorCount++;
  } else {
    console.log('✅ SUPABASE_ANON_KEY configured (length:', process.env.SUPABASE_ANON_KEY.length, ')');
  }

  if (!process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY === 'placeholder') {
    console.error('❌ SUPABASE_SERVICE_KEY not configured');
    errorCount++;
  } else {
    console.log('✅ SUPABASE_SERVICE_KEY configured (length:', process.env.SUPABASE_SERVICE_KEY.length, ')');
  }

  if (errorCount > 0) {
    console.error('\n❌ Environment variables not configured properly');
    console.error('Please update .env file with real Supabase credentials');
    console.error('See LEVEL5_SETUP_GUIDE.md for instructions\n');
    process.exit(1);
  }

  // Test 2: Connection test
  console.log('\nTest 2: Testing database connection...');
  try {
    await testConnection();
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    errorCount++;
  }

  // Test 3: Check tables exist
  console.log('\nTest 3: Checking database tables...');
  try {
    const tables = ['users', 'payments', 'readings'];

    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.error(`❌ Table '${table}' not found or not accessible`);
        console.error('   Error:', error.message);
        errorCount++;
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    errorCount++;
  }

  // Test 4: Test user query
  console.log('\nTest 4: Testing user query...');
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ User query failed:', error.message);
      errorCount++;
    } else {
      console.log('✅ Can query users table');
      if (data.length > 0) {
        console.log('   Found', data.length, 'user(s)');
      }
    }
  } catch (error) {
    console.error('❌ User query error:', error.message);
    errorCount++;
  }

  // Summary
  console.log('\n========================================');
  if (errorCount === 0) {
    console.log('✅ ALL TESTS PASSED');
    console.log('Supabase is configured correctly!');
    console.log('You can now proceed to Level 5 integration test.');
  } else {
    console.log(`❌ ${errorCount} TEST(S) FAILED`);
    console.log('Please fix the errors above before proceeding.');
  }
  console.log('========================================\n');

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run tests
testSupabaseConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
