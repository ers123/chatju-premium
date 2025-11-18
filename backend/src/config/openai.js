// backend/src/config/openai.js
// Shared OpenAI Client Configuration

const { OpenAI } = require('openai');
const logger = require('../utils/logger');

/**
 * Singleton OpenAI client instance
 * Prevents duplicate client creation and reduces memory usage
 */
let openaiClient = null;

/**
 * Get or create OpenAI client instance
 * @returns {OpenAI} OpenAI client instance
 */
function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI;

    if (!apiKey) {
      logger.warn('OpenAI API key not configured');
      throw new Error('OpenAI API key is required');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });

    logger.info('OpenAI client initialized successfully');
  }

  return openaiClient;
}

/**
 * Reset OpenAI client (useful for testing)
 */
function resetOpenAIClient() {
  openaiClient = null;
}

module.exports = {
  getOpenAIClient,
  resetOpenAIClient,
};
