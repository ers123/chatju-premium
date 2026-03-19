// backend/src/services/ai.service.js
// Multi-AI Provider Service - Supports OpenAI, Gemini, and Claude

const logger = require('../utils/logger');

/**
 * Unified AI Service
 *
 * Supports multiple AI providers with ordered fallback chain:
 * - OpenAI GPT-5.2 (Primary) — Best quality Korean, $0.074/report
 * - Anthropic Claude Sonnet 4.6 (Fallback 1) — Comparable quality, $0.081/report
 * - Google Gemini 3 Flash Preview (Fallback 2) — Cost-effective, $0.016/report
 *
 * Configuration via environment variable:
 * AI_PROVIDER=openai|claude|gemini (default: openai)
 */

// Explicit fallback order — quality-first
const FALLBACK_ORDER = ['openai', 'claude', 'gemini'];

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.clients = {};
    this.initializeClients();
  }

  /**
   * Initialize AI provider clients based on available API keys
   */
  initializeClients() {
    // OpenAI (supports both OPENAI_API_KEY and OPENAI for backwards compatibility)
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI;
    if (openaiKey) {
      const { OpenAI } = require('openai');
      this.clients.openai = new OpenAI({
        apiKey: openaiKey,
      });
      logger.info('OpenAI client initialized');
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
      this.provider = this.getFirstAvailableProvider();
      logger.info(`Using fallback provider: ${this.provider}`);
    }
  }

  /**
   * Get first available provider following FALLBACK_ORDER
   */
  getFirstAvailableProvider() {
    for (const p of FALLBACK_ORDER) {
      if (this.clients[p]) return p;
    }
    return Object.keys(this.clients)[0];
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
      provider = this.provider,
      _triedProviders = [], // Internal: track failed providers for multi-hop fallback
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

      // Multi-hop fallback: try next provider in FALLBACK_ORDER
      const tried = [..._triedProviders, provider];
      const fallbackProvider = this.getFallbackProvider(tried);

      if (fallbackProvider) {
        logger.warn(`Retrying with fallback provider: ${fallbackProvider} (tried: ${tried.join(', ')})`);
        return this.generateFortune(messages, {
          ...options,
          provider: fallbackProvider,
          _triedProviders: tried,
        });
      }

      throw error;
    }
  }

  /**
   * Generate with OpenAI (GPT-5.4-mini)
   * Fastest, best Korean quality, great cost-efficiency
   */
  async generateWithOpenAI(messages, maxTokens, temperature) {
    const completion = await this.clients.openai.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages,
      max_completion_tokens: maxTokens,
      temperature,
    });

    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
      model: 'gpt-5.4-mini',
    };
  }

  /**
   * Generate with Google Gemini 3 Flash Preview
   * - Strong Korean support at low cost
   * - $0.50/1M input, $3.00/1M output
   */
  async generateWithGemini(messages, maxTokens, temperature) {
    const model = this.clients.gemini.getGenerativeModel({
      model: 'gemini-3-flash-preview',
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
      model: 'gemini-3-flash-preview',
    };
  }

  /**
   * Generate with Anthropic Claude Sonnet 4.6
   * - Excellent structured Korean output
   * - $3.00/1M input, $15.00/1M output
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
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: conversationMessages,
    });

    return {
      content: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: 'claude-sonnet-4-6',
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
   * Get next fallback provider, respecting FALLBACK_ORDER and skipping already-tried ones
   */
  getFallbackProvider(triedProviders) {
    for (const p of FALLBACK_ORDER) {
      if (this.clients[p] && !triedProviders.includes(p)) {
        return p;
      }
    }
    return null;
  }

  /**
   * Get current provider info
   */
  getProviderInfo() {
    const providerDetails = {
      openai: {
        name: 'OpenAI GPT-5.2',
        cost: '$1.75/1M input, $14.00/1M output (~$0.074/report)',
        features: ['Best Korean quality', 'Frontier reasoning', 'Production-ready'],
      },
      claude: {
        name: 'Anthropic Claude Sonnet 4.6',
        cost: '$3.00/1M input, $15.00/1M output (~$0.081/report)',
        features: ['Excellent structured output', 'Strong Korean', 'Great formatting'],
      },
      gemini: {
        name: 'Google Gemini 3 Flash Preview',
        cost: '$0.50/1M input, $3.00/1M output (~$0.016/report)',
        features: ['Cost-effective', 'Fast', 'Good Korean support'],
      },
    };

    return {
      current: this.provider,
      available: Object.keys(this.clients),
      fallbackOrder: FALLBACK_ORDER.filter(p => this.clients[p]),
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
