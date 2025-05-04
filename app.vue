<template>
  <div class="app-container">
    <!-- App-wide elements like header, navigation, etc. -->
    <header v-if="showHeader" class="bg-white shadow-sm p-4">
      <div class="container mx-auto">
        <h1 class="text-2xl font-bold text-emerald-600">AI Chatbot with Live Cursors</h1>
        <!-- Add navigation or other header elements here -->
      </div>
    </header>

    <!-- This is where your pages will be rendered -->
    <NuxtPage />

    <!-- App-wide footer -->
    <footer v-if="showFooter" class="bg-white p-4 border-t">
      <div class="container mx-auto text-center text-gray-600">
        &copy; {{ new Date().getFullYear() }} AI Chatbot. Created by Abdullahi Sho
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

// You can use route to conditionally show/hide elements
const route = useRoute();

// Example: Hide header/footer on specific routes
const showHeader = computed(() => !route.meta.hideHeader);
const showFooter = computed(() => !route.meta.hideFooter);
</script>

<style>

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Global styles can be added here */
body {
  font-family: 'Inter', sans-serif;
  color: #333;
  background-color: #f9fafb;
}
</style>