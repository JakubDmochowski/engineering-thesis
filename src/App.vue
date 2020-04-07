<template>
  <div class="wrap flex overflow-hidden">
    <div class="h-full flex-grow flex flex-col">
      <div :style="{
        'max-height': displayHeight,
        'height': displayHeight,
        'max-width': displayWidth,
        'width': displayWidth,
      }">
        <display v-if="showDisplay" class="w-full h-full" />
      </div>
      <div
        ref="bottomBar"
        class="bg-gray-400 hidden lg:block"
        :style="{
          'height': desiredBottomBarHeight,
          'min-height': desiredBottomBarHeight
        }"
      ></div>
    </div>
    <div
      ref="sideBar"
      class="border-l-2 border-gray hidden lg:block"
      :style="{
        'width': desiredSideBarWidth,
        'min-width': desiredSideBarWidth
      }"
    >
    </div>
  </div>
</template>

<script>
import display from './components/display'

export default {
  name: 'App',
  components: {
    display
  },
  data: () => ({
    desiredBottomBarHeight: '10rem',
    desiredSideBarWidth: '20rem',
    currentBottomBarHeight: 0,
    currentSideBarWidth: 0,
    showDisplay: false,
  }),
  created() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  mounted() {
    this.handleResize()
    this.$nextTick(() => {
      this.showDisplay = true
    })
  },
  computed: {
    displayHeight() {
      return `calc(100vh - ${this.currentBottomBarHeight}px)`
    },
    displayWidth() {
      return `calc(100vw - ${this.currentSideBarWidth}px)`
    },
  },
  methods: {
    handleResize() {
      this.currentBottomBarHeight = this.$refs.bottomBar.clientHeight
      this.currentSideBarWidth = this.$refs.sideBar.clientWidth
    }
  }
}
</script>

<style>
.wrap {
  width: 100vw;
  height: 100vh;
}
</style>
