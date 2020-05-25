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
    value: {
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
      const tracks = this.value.object.children.filter(c => c.userData && c.userData._typename === 'AliMinimalisticTrack')
      const tracksToRemove = tracks.slice(tracks.length / 2)
      const objectsToRemove = tracksToRemove.map(t => t.uuid)
      const geometriesToRemove = tracksToRemove.map(t => t.geometry)
      const materialsToRemove = tracksToRemove.map(t => t.material)
      const newData = {
        geometries: this.value.geometries.filter(g => !geometriesToRemove.includes(g.uuid)),
        materials: this.value.materials.filter(g => !materialsToRemove.includes(g.uuid)),
        object: {
          ...this.value.object,
          children: this.value.object.children.filter(c => !objectsToRemove.includes(c.uuid))
        }
      }
      this.$emit('input', newData)
    },
  }
}
</script>

<style>

</style>