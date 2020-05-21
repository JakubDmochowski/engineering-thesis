<template>
  <div ref="display" class="relative">
    <div id="tooltip" ref="tooltip">
      asdf
      <div id="arrow" data-popper-arrow></div>
    </div>
  </div>
</template>

<script>
import DisplayManager from '../logic/displayManager'

export default {
  props: {
    data: {
      type: Object,
      default: () => []
    }
  },
  mounted() {
    this.displayManager = new DisplayManager(
      this.$refs.display,
      this.$refs.tooltip
    )
    this.displayManager.init()
    this.displayManager.updateData(this.data)
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('click', this.displayManager.handleClick.bind(this.displayManager))
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('click', this.displayManager.handleClick.bind(this.displayManager))
  },
  data: () => ({
    displayManager: null
  }),
  watch: {
    data: {
      handler(data) {
        if(this.displayManager) {
          this.displayManager.updateData(data)
        }
      },
      deep: true
    }
  },
  methods: {
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
canvas {
  outline: none;
}
#tooltip {
  @apply hidden bg-gray-200 shadow rounded-md p-2;
}
#tooltip[data-show] {
  @apply block;
}
#tooltip[data-popper-placement^='top'] > #arrow {
  bottom: -4px;
}
#tooltip[data-popper-placement^='bottom'] > #arrow {
  top: -4px;
}
#tooltip[data-popper-placement^='left'] > #arrow {
  right: -4px;
}
#tooltip[data-popper-placement^='right'] > #arrow {
  left: -4px;
}
#arrow,
#arrow::before {
  @apply absolute;
  width: 8px;
  height: 8px;
  z-index: -1;
}

#arrow::before {
  content: '';
  transform: rotate(45deg);
  @apply bg-gray-200;
}
</style>