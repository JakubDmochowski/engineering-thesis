<template>
  <div ref="display" class="display relative">
    <div id="tooltip" ref="tooltip" @click.stop="handleTooltipClick">
      <div class="wrapper">
        <!-- eslint-disable vue/no-v-html -->
        <span class="text-xs" v-if="tooltipText" v-html="tooltipText" />
        <!-- eslint-enable vue/no-v-html -->
      </div>
      <div id="arrow" data-popper-arrow></div>
    </div>
  </div>
</template>

<script>
import DisplayManager from '../../logic/displayManager'

export default {
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    initiateWith: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({
    displayManager: null,
    mounted: false,
    skipUpdate: false,
    tooltipText: '',
  }),
  mounted() {
    this.displayManager = new DisplayManager(
      this.$refs.display,
      this.$refs.tooltip,
      this.value
    )
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('click', this.handleClick)
    this.mounted = true
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('click', this.handleClick)
  },
  watch: {
    value: {
      handler(data) {
        if(this.skipUpdate) {
          this.skipUpdate = false
        } else if(this.mounted && this.displayManager) {
          this.displayManager.updateData(data)
        }
      },
      deep: true
    }
  },
  methods: {
    handleTooltipClick(event) {
      event.preventDefault()
    },
    handleClick(event) {
      this.intersectingObjects = this.displayManager.handleClick.bind(this.displayManager)(event)
      this.tooltipText = this.intersectingObjects && this.intersectingObjects.map((entry) => `${entry.object.userData._typename}: ${entry.object.uuid}`).join('<br>')
    },
    init(data) {
      const onGeometryLoaded = (response) => {
        this.$emit('input', { data: response })
      }
      this.displayManager
        .init(data, onGeometryLoaded)
        .then(response => {
          this.$emit('input', { data: response })
        })
    },
    updateWithRawData(...args) {
      if(this.mounted && this.displayManager) {
        this.skipUpdate = true
        this.$emit('input', { data: this.displayManager.updateWithRawData(...args) })
      }
    },
    download(data) {
      this.displayManager.download(data)
    },
    handleResize() {
      const canvas = this.displayManager.renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = this.$refs.display.clientWidth !== width || this.$refs.display.clientHeight !== height;
      if (needResize) {
        this.displayManager.renderer.setSize(
          this.$refs.display.clientWidth,
          this.$refs.display.clientHeight
        )
        this.displayManager.handleResize()
      }
      return needResize;
    }
  }
}
</script>

<style scoped>
.wrapper {
  max-height: 15rem;
  @apply overflow-auto;
}
</style>