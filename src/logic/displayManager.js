import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Tooltip from './tooltip'
import DetectorGeometry from './detectorGeometry'
import Stats from 'three/examples/jsm/libs/stats.module.js'

class DisplayManager {
  constructor(canvas = null, tooltip = null) {
    this.camera =  null
    this.scene = null
    this.renderer = null
    this.stats = null
    this.controls = null
    this.pickHelper = null
    this.canvas = canvas
    this.tooltip = tooltip
  }
  init() {
    const fov = 70
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    const near = 0.1
    const far = 20000
    this.camera = new THREE.PerspectiveCamera(fov,aspect,near,far)
    this.camera.layers.enableAll();

    this.scene = new THREE.Scene()
    new DetectorGeometry(this.scene)

    this.addTracks(data.fTracks)
    if (data.fCaloClusters) {
      this.addClusters(data.fCaloClusters)
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight
    )
    this.canvas.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.camera.position.set( 0, 0, 1500 )
    this.controls.update()
    this.pickHelper = new Tooltip(this.tooltip)
    this.stats = this.createStats()
    this.canvas.appendChild( this.stats.domElement )
    this.render()
  }
  createStats() {
    var stats = new Stats()
    stats.setMode(0)

    stats.domElement.style.position = 'absolute'
    stats.domElement.style.right = '0'
    stats.domElement.style.bottom = '0'
    stats.domElement.style.top = 'initial'
    stats.domElement.style.left = 'initial'

    return stats
  }
  addTracks(tracks) {
    const colorMap = {
      '1': 0x00ff00,
      '-1': 0x0000ff
    }
    tracks.forEach(track => {
      let tmp = []
      let i = 0
      for(;i < track.fPolyX.length; i++) {
        tmp.push(new THREE.Vector3(track.fPolyX[i], track.fPolyY[i], track.fPolyZ[i]))
      }
      var curve = new THREE.CatmullRomCurve3(tmp)
      const points = curve.getPoints(50)
      var geometry = new THREE.BufferGeometry().setFromPoints(points)
      var material = new THREE.LineBasicMaterial({color: colorMap[track.fCharge] || 0xff0000})
  
      var curveObject = new THREE.Line(geometry, material)
      this.scene.add(curveObject)
    })
  }
  addClusters(clusters) {
    clusters.forEach(cluster => {
      var geometry = new THREE.SphereGeometry(Math.log10(cluster.fEnergy) * 15, 6, 6)
      var material = new THREE.MeshBasicMaterial({ color: 0x00ff00})
      var point = new THREE.Mesh(geometry, material)
      point.position.set(
        cluster.fR * Math.cos(cluster.fPhi),
        cluster.fR * Math.sin(cluster.fPhi),
        cluster.fZ
      )
      this.scene.add(point)
    })
  }
  handleClick() {
    this.pickHelper.pick(event, this.renderer.domElement, this.scene, this.camera)
  }
  render(time) {
    const canvas = this.renderer.domElement
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight
    this.camera.updateProjectionMatrix()

    this.scene.children
      .filter(mesh => mesh.userData.onRender)
      .forEach((mesh) => {
        mesh.userData.onRender(time)
      })

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    this.stats.update();
    requestAnimationFrame((time) => this.render(time))
  }
}

export default DisplayManager