<template>
  <div class="wrap flex overflow-hidden">
    <div class="h-full flex-grow flex flex-col">
      <mobile-menu class="block lg:hidden" />
      <div :style="{
        'max-height': displayHeight,
        'height': displayHeight,
        'max-width': displayWidth,
        'width': displayWidth,
      }">
        <display v-model="data" :initiate-with="initData" v-if="showDisplay" class="w-full h-full" />
      </div>
      <bottom-bar
        ref="bottomBar"
        class="hidden lg:block"
        :style="{
          'height': desiredBottomBarHeight,
          'min-height': desiredBottomBarHeight
        }"
      ></bottom-bar>
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
import BottomBar from './components/bottomBar'
import MobileMenu from './components/mobileMenu'
import initData from './data/test1_uuid.json'

export default {
  name: 'App',
  components: {
    display,
    SideBar,
    BottomBar,
    MobileMenu
  },
  data: () => ({
    desiredBottomBarHeight: '10rem',
    desiredSideBarWidth: '15rem',
    currentBottomBarHeight: 0,
    currentSideBarWidth: 0,
    showDisplay: false,
    data: {},
  }),
  created() {
    this.initData = initData
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
      this.currentBottomBarHeight = this.$refs.bottomBar.$el.clientHeight
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
