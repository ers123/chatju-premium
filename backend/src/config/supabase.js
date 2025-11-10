// backend/src/config/supabase.js
// Supabase Client Configuration

const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
function validateSupabaseConfig() {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
  const missing = required.filter(key => !process.env[key] || process.env[key] === 'placeholder');

  if (missing.length > 0) {
    throw new Error(
      `Missing or invalid Supabase configuration: ${missing.join(', ')}\n` +
      'Please update your .env file with real Supabase credentials.\n' +
      'See LEVEL5_SETUP_GUIDE.md for instructions.'
    );
  }
}

// Validate on module load
validateSupabaseConfig();

/**
 * Supabase client for public operations (uses anon key)
 * - Used for operations that respect Row Level Security (RLS)
 * - Requires valid JWT token for protected operations
 * - Safe to use in client-facing contexts
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side, no need to persist
    },
  }
);

/**
 * Supabase admin client for privileged operations (uses service_role key)
 * - Bypasses Row Level Security (RLS)
 * - Used for backend operations that need full database access
 * - NEVER expose this to frontend or client code
 *
 * Use cases:
 * - Creating payments on behalf of users
 * - Storing readings after payment verification
 * - Admin operations and data migration
 */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper function to handle Supabase errors
 * @param {Object} error - Supabase error object
 * @returns {Error} Formatted error
 */
function handleSupabaseError(error) {
  if (!error) return null;

  console.error('[Supabase Error]', error);

  // Map common Supabase error codes to user-friendly messages
  const errorMap = {
    'PGRST116': 'Resource not found',
    '23505': 'Duplicate entry',
    '23503': 'Related record not found',
    '42P01': 'Database table not found - please run schema.sql',
  };

  const code = error.code || error.message?.match(/\d{5}/)?.[0];
  const message = errorMap[code] || error.message || 'Database operation failed';

  return new Error(message);
}

/**
 * Test Supabase connection
 * @returns {Promise<boolean>} True if connected
 */
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      throw handleSupabaseError(error);
    }

    console.log('[Supabase] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test failed:', error.message);
    throw error;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  handleSupabaseError,
  testConnection,
};
