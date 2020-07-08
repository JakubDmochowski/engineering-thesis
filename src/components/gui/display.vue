<template>
  <div ref="display" class="display relative">
    <div id="tooltip" ref="tooltip">
      asdf
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
  }),
  mounted() {
    this.displayManager = new DisplayManager(
      this.$refs.display,
      this.$refs.tooltip,
      this.value
    )
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('click', this.displayManager.handleClick.bind(this.displayManager))
    this.mounted = true
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('click', this.displayManager.handleClick.bind(this.displayManager))
  },
  watch: {
    value: {
      handler(data) {
        if(this.mounted && this.displayManager) {
          this.displayManager.updateData(data)
        }
      },
      deep: true
    }
  },
  methods: {
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
    updateWithRawData(data) {
      if(this.mounted && this.displayManager) {
        this.$emit('input', this.displayManager.updateWithRawData(data))
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

<style>
</style>