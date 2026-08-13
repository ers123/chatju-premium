// backend/src/services/ai.service.js
// Multi-AI Provider Service - Supports OpenAI, Gemini, and Claude

const logger = require('../utils/logger');

/**
 * Unified AI Service
 *
 * Supports multiple AI providers with ordered fallback chain:
 * - OpenAI GPT-5.4 nano (Primary) — cost-efficient launch default
 * - Anthropic Claude Sonnet 4.6 (Fallback 1) — high-quality recovery
 * - Google Gemini 3 Flash Preview (Fallback 2) — existing Google path
 *
 * Configuration via environment variable:
 * AI_PROVIDER=openai|claude|gemini (default: openai)
 */

// Explicit fallback order — quality-first
const FALLBACK_ORDER = ['openai', 'claude', 'gemini'];

// Per-call upstream timeout. Premium generation legitimately takes 40-50s
// total within the 60s Lambda budget, so this only cuts truly stalled calls.
const AI_CALL_TIMEOUT_MS = parseInt(process.env.AI_CALL_TIMEOUT_MS || '45000', 10);

function envOrDefault(name, fallback) {
  return process.env[name] || fallback;
}

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.models = {
      openai: envOrDefault('OPENAI_MODEL', 'gpt-5.4-nano'),
      openaiFallback: envOrDefault('OPENAI_FALLBACK_MODEL', 'gpt-5.4-mini'),
      gemini: envOrDefault('GEMINI_MODEL', 'gemini-3-flash-preview'),
      claude: envOrDefault('CLAUDE_MODEL', 'claude-sonnet-4-6'),
    };
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
        // Lambda budget is 60s (serverless.yml). The SDK default is 600s with
        // 2 retries — a stalled upstream would eat the whole Lambda without
        // ever triggering the provider fallback chain. Fail fast instead;
        // retries are handled by the model/provider fallback, not the SDK.
        timeout: AI_CALL_TIMEOUT_MS,
        maxRetries: 0,
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
        timeout: AI_CALL_TIMEOUT_MS,
        maxRetries: 0,
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
          tokensUsed = response.usage?.total_tokens || 0;
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

      // Empty output from any provider (refusal, truncation, safety block) is a
      // failure, not a result — throw so the fallback chain below tries the next
      // provider instead of propagating '' into a saved reading.
      if (!response.content || !response.content.trim()) {
        throw new Error(`Provider '${provider}' returned empty content`);
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

  async generateWithOpenAI(messages, maxTokens, temperature) {
    const primaryModel = this.models.openai;
    const fallbackModel = this.models.openaiFallback;

    try {
      return await this.generateWithOpenAIModel(primaryModel, messages, maxTokens, temperature);
    } catch (error) {
      if (!fallbackModel || fallbackModel === primaryModel) {
        throw error;
      }

      logger.warn('OpenAI primary model failed, retrying fallback model', {
        primaryModel,
        fallbackModel,
        error: error.message,
      });

      return this.generateWithOpenAIModel(fallbackModel, messages, maxTokens, temperature);
    }
  }

  /**
   * Generate with OpenAI Chat Completions.
   */
  async generateWithOpenAIModel(model, messages, maxTokens, temperature) {
    // 일부 모델(gpt-5.6 계열 실측)은 temperature 를 기본값 1 외에는 거부한다:
    //   400 Unsupported value: 'temperature' does not support 0.7 with this model.
    // 이 400은 **폴백 체인에 그대로 삼켜진다** — openai 실패 → claude → gemini 로
    // 조용히 넘어가서, 모델을 바꿔 놓고도 다른 제공자의 글을 받고 있게 된다.
    // (2026-08-13 모델 비교에서 실제로 이렇게 오염된 표를 한 번 만들었다.)
    // 그래서 이 특정 거부만 잡아서 temperature 없이 한 번 더 친다.
    const call = (body) => this.clients.openai.chat.completions.create(body);
    const base = { model, messages, max_completion_tokens: maxTokens };

    let completion;
    try {
      completion = await call({ ...base, temperature });
    } catch (err) {
      const unsupportedTemperature = err?.status === 400
        && /temperature/i.test(err?.message || '')
        && /unsupported|does not support|only the default/i.test(err?.message || '');
      if (!unsupportedTemperature) throw err;
      logger.info('Model rejects custom temperature; retrying at its default', { model });
      completion = await call(base);
    }

    const message = completion.choices[0].message;
    const content = message.content || '';

    if (!content && message.refusal) {
      logger.warn('OpenAI refusal:', message.refusal);
    }
    if (!content.trim()) {
      // Throw instead of returning '' so the model fallback (primary → mini)
      // and the provider fallback chain treat this as a failed attempt.
      logger.warn('OpenAI returned empty content', {
        finishReason: completion.choices[0].finish_reason,
        refusal: message.refusal,
        usage: completion.usage,
      });
      throw new Error(`OpenAI returned empty content (finish_reason=${completion.choices[0].finish_reason})`);
    }

    return {
      content,
      usage: completion.usage || { total_tokens: 0 },
      model,
    };
  }

  /**
   * Generate with Google Gemini 3 Flash Preview
   * - Strong Korean support at low cost
   * - $0.50/1M input, $3.00/1M output
   */
  async generateWithGemini(messages, maxTokens, temperature) {
    const model = this.clients.gemini.getGenerativeModel({
      model: this.models.gemini,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }, { timeout: AI_CALL_TIMEOUT_MS });

    // Convert OpenAI message format to Gemini format
    const geminiMessages = this.convertToGeminiFormat(messages);

    const result = await model.generateContent({
      contents: geminiMessages,
    });

    const response = result.response;

    return {
      content: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      model: this.models.gemini,
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
      model: this.models.claude,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: conversationMessages,
    });

    return {
      content: response.content[0].text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: this.models.claude,
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
        name: `OpenAI ${this.models.openai}`,
        cost: '$0.20/1M input, $1.25/1M output for GPT-5.4 nano (~$0.014/report)',
        features: ['Cost-efficient launch default', `Fallback model: ${this.models.openaiFallback}`, 'Production-ready'],
      },
      claude: {
        name: `Anthropic ${this.models.claude}`,
        cost: '$3.00/1M input, $15.00/1M output (~$0.168/report)',
        features: ['Excellent structured output', 'Strong Korean', 'Great formatting'],
      },
      gemini: {
        name: `Google ${this.models.gemini}`,
        cost: '$0.50/1M input, $3.00/1M output for Gemini 3 Flash Preview (~$0.033/report)',
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
