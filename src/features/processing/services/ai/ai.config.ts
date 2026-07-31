export const AI_CONFIG = {
  /**
   * Maximum length of the document text sent to the AI provider.
   * Protects the model from context window limits and controls costs.
   */
  MAX_INPUT_LENGTH: 15000,
  
  /**
   * Default model for structured JSON generation.
   */
  MODEL: "llama-3.3-70b-versatile",
  
  /**
   * Model temperature for extraction tasks (0 = most deterministic).
   */
  TEMPERATURE: 0,
  
  /**
   * Maximum tokens to generate in the response.
   */
  MAX_TOKENS: 1000,
};
