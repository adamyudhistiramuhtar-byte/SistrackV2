<template>
  <input
    ref="el"
    class="input"
    :type="type"
    :placeholder="placeholder"
    :id="internalId"
    :name="name || internalId"
    :autocomplete="autocomplete"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  id: { type: String, default: '' },
  name: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
})
defineEmits(['update:modelValue'])

const el = ref(null)
const internalId = ref(props.id || `input-${Math.random().toString(36).slice(2,9)}`)

onMounted(() => {
  try {
    if (props.id) internalId.value = props.id
  } catch {}
})
</script>

<style scoped>
.input{
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-weight: 600;
  font-family: inherit;
  transition: border-color 0.2s;
}

.input::placeholder{
  color: var(--text-muted);
}

.input:focus{
  outline: none;
  border-color: var(--accent);
}
</style>
