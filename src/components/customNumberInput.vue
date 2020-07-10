<template>
  <div>
    <div class="flex">
      <input
        type="number"
        class="text-gray-700 border rounded"
        :style="{
          width: `${maxSize}rem`
        }"
        :value="value"
        @input="handleInput"
        @change="handleChange"
        :min="nonNegative ? 0 : null"
      >
      <label class="ml-3">
        {{ label }}
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomRangeInput',
  props: {
    value: {
      type: Number,
      required: true,
    },
    nonNegative: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "",
    },
    maxSize: {
      type: Number,
      default: 5
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