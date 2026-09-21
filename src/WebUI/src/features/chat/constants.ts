/** Max characters allowed in a single composer message. */
export const MAX_MESSAGE_LENGTH = 2000

/**
 * Seed-driven quick actions (design section B4). Chosen to hit the outdoor-retail seed data:
 * products + price filters, product comparison, manual/how-to (RAG), category → products, and a
 * general LLM question.
 */
export const SUGGESTED_PROMPTS = [
  "What solar power products do you have under $200?",
  "Compare your GPS trackers.",
  "How do I clean my waterproof jacket?",
  "Recommend a hydration system for a day hike.",
  "What's your return policy?",
] as const
