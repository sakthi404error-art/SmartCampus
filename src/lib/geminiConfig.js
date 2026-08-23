export const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export function resolveGeminiModel(modelName) {
  const normalizedName = (modelName || '').trim().toLowerCase();
  if (normalizedName && GEMINI_MODEL_FALLBACKS.includes(normalizedName)) {
    return normalizedName;
  }

  return GEMINI_MODEL_FALLBACKS[0];
}

export function buildCampusPrompt(message) {
  const cleanMessage = (message || '').trim();

  return `You are Nexus AI, a fast and accurate campus assistant for MBA students at ISSM Smart Campus. Help with attendance policies, leave requests, project submission deadlines, placement prep, campus queries, academic guidance, and ERP usage. Keep answers concise, professional, and action-oriented for MBA students. If the user asks for something unclear, ask one clarifying question or give a practical next step. User question: ${cleanMessage}`;
}
