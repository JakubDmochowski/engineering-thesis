<template>
  <div
    class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
    v-on="$listeners"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'CustomButton',
}
</script>

<style>

</style>