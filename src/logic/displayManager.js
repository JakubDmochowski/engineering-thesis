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
    this.data = {
      Tracks: [],
      CaloClusters: [],
    }
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
  updateData(data) {
    const formattedData = Object.keys(this.data).reduce((acc, type) => {
      const typeData = (data[`f${type}`] || []).reduce((acc, curr) => {
        if(!acc.newTracks) {
          acc[`new${type}`] = []
          acc[`changed${type}`] = []
          acc[`unchanged${type}`] = []
        }
        const old = JSON.stringify((this.data[type] || []).find(tr => tr.userData.uuid === curr.uuid) || {})
        if(Object.keys(old).length > 2) {
          if(old === JSON.stringify(curr)) {
            acc[`changed${type}`].push(curr)
          } else {
            acc[`unchanged${type}`].push(curr)
          }
        } else {
          acc[`new${type}`].push(curr)
        }
        return acc
      }, {})
      const stillPresentIds = (data[`f${type}`] || []).map((t) => t.uuid)
      return {
        ...acc,
        ...typeData,
        [`deleted${type}`]: (this.data[type] || [] ).filter((c) => !stillPresentIds.includes(c.userData.uuid)),
      }
    }, {})
    this.removeMeshes([
      ...(formattedData.deletedTracks || []),
      ...(formattedData.deletedCaloClusters || [])
    ])
    this.addTracks(formattedData.newTracks)
    this.addClusters(formattedData.newCaloClusters)
    this.render()
  }
  removeMeshes(meshes) {
    if(!meshes) {
      return
    }
    const objectsToRemove = meshes.map(t => t.userData.uuid)
    this.scene.children
    .filter(c => objectsToRemove.includes(c.userData.uuid))
    .forEach(mesh => {
      mesh.geometry.dispose()
      mesh.material.dispose()
      this.scene.remove(mesh)
    })
  }
  addTracks(tracks) {
    if(!tracks) {
      return
    }
    const colorMap = {
      '1': 0x00ff00,
      '-1': 0x0000ff
    }
    let j = 0
    for(; j < tracks.length; j++) {
      let tmp = []
      let i = 0
      let track = tracks[j % tracks.length]
      for(;i < track.fPolyX.length; i++) {
        tmp.push(new THREE.Vector3(track.fPolyX[i], track.fPolyY[i], track.fPolyZ[i]))
      }
      var curve = new THREE.CatmullRomCurve3(tmp)
      const points = curve.getPoints(15)
      var geometry = new THREE.BufferGeometry().setFromPoints(points)
      var material = new THREE.LineBasicMaterial({color: colorMap[track.fCharge] || 0xff0000})
  
      var curveObject = new THREE.Line(geometry, material)
      curveObject.userData = track
      this.data.Tracks.push(curveObject)
      this.scene.add(curveObject)
    }
  }
  addClusters(clusters) {
    if(!clusters) {
      return
    }
    clusters.forEach(cluster => {
      var geometry = new THREE.SphereGeometry(Math.log10(cluster.fEnergy) * 15, 6, 6)
      var material = new THREE.MeshBasicMaterial({ color: 0x00ff00})
      var point = new THREE.Mesh(geometry, material)
      point.position.set(
        cluster.fR * Math.cos(cluster.fPhi),
        cluster.fR * Math.sin(cluster.fPhi),
        cluster.fZ
      )
      point.userData = cluster
      this.data.CaloClusters.push(point)
      this.scene.add(point)
    })
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
  handleClick() {
    this.pickHelper.pick(event, this.renderer.domElement, this.scene, this.camera)
  }
  handleResize() {
    const canvas = this.renderer.domElement
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight
    this.camera.updateProjectionMatrix()
  }
  render(time) {

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