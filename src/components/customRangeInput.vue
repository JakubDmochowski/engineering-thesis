<template>
  <div>
    <label>
      <slot></slot>
    </label>
    <div class="flex">
      <input
        :value="value"
        @input="handleInput"
        @change="handleChange"
        type="range"
        :min="min"
        :max="max"
        :step="step"
      >
      <div class="flex flex-grow ml-3 justify-center items-center">
        <input
          type="number"
          :style="{
            width: `${maxSize}rem`
          }"
          :value="value"
          @input="handleInput"
          @change="handleChange"
          :size="maxSize"
          :maxlength="maxSize"
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomRangeInput',
  props: {
    value: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    step: {
      type: Number,
      required: true
    },
    maxSize: {
      type: Number,
      default: null
    },
  },
  methods: {
    handleInput(event) {
      this.$emit('input', Number(event.target.value))
    },
    handleChange(event) {
      this.$emit('change', Number(event.target.value))
    }
  }
}
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>