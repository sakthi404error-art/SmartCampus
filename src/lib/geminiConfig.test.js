const test = require('node:test');
const assert = require('node:assert/strict');

const { GEMINI_MODEL_FALLBACKS, resolveGeminiModel, buildCampusPrompt } = require('./geminiConfig.js');

test('Gemini fallback model list has a valid fast model', () => {
  assert.ok(GEMINI_MODEL_FALLBACKS.includes('gemini-2.0-flash'));
  assert.ok(GEMINI_MODEL_FALLBACKS.length >= 2);
});

test('Campus prompt includes MBA student guidance', () => {
  const prompt = buildCampusPrompt('How do I maintain attendance?');
  assert.match(prompt, /MBA|attendance|campus/i);
});

test('resolveGeminiModel returns a supported fallback', () => {
  assert.equal(resolveGeminiModel('gemini-3.6-flash'), 'gemini-2.0-flash');
  assert.equal(resolveGeminiModel('gemini-2.0-flash'), 'gemini-2.0-flash');
});
