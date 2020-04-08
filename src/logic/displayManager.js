import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Tooltip from './tooltip'

class DisplayManager {
  constructor(canvas = null, tooltip = null) {
    this.camera =  null
    this.scene = null
    this.renderer = null
    this.controls = null
    this.pickHelper = null
    this.canvas = canvas
    this.tooltip = tooltip
    this.data = []
  }
  init() {
    const fov = 70
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    const near = 0.1
    const far = 200
    this.camera = new THREE.PerspectiveCamera(fov,aspect,near,far)

    this.scene = new THREE.Scene()
    this.addCube()
    this.addCube()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight
    )
    this.canvas.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.camera.position.set( 0, 0, 5 )
    this.controls.update()
    this.pickHelper = new Tooltip(this.tooltip)
    this.render()
  }
  handleClick() {
    this.pickHelper.pick(event, this.renderer.domElement, this.scene, this.camera)
  }
  render(time) {
    time *= 0.001
    const canvas = this.renderer.domElement
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight
    this.camera.updateProjectionMatrix()

    this.data.forEach((obj, ndx) => {
      const speed = .1 + ndx * .05
      const rot = time * speed
      obj.rotation.x = rot
      obj.rotation.y = rot
      // obj.onRender()
      // console.log(ndx)
    });

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    requestAnimationFrame((time) => this.render(time))
  }
  addCube() {
    let geometry = new THREE.BoxGeometry()
    let material = new THREE.MeshNormalMaterial({ color: 0x00ff00 })

    let mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)
    this.data.push(mesh)
  }
}

export default DisplayManager