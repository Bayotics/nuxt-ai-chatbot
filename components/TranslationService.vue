<template>
    <div class="translation-service">
      <div class="flex items-center gap-2 mb-4">
        <label for="language-select" class="font-medium">Translate to:</label>
        <select 
          id="language-select" 
          v-model="selectedLanguage"
          class="border rounded-md px-3 py-2"
          @change="translateText"
        >
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
        
        <button 
          @click="translateText" 
          class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors ml-auto"
          :disabled="isTranslating"
        >
          <span v-if="isTranslating">Translating...</span>
          <span v-else>Translate</span>
        </button>
      </div>
      
      <div v-if="translatedText" class="mt-4 p-4 border rounded-md bg-gray-50">
        <h3 class="font-medium mb-2">Translation ({{ getCurrentLanguageName() }}):</h3>
        <div v-html="translatedText"></div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  const props = defineProps({
    text: {
      type: String,
      required: true
    }
  });
  
  const emit = defineEmits(['translated']);
  
  const isTranslating = ref(false);
  const translatedText = ref('');
  const selectedLanguage = ref('es');
  
  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' }
  ];
  
  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === selectedLanguage.value);
    return lang ? lang.name : '';
  };
  
  const translateText = async () => {
    if (!props.text || isTranslating.value) return;
    
    isTranslating.value = true;
    translatedText.value = '';
    
    try {
      // Call the server API endpoint for translation
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: props.text,
          targetLanguage: selectedLanguage.value
        })
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const result = await response.json();
      translatedText.value = result.translatedText;
      emit('translated', {
        originalText: props.text,
        translatedText: result.translatedText,
        language: selectedLanguage.value
      });
    } catch (error) {
      console.error('Translation error:', error);
      // Handle error appropriately
    } finally {
      isTranslating.value = false;
    }
  };
  </script>