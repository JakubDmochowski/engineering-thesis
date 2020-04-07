<template>
  <div ref="display"></div>
</template>

<script>
import * as THREE from 'three'
export default {
  mounted() {
    this.init()
    this.render()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  data: () => ({
    camera: null,
    scene: null,
    renderer: null,
    data: [],
  }),
  methods: {
    init() {
      this.camera = new THREE.PerspectiveCamera(
        70,
        this.$refs.display.clientWidth / this.$refs.display.clientHeight,
        0.01,
        10
      );
      this.camera.position.z = 5;
  
      this.scene = new THREE.Scene();
      this.addCube()
      this.addCube()

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(
        this.$refs.display.clientWidth,
        this.$refs.display.clientHeight
      )
      this.$refs.display.appendChild(this.renderer.domElement);
    },
    handleResize() {
      const canvas = this.renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = this.$refs.display.clientWidth !== width || this.$refs.display.clientHeight !== height;
      if (needResize) {
        this.renderer.setSize(
          this.$refs.display.clientWidth,
          this.$refs.display.clientHeight
        )
      }
      return needResize;
    },
    render(time) {
      time *= 0.001;
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();

      this.data.forEach((obj, ndx) => {
        const speed = .1 + ndx * .05;
        const rot = time * speed;
        obj.rotation.x = rot;
        obj.rotation.y = rot;
        // obj.onRender()
        // console.log(ndx)
      });

      this.renderer.render(this.scene, this.camera);

      requestAnimationFrame(this.render);
    },
    addCube() {
      let geometry = new THREE.BoxGeometry();
      let material = new THREE.MeshNormalMaterial({ color: 0x00ff00 });
  
      let mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.data.push(mesh)
    }
  }
}
</script>

<style>
</style>