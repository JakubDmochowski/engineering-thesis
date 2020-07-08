<template>
  <div class="shadow p-4">
    <h1 v-text="$tr('sidebar.filters.label') + ':'" />
    <div class="flex">
      <div class="cursor-pointer inline-block">
        <custom-toggle-switch
          v-if="value.meta"
          :value="value.meta.hideDetector"
          @input="handleHideDetectorToggle"
          :label="$tr('sidebar.filters.hide_detector')"
        />
        <custom-toggle-switch
          v-if="value.meta"
          class="mt-2"
          :value="value.meta.wireframe"
          @input="handleWireframeDetectorToggle"
          :label="$tr('sidebar.filters.wireframe')"
        />
        <custom-toggle-switch
          v-if="value.meta"
          class="mt-2"
          :value="value.meta.darkMode"
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
    },
  },
  data: () => ({
    downloadData: {
      useSVG: true,
      useCustomResolution: false,
      width: null,
      height: null,
    },
  }),
  created() {
    this.setDarkMode(this.value.meta.darkMode)
  },
  methods: {
    handleHideDetectorToggle(event) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta.hideDetector = event
      let geomObj = newValue.data
        && newValue.data.object
        && newValue.data.object.children
        && newValue.data.object.children.find(c => c.userData && c.userData._typename === 'DetectorGeometry')
      if(geomObj) {
        geomObj.visible = !event
        this.$emit('input', newValue)
      }
    },
    handleWireframeDetectorToggle(event) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta.wireframe = event
      let obj = newValue.data
        && newValue.data.object
        && newValue.data.object.children
        && newValue.data.object.children.find(c => c.userData && c.userData._typename === 'DetectorGeometry')
      if(obj) {
        const material = newValue.data.materials.find(m => m.uuid === obj.material)
        material.wireframe = event
        this.$emit('input', newValue)
      }
    },
    handleDarkModeToggle(event) {
      this.setDarkMode(event)
    },
    download() {
      this.$emit(
        'download',
        {
          data: this.downloadData,
          meta: {
            darkMode: this.meta.darkMode,
          },
        },
      )
    },
    setDarkMode(value) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta.darkMode = value
      let geomObj = newValue.data
        && newValue.data.object
        && newValue.data.object.children
        && newValue.data.object.children.find(c => c.userData && c.userData._typename === 'DetectorGeometry')
      newValue.meta = {
        ...(newValue.meta || {}),
        darkMode: value,
      }
      if(geomObj) {
        let geomMaterial = newValue.data.materials.find(m => m.uuid === geomObj.material)
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