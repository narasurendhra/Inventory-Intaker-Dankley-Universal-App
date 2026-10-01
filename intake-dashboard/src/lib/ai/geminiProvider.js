/**
 * geminiProvider.js
 * 
 * Centralized Google Gemini AI Provider and Token Cost Metering Layer.
 * Supports configurable model tiers (gemini-2.5-flash, gemini-2.5-pro, gemini-3.1-flash-lite)
 * and tracks token consumption for shared or partitioned dispensary billing.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Approximate pricing per 1M tokens (USD)
const MODEL_PRICING = {
  'gemini-2.5-flash': { promptPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-2.5-pro': { promptPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini-3.1-flash-lite': { promptPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini-3.8-flash': { promptPerMillion: 0.075, outputPerMillion: 0.30 }
};

class GeminiProvider {
  /**
   * Get an initialized GoogleGenerativeAI client
   * @param {string} locationId Optional location for location-specific API keys
   * @returns {GoogleGenerativeAI|null}
   */
  static getClient(locationId = '') {
    // Priority: Location-specific key > Default key
    const envKeyName = locationId ? `GEMINI_API_KEY_${locationId.toUpperCase()}` : 'GEMINI_API_KEY';
    const apiKey = process.env[envKeyName] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(`[GEMINI PROVIDER] Warning: No API key found for ${envKeyName}. AI calls will require offline mock.`);
      return null;
    }

    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Get a GenerativeModel instance with strict parameters for deterministic JSON
   * @param {string} modelName 
   * @param {object} customConfig 
   * @param {string} locationId 
   * @returns {any}
   */
  static getModel(modelName = 'gemini-2.5-flash', customConfig = {}, locationId = '') {
    const client = this.getClient(locationId);
    if (!client) return null;

    const defaultConfig = {
      temperature: 0.0,
      responseMimeType: "application/json",
      ...customConfig
    };

    return client.getGenerativeModel({
      model: modelName,
      generationConfig: defaultConfig
    });
  }

  /**
   * Calculate approximate API cost for a completed inference run
   * @param {string} modelName 
   * @param {number} promptTokens 
   * @param {number} candidateTokens 
   * @returns {{ promptTokens: number, candidateTokens: number, totalTokens: number, estimatedCostUsd: number }}
   */
  static calculateUsageCost(modelName = 'gemini-2.5-flash', promptTokens = 0, candidateTokens = 0) {
    const pricing = MODEL_PRICING[modelName] || MODEL_PRICING['gemini-2.5-flash'];
    const promptCost = (promptTokens / 1_000_000) * pricing.promptPerMillion;
    const outputCost = (candidateTokens / 1_000_000) * pricing.outputPerMillion;
    const totalCost = promptCost + outputCost;

    return {
      modelName,
      promptTokens,
      candidateTokens,
      totalTokens: promptTokens + candidateTokens,
      estimatedCostUsd: Number(totalCost.toFixed(6))
    };
  }
}

module.exports = GeminiProvider;
