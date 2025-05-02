<template>
  <div class="rich-text-editor border rounded-lg overflow-hidden">
    <menu class="flex p-2 gap-2 border-b bg-gray-50">
      <button
        v-for="(item, index) in menuItems"
        :key="index"
        @click="item.action"
        :class="[
          'p-2 rounded hover:bg-gray-200 transition-colors',
          { 'bg-gray-200': item.isActive && item.isActive() }
        ]"
        :title="item.title"
      >
        <component :is="item.icon" class="w-4 h-4" />
      </button>
    </menu>
    
    <div 
      ref="editorRef" 
      class="p-4 min-h-[100px] max-h-[200px] overflow-y-auto"
      @keydown="handleKeyDown"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { Editor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, Italic, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, 
  Heading, Code, Undo, Redo
} from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  editable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'submit']);

const editorRef = ref(null);
const editor = ref(null);

onMounted(() => {
  editor.value = new Editor({
    element: editorRef.value,
    extensions: [
      StarterKit,
    ],
    content: props.modelValue,
    editable: props.editable,
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML());
    },
  });
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

watch(() => props.modelValue, (newValue) => {
  // Only update if the editor exists and the content is different
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue, false);
  }
});

watch(() => props.editable, (newValue) => {
  if (editor.value) {
    editor.value.setEditable(newValue);
  }
});

const handleKeyDown = (event) => {
  // Send message on Enter without Shift
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    emit('submit');
  }
};

const menuItems = computed(() => [
  {
    icon: Bold,
    title: 'Bold',
    action: () => editor.value.chain().focus().toggleBold().run(),
    isActive: () => editor.value?.isActive('bold')
  },
  {
    icon: Italic,
    title: 'Italic',
    action: () => editor.value.chain().focus().toggleItalic().run(),
    isActive: () => editor.value?.isActive('italic')
  },
  {
    icon: Heading,
    title: 'Heading',
    action: () => editor.value.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => editor.value?.isActive('heading', { level: 2 })
  },
  {
    icon: List,
    title: 'Bullet List',
    action: () => editor.value.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value?.isActive('bulletList')
  },
  {
    icon: ListOrdered,
    title: 'Ordered List',
    action: () => editor.value.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value?.isActive('orderedList')
  },
  {
    icon: Code,
    title: 'Code',
    action: () => editor.value.chain().focus().toggleCodeBlock().run(),
    isActive: () => editor.value?.isActive('codeBlock')
  },
  {
    icon: AlignLeft,
    title: 'Align Left',
    action: () => editor.value.chain().focus().setTextAlign('left').run(),
    isActive: () => editor.value?.isActive({ textAlign: 'left' })
  },
  {
    icon: AlignCenter,
    title: 'Align Center',
    action: () => editor.value.chain().focus().setTextAlign('center').run(),
    isActive: () => editor.value?.isActive({ textAlign: 'center' })
  },
  {
    icon: AlignRight,
    title: 'Align Right',
    action: () => editor.value.chain().focus().setTextAlign('right').run(),
    isActive: () => editor.value?.isActive({ textAlign: 'right' })
  },
  {
    icon: Undo,
    title: 'Undo',
    action: () => editor.value.chain().focus().undo().run()
  },
  {
    icon: Redo,
    title: 'Redo',
    action: () => editor.value.chain().focus().redo().run()
  }
]);

// Expose methods
defineExpose({
  focus: () => editor.value?.commands.focus(),
  clear: () => editor.value?.commands.clearContent()
});
</script>