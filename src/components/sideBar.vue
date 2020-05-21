<template>
  <div class="shadow p-4">
    <h1 v-text="$tr('sidebar.filters.label') + ':'" />
    <div class="flex">
      <div @click="handleFilterClick" class="cursor-pointer inline-block">
        <i :class="{
          'fas': true,
          'fa-check': checked,
          'fa-times': !checked
        }" class="w-5" />
        <span class="inline-block ml-4" v-text="'toggleMe'" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SideBar',
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({
    checked: false
  }),
  methods: {
    handleFilterClick() {
      this.checked = !this.checked
      const newData = {
        ...this.data,
        fTracks: this.data.fTracks.slice(this.data.fTracks.length / 2)
      }
      this.$emit('input', newData)
    }
  }
}
</script>

<style>

</style>