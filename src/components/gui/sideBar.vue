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
        <custom-toggle-switch
          class="mt-2"
          :value="enableDarkMode"
          @input="handleDarkModeToggle"
          :label="$tr('sidebar.filters.enable_dark_mode')"
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
    hideDetector: false,
    enableDarkMode: true,
  }),
  created() {
    this.setDarkMode(this.enableDarkMode)
  },
  methods: {
    handleHideDetectorToggle(event) {
      this.hideDetector = event
      let newValue = JSON.parse(JSON.stringify(this.value))
      let geomObj = newValue.object.children.find(c => c.userData && c.userData._typename === 'DetectorGeometry')
      if(geomObj) {
        geomObj.visible = !event
        this.$emit('input', newValue)
      }
    },
    handleDarkModeToggle(event) {
      this.enableDarkMode = event
      this.setDarkMode(event)
    },
    setDarkMode(value) {
      if(!value && document.body.classList.contains("dark-mode")) {
        document.body.classList.remove("dark-mode")
      } else if(!document.body.classList.contains("dark-mode")) {
        document.body.classList.add("dark-mode")
      }
      //update geometry color
      let newValue = JSON.parse(JSON.stringify(this.value))
      let geomObj = newValue.object && newValue.object.children.find(c => c.userData && c.userData._typename === 'DetectorGeometry')
      if(geomObj) {
        let geomMaterial = newValue.materials.find(m => m.uuid === geomObj.material)
        if(geomMaterial) {
          if(value) {
            geomMaterial.emissive = 0xffff00
          } else {
            geomMaterial.emissive = 0x000000
          }
          this.$emit('input', newValue)
        }
      }
    }
  }
}
</script>

<style>

</style>