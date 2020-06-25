<template>
  <div class="wrap flex overflow-hidden">
    <div class="h-full flex-grow flex flex-col">
      <mobile-menu class="block lg:hidden" />
      <div :style="{
        'height': '100vh',
        'max-width': displayWidth,
        'width': displayWidth,
      }">
        <display ref="display" v-model="data" v-if="showDisplay" class="w-full h-full" />
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
      v-model="data"
    >
    </side-bar>
  </div>
</template>

<script>
import display from './components/display'
import SideBar from './components/sideBar'
import MobileMenu from './components/mobileMenu'

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
    data: {},
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
    initialize(data) {
      this.$refs.display.init(JSON.parse(data))
      socket.off('initialize', this.initialize)
    },
    updateData(data) {
      // happens when the file data changes, the file is still in ROOT-JSON format
      this.$refs.display.updateWithRawData(JSON.parse(data))
      // Pseudocode: this.GUI.handleDataUpdate(data)
    },
    handleResize() {
      this.currentSideBarWidth = this.$refs.sideBar.$el.clientWidth
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
