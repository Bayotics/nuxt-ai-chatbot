import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text, targetLanguage } = body;
    
    if (!text || !targetLanguage) {
      return createError({
        statusCode: 400,
        message: 'Missing required parameters'
      });
    }
    
    // Map language code to full name for better prompt
    const languageMap = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic'
    };
    
    const targetLanguageName = languageMap[targetLanguage] || targetLanguage;
    
    // Use AI SDK to translate the text
    const { text: translatedText } = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are a professional translator. Translate the given text to ${targetLanguageName} while preserving the original meaning, tone, and formatting. Return only the translated text without explanations.`,
      prompt: text
    });
    
    return {
      translatedText
    };
  } catch (error) {
    console.error('Translation API error:', error);
    return createError({
      statusCode: 500,
      message: 'Translation service error'
    });
  }
});