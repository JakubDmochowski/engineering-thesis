<template>
  <div class="shadow p-4">
    <h1 v-text="$tr('sidebar.filters.label') + ':'" />
    <div class="flex">
      <div class="cursor-pointer inline-block">
        <custom-toggle-switch
          :value="hideDetector"
          @input="handleHideDetectorToggle"
          :label="$tr('sidebar.filters.hide_detector')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import CustomToggleSwitch from '../customToggleSwitch'

export default {
  name: 'SideBar',
  components: {
    CustomToggleSwitch,
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({
    hideDetector: false
  }),
  methods: {
    handleHideDetectorToggle() {
      this.hideDetector = !this.hideDetector
      let newValue = JSON.parse(JSON.stringify(this.value))
      let geomObj = newValue.object.children.find(c => c.userData && c.userData._typename === 'DetectorGeometry')
      if(geomObj) {
        if(geomObj.visible !== false) {
          geomObj.visible = false
        } else {
          geomObj.visible = true
        }
        this.$emit('input', newValue)
      }
    },
  }
}
</script>

<style>

</style>