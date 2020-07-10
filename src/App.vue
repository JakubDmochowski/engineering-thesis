<template>
  <div class="wrap flex overflow-hidden">
    <div class="h-full flex-grow flex flex-col">
      <mobile-menu class="block lg:hidden" />
      <div :style="{
        'height': '100vh',
        'max-width': displayWidth,
        'width': displayWidth,
      }">
        <display
          ref="display"
          :value="data"
          @input="handleInput"
          v-if="showDisplay"
          class="w-full h-full"
        />
      </div>
    </div>
    <side-bar
      ref="sideBar"
      v-if="data"
      class="hidden lg:block"
      :style="{
        'width': desiredSideBarWidth,
        'min-width': desiredSideBarWidth
      }"
      :value="data"
      @input="handleInput"
      @download="handleDownload"
    >
    </side-bar>
  </div>
</template>

<script>
import display from './components/gui/display'
import SideBar from './components/gui/sideBar'
import MobileMenu from './components/gui/mobileMenu'

import io from 'socket.io-client'

const socket = io(process.env.VUE_APP_DATA_SOCKET_URL)

export default {
  name: 'App',
  components: {
    display,
    SideBar,
    MobileMenu
  },
  data: () => ({
    desiredSideBarWidth: '16rem',
    currentSideBarWidth: 0,
    showDisplay: false,
    data: {
      data: {},
      meta: {
        lights: true,
        hideDetector: false,
        wireframe: true,
        darkMode: false,
        opacity: 0.05,
      },
    },
  }),
  created() {
    window.addEventListener('resize', this.handleResize)

    socket.on('initialize', this.initialize)
    socket.on('track', this.updateData)
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
    displayWidth() {
      return `calc(100vw - ${this.currentSideBarWidth}px)`
    },
  },
  methods: {
    handleInput(data) {
      this.$set(
        this,
        'data',
        {
          ...this.data,
          ...data
        }
      )
    },
    initialize(data) {
      this.$refs.display.init({ data: JSON.parse(data), meta: this.data.meta })
      socket.off('initialize', this.initialize)
    },
    updateData(data) {
      // happens when the file data changes, the file is still in ROOT-JSON format
      this.$refs.display.updateWithRawData({ data: JSON.parse(data) })
      // Pseudocode: this.GUI.handleDataUpdate(data)
    },
    handleResize() {
      this.currentSideBarWidth = this.$refs.sideBar.$el.clientWidth
    },
    handleDownload(data = null) {
      this.$refs.display.download(data)
    },
  }
}
</script>

<style>
.wrap {
  width: 100vw;
  height: 100vh;
}
</style>
