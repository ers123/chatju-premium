// backend/src/services/ai.service.js
// Multi-AI Provider Service - Supports OpenAI, Gemini, and Claude

const logger = require('../utils/logger');

/**
 * Unified AI Service
 *
 * Supports multiple AI providers with seamless switching:
 * - OpenAI (GPT-4o-mini) - Best Korean support, $0.15/1M tokens
 * - Google Gemini (Flash) - FREE tier, 1.5M tokens/day, $0.075/1M after
 * - Anthropic Claude (Haiku) - Fast, $0.25/1M tokens
 *
 * Configuration via environment variable:
 * AI_PROVIDER=gemini|openai|claude (default: gemini)
 */

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'gemini';
    this.clients = {};
    this.initializeClients();
  }

  /**
   * Initialize AI provider clients based on available API keys
   */
  initializeClients() {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = require('openai');
      this.clients.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('OpenAI client initialized', { provider: 'openai' });
    }

    // Google Gemini
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      this.clients.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      logger.info('Gemini client initialized', { provider: 'gemini' });
    }

    // Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      const Anthropic = require('@anthropic-ai/sdk');
      this.clients.claude = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      logger.info('Claude client initialized', { provider: 'claude' });
    }

    // Verify at least one provider is available
    if (Object.keys(this.clients).length === 0) {
      logger.error('No AI providers configured! Set at least one API key.');
      throw new Error('No AI providers available');
    }

    // Validate current provider
    if (!this.clients[this.provider]) {
      logger.warn(`Configured provider '${this.provider}' not available, falling back to first available`);
      this.provider = Object.keys(this.clients)[0];
      logger.info(`Using fallback provider: ${this.provider}`);
    }
  }

  /**
   * Generate fortune telling response
   *
   * @param {Array<Object>} messages - Array of messages in OpenAI format
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Response with content and metadata
   */
  async generateFortune(messages, options = {}) {
    const {
      maxTokens = 250,
      temperature = 0.7,
      provider = this.provider, // Allow override per request
    } = options;

    try {
      logger.debug('Generating fortune', {
        provider,
        messageCount: messages.length,
        maxTokens,
      });

      let response;
      let tokensUsed = 0;

      switch (provider) {
        case 'openai':
          response = await this.generateWithOpenAI(messages, maxTokens, temperature);
          tokensUsed = response.usage.total_tokens;
          break;

        case 'gemini':
          response = await this.generateWithGemini(messages, maxTokens, temperature);
          tokensUsed = response.tokensUsed;
          break;

        case 'claude':
          response = await this.generateWithClaude(messages, maxTokens, temperature);
          tokensUsed = response.tokensUsed;
          break;

        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }

      logger.info('Fortune generated successfully', {
        provider,
        tokensUsed,
        contentLength: response.content.length,
      });

      return {
        content: response.content,
        provider,
        tokensUsed,
        model: response.model,
      };

    } catch (error) {
      logger.error('AI generation failed', {
        provider,
        error: error.message,
        stack: error.stack,
      });

      // Try fallback to another provider if available
      if (provider === this.provider) {
        const fallbackProvider = this.getFallbackProvider(provider);
        if (fallbackProvider) {
          logger.warn(`Retrying with fallback provider: ${fallbackProvider}`);
          return this.generateFortune(messages, { ...options, provider: fallbackProvider });
        }
      }

      throw error;
    }
  }

  /**
   * Generate with OpenAI (GPT-4o-mini)
   */
  async generateWithOpenAI(messages, maxTokens, temperature) {
    const completion = await this.clients.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
      model: 'gpt-4o-mini',
    };
  }

  /**
   * Generate with Google Gemini (Flash)
   */
  async generateWithGemini(messages, maxTokens, temperature) {
    const model = this.clients.gemini.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    });

    // Convert OpenAI message format to Gemini format
    const geminiMessages = this.convertToGeminiFormat(messages);

    const result = await model.generateContent({
      contents: geminiMessages,
    });

    const response = result.response;

    return {
      content: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      model: 'gemini-1.5-flash',
    };
  }

  /**
   * Generate with Anthropic Claude (Haiku)
   */
  async generateWithClaude(messages, maxTokens, temperature) {
    // Separate system messages from conversation
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const response = await this.clients.claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: conversationMessages,
    });

    return {
      content: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: 'claude-3-haiku',
    };
  }

  /**
   * Convert OpenAI message format to Gemini format
   */
  convertToGeminiFormat(messages) {
    // Gemini uses 'user' and 'model' roles instead of 'user' and 'assistant'
    // System messages are combined with the first user message
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const systemPrompt = systemMessages.map(m => m.content).join('\n\n');

    return otherMessages.map((msg, index) => {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      let content = msg.content;

      // Prepend system prompt to first user message
      if (index === 0 && role === 'user' && systemPrompt) {
        content = `${systemPrompt}\n\n${content}`;
      }

      return {
        role,
        parts: [{ text: content }],
      };
    });
  }

  /**
   * Get fallback provider if current one fails
   */
  getFallbackProvider(currentProvider) {
    const availableProviders = Object.keys(this.clients).filter(p => p !== currentProvider);
    return availableProviders[0] || null;
  }

  /**
   * Get current provider info
   */
  getProviderInfo() {
    const providerDetails = {
      openai: {
        name: 'OpenAI GPT-4o-mini',
        cost: '$0.15 per 1M tokens',
        features: ['Best Korean support', 'Reliable', 'Production-ready'],
      },
      gemini: {
        name: 'Google Gemini 1.5 Flash',
        cost: 'FREE (1.5M tokens/day), then $0.075/1M',
        features: ['Free tier', 'Fast', 'Multi-language'],
      },
      claude: {
        name: 'Anthropic Claude 3 Haiku',
        cost: '$0.25 per 1M tokens',
        features: ['Very fast', 'High quality', 'Latest model'],
      },
    };

    return {
      current: this.provider,
      available: Object.keys(this.clients),
      details: providerDetails,
    };
  }

  /**
   * Switch provider (for admin use)
   */
  setProvider(provider) {
    if (!this.clients[provider]) {
      throw new Error(`Provider '${provider}' not available. Available: ${Object.keys(this.clients).join(', ')}`);
    }

    const oldProvider = this.provider;
    this.provider = provider;

    logger.info('AI provider switched', {
      from: oldProvider,
      to: provider,
    });

    return {
      success: true,
      previous: oldProvider,
      current: provider,
    };
  }
}

// Singleton instance
let aiServiceInstance = null;

/**
 * Get AI service instance (singleton)
 */
function getAIService() {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

module.exports = {
  getAIService,
  AIService,
};
