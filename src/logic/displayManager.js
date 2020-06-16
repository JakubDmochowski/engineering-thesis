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
    this.objectLoader = null
    this.typesManaged = [
      "AliMinimalisticTrack",
      "AliMinimalisticCaloCluster"
    ]
  }
  init(initData = null) {
    const fov = 70
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    const near = 0.1
    const far = 20000
    this.camera = new THREE.PerspectiveCamera(fov,aspect,near,far)
    this.camera.layers.enableAll();
    this.objectLoader = new THREE.ObjectLoader()

    this.scene = new THREE.Scene()
    new DetectorGeometry(this.scene)
    if(initData) {
      this.addTracks(initData.fTracks)
      this.addClusters(initData.fCaloClusters)
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight
    )
    this.canvas.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.camera.position.set( 600, 600, 1200 )
    this.controls.update()
    this.pickHelper = new Tooltip(this.tooltip)
    this.stats = this.createStats()
    this.canvas.appendChild( this.stats.domElement )
    this.render()
    const s = this.scene.clone()
    s.children = s.children.filter(c => c.userData._typename && this.typesManaged.includes(c.userData._typename))
    const ret = s.toJSON()
    s.dispose()
    return ret
  }
  updateWithRawData(data) {
    if(data) {
      console.log(this.scene.children)
      var objectsToRemove = this.scene.children.filter(c => this.typesManaged.includes(c.userData._typename))
      this.removeMeshes(objectsToRemove)
      this.addTracks(data.fTracks)
      this.addClusters(data.fCaloClusters)
    }
    const s = this.scene.clone()
    s.children = s.children.filter(c => c.userData._typename && this.typesManaged.includes(c.userData._typename))
    const ret = s.toJSON()
    s.dispose()
    return ret
  }
  updateData(data) {
    const newScene = this.objectLoader.parse(data)
    const newSceneObjectIds = newScene.children.map(c => c.uuid)
    const oldSceneObjectIds = this.scene.children.map(c => c.uuid)

    const objectsToChange = this.scene.children
      .filter(c => c.userData._typename && this.typesManaged.includes(c.userData._typename))
      .filter(c => newSceneObjectIds.includes(c.uuid))
    const objectsToDispose = newScene.children
      .filter(c => oldSceneObjectIds.includes(c.uuid))
    objectsToChange.forEach(obj => {
      obj.copy(newScene.children.find(c => c.uuid === obj.uuid))
    })
    objectsToDispose.forEach(obj => this.objectDispose(obj))
    this.render()
  }
  objectDispose(object) {
    if(object.children) {
      object.children.forEach(child => {
        this.objectDispose(child)
      })
    } else {
      if(object.geometry) object.geometry.dispose()
      if(object.material) object.material.dispose()
    }
  }
  removeMeshes(meshes) {
    if(!meshes) {
      return
    }
    meshes.forEach(mesh => {
      this.objectDispose(mesh)
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