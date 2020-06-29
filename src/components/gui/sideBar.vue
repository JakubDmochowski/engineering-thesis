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
        <div class="rounded shadow p-2 mt-4">
          <span v-text="$tr('sidebar.download.label')" />
          <custom-toggle-switch
            v-model="downloadData.useSVG"
            :label="$tr('sidebar.download.use_svg')"
          />
          <custom-toggle-switch
            v-model="downloadData.useCustomResolution"
            :label="$tr('sidebar.download.use_custom_resolution')"
          />
          <div v-show="downloadData.useCustomResolution" class="mt-2 flex">
            <input
              v-model="downloadData.width"
              class="block shadow rounded border py-2 px-3"
              size="6"
              :placeholder="$tr('sidebar.download.width_placeholder')"
            />
            <div class="mx-1 flex flex-grow justify-center items-center">
              x
            </div>
            <input
              v-model="downloadData.height"
              class="block shadow rounded border py-2 px-3"
              size="6"
              :placeholder="$tr('sidebar.download.height_placeholder')"
            />
          </div>
          <custom-button
            class="mt-4 text-center"
            v-text="$tr('sidebar.download.screenshot_download')"
            @click="download"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CustomToggleSwitch from '../customToggleSwitch'
import CustomButton from '../customButton'

export default {
  name: 'SideBar',
  components: {
    CustomToggleSwitch,
    CustomButton,
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({
    hideDetector: false,
    enableDarkMode: false,
    downloadData: {
      useSVG: true,
      useCustomResolution: false,
      width: null,
      height: null,
    },
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
    download() {
      this.$emit(
        'download',
        {
          ...this.downloadData,
          darkMode: this.enableDarkMode,
        }
      )
    },
    setDarkMode(value) {
      if(!value) {
        if(document.body.classList.contains("dark-mode")) {
          document.body.classList.remove("dark-mode")
        }
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