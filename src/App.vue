<template>
  <div class="wrap flex overflow-hidden">
    <div class="h-full flex-grow flex flex-col">
      <mobile-menu class="block lg:hidden" />
      <div :style="{
        'height': '100vh',
        'max-width': displayWidth,
        'min-width': displayWidth,
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
        'min-width': desiredSideBarWidth,
        'max-width': desiredSideBarWidth
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

// const filename = 'event4047_run226466.json'

// import uuid from 'uuid'
// import file from '../data/event4047_run226466.json'

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
        disableWorker: false,
        chunksize: 64,
        nonblock: true,
      },
    },
  }),
  created() {
    window.addEventListener('resize', this.handleResize)

    socket.on('initialize', this.initialize)
    socket.on('track', this.updateData)

    // const fields = ['fTracks', 'fCaloClusters', 'fClusters']
    // fields.forEach(field => {
    //   if(file[field]) {
    //     file[field] = file[field].map(track => ({
    //       ...track,
    //       uuid: uuid()
    //     }))
    //   }
    // })
    // const formattedFile = JSON.stringify(file)
    //   .replace(/\{/g, "{\n")
    //   .replace(/\[/g, "[\n")
    //   .replace(/,/g, ",\n")
    // this.download(formattedFile, filename, 'text/plain');
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
    // download(content, fileName, contentType) {
    //     var a = document.createElement("a");
    //     var file = new Blob([content], {type: contentType});
    //     a.href = URL.createObjectURL(file);
    //     a.download = fileName;
    //     a.click();
    // },
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
      const startTime = new Date().getTime()
      this.$refs.display.updateWithRawData({ data: JSON.parse(data), meta: this.data.meta }, startTime)
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
