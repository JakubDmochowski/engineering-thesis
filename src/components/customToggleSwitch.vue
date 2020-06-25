<template>
  <div @click.prevent="handleClick">
    <label class="flex items-center cursor-pointer">
      <div class="relative">
        <div
          class="w-10 h-4 bg-gray-300 rounded-full shadow-inner"
        />
        <div
          class="toggle-dot absolute w-6 h-6 bg-white rounded-full shadow"
          :class="{ 'active': value }"
        />
      </div>
      <div
        class="ml-3"
        v-text="label"
      />
    </label>
  </div>
</template>

<script>
export default {
  name: 'Checkbox',
  props: {
    value: {
      type: Boolean,
      required: true
    },
    label: {
      type: String,
      default: null
    }
  },
  methods: {
    handleClick() {
      this.$emit('input', !this.value)
    }
  }
}
</script>

<style scoped>
.toggle-dot {
  top: -0.25rem;
  left: -0.25rem;
  transition: all 0.3s ease-in-out;
}
.toggle-dot.active {
  transform: translateX(100%);
  @apply bg-blue-400;
}
</style>