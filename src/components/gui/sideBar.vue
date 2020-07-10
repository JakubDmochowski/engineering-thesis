<template>
  <div class="shadow p-4">
    <h1 v-text="$tr('sidebar.filters.label') + ':'" />
    <div class="flex flex-col">
      <template v-if="value.meta">
        <custom-toggle-switch
          :value="value.meta.hideDetector"
          @input="handleHideDetectorToggle"
          :label="$tr('sidebar.filters.hide_detector')"
        />
        <custom-toggle-switch
          class="mt-2"
          :value="value.meta.wireframe"
          @input="handleWireframeDetectorToggle"
          :label="$tr('sidebar.filters.wireframe')"
        />
        <custom-toggle-switch
          class="mt-2"
          :value="value.meta.darkMode"
          @input="handleDarkModeToggle"
          :label="$tr('sidebar.filters.enable_dark_mode')"
        />
        <custom-toggle-switch
          class="mt-2"
          :value="value.meta.lights"
          @input="handleLightsToggle"
          :label="$tr('sidebar.filters.enable_lights')"
        />
        <custom-toggle-switch
          class="mt-2"
          :value="value.meta.disableWorker"
          @input="handleMetaInput($event, 'disableWorker')"
          :label="$tr('sidebar.filters.disable_worker')"
        />
        <custom-toggle-switch
          class="mt-2"
          :value="value.meta.nonblock"
          @input="handleMetaInput($event, 'nonblock')"
          :label="$tr('sidebar.filters.nonblock')"
        />
        <custom-number-input
          class="mt-2"
          :value="value.meta.chunksize"
          @change="handleMetaInput($event, 'chunksize')"
          :label="$tr('sidebar.filters.chunksize')"
        />
        <custom-range-input
          class="mt-2"
          :value="value.meta.opacity"
          @change="handleOpacityChange"
          :min="0"
          :max="1"
          :step="0.005"
          :max-size="5"
        >
          {{ $tr('sidebar.filters.opacity') }}
        </custom-range-input>
      </template>
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
</template>

<script>
import CustomToggleSwitch from '../customToggleSwitch'
import CustomButton from '../customButton'
import CustomRangeInput from '../customRangeInput'
import CustomNumberInput from '../customNumberInput'

export default {
  name: 'SideBar',
  components: {
    CustomToggleSwitch,
    CustomButton,
    CustomRangeInput,
    CustomNumberInput,
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
    getObject(data, typename) {
      return data.data
        && data.data.object
        && data.data.object.children
        && data.data.object.children.find(c => c.userData && c.userData._typename === typename)
    },
    getObjects(data, typenameRegex) {
      return data.data
        && data.data.object
        && data.data.object.children
        && data.data.object.children.filter(c => c.userData && c.userData._typename.match(typenameRegex))
    },
    handleMetaInput(event, field) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta[field] = event
      this.$emit('input', newValue)
    },
    handleHideDetectorToggle(event) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta.hideDetector = event
      let geomObj = this.getObject(newValue, 'DetectorGeometry')
      if(geomObj) {
        geomObj.visible = !event
        this.$emit('input', newValue)
      }
    },
    handleLightsToggle(event) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta.lights = event
      let lights = this.getObjects(newValue, /.*Light$/g)
      lights.forEach(light => {
        light.intensity = event ? 1 : 0
      })      
      let geomObj = this.getObject(newValue, 'DetectorGeometry')
      let geomMaterial = newValue.data.materials.find(m => m.uuid === geomObj.material)
      if(newValue.meta.lights) {
        if(geomMaterial) {
          geomMaterial.emissive = 0x000000
        }
      } else {
        if(geomMaterial) {
          geomMaterial.emissive = newValue.meta.darkMode ? 0xffff00 : 0x000000
        }
      }
      this.$emit('input', newValue)
    },
    handleWireframeDetectorToggle(event) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta.wireframe = event
      let obj = this.getObject(newValue, 'DetectorGeometry')
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
            ...this.value.meta
          },
        },
      )
    },
    handleOpacityChange(event) {
      this.value.meta.opacity = event
      let newValue = JSON.parse(JSON.stringify(this.value))
      let geomObj = this.getObject(newValue, 'DetectorGeometry')
      let geomMaterial = newValue.data.materials.find(m => m.uuid === geomObj.material)
      geomMaterial.opacity = event
      this.$emit('input', newValue)
    },
    setDarkMode(value) {
      let newValue = JSON.parse(JSON.stringify(this.value))
      newValue.meta = {
        ...(newValue.meta || {}),
        darkMode: value,
      }
      if(newValue.data && newValue.data.object) {
        let geomObj = this.getObject(newValue, 'DetectorGeometry')
        let geomMaterial = newValue.data.materials.find(m => m.uuid === geomObj.material)
        let directionalLightObj = this.getObject(newValue, 'DirectionalLight')
        if(directionalLightObj) {
          directionalLightObj.color = value ? 0xffff00 : 0xffffff
        }
        let ambientLightObj = this.getObject(newValue, 'AmbientLight')
        if(ambientLightObj) {
          ambientLightObj.color = value ? 0x535300 : 0x404040
        }
        if(newValue.meta.lights) {
          if(geomMaterial) {
            geomMaterial.emissive = 0x000000
          }
        } else {
          if(geomMaterial) {
            geomMaterial.emissive = value ? 0xffff00 : 0x000000
          }
        }
        this.$emit('input', newValue)
      }
    }
  }
}
</script>

<style>

</style>