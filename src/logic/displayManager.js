import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer'
import Tooltip from './tooltip'
import DetectorGeometry from './detectorGeometry'
import Stats from 'three/examples/jsm/libs/stats.module.js'

class DisplayManager {
  constructor(canvas = null, tooltip = null, { meta }) {
    this.camera =  null
    this.scene = null
    this.renderer = null
    this.svgRenderer = null
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
    this.darkMode = meta.darkMode
  }
  async init({ data: initData, meta }, callback = null) {
    const fov = 70
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    const near = 0.1
    const far = 20000
    this.camera = new THREE.PerspectiveCamera(fov,aspect,near,far)
    this.camera.layers.enableAll();
    this.objectLoader = new THREE.ObjectLoader()

    this.scene = new THREE.Scene()
    if(initData) {
      this.addObjects(initData)
    }
      const file = './AliceGeometry.json'
      var manager = new THREE.LoadingManager()
      var spinner = document.createElement('div')
      var spinnerBackdrop = document.createElement('div')
      manager.onStart = () => {
        spinner.appendChild(spinnerBackdrop)
        spinner.classList.add("spinner")
        spinner.classList.add("geometry-loader")
        document.body.appendChild(spinner)
      };
      manager.onLoad = () => {
        document.body.removeChild(spinner)
      };
      manager.onError = () => {
        document.body.removeChild(spinner)
      };
      let objectLoader = new THREE.ObjectLoader(manager)
      await objectLoader.load(
        file,
        (data) => {
          new DetectorGeometry(this.scene, { data, meta })
          if(callback) {
            callback(this.scene.toJSON())
          }
        },
        () => {},
        err => console.log(err)
      )
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setClearColor(this.darkMode ? 0x000000 : 0xffffff, 1)
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
    return this.scene.toJSON()
  }
  updateWithRawData(data) {
    if(data) {
      var objectsToRemove = this.scene.children.filter(c => this.typesManaged.includes(c.userData._typename))
      this.removeMeshes(objectsToRemove)
      this.addTracks(data.fTracks)
      this.addClusters(data.fCaloClusters)
    }
    return { data: this.scene.toJSON() }
  }
  updateData({ data, meta }) {
    if(meta) {
      if(typeof meta.darkMode === 'boolean') {
        this.renderer.setClearColor(meta.darkMode ? 0x000000 : 0xffffff, 1)
      }
    }
    const newScene = this.objectLoader.parse(data)
    this.removeMeshes(this.scene.children)
    this.scene.copy(newScene)
    newScene.dispose()
  }
  objectDispose(object) {
    if(object.children) {
      object.children.forEach(child => {
        this.objectDispose(child)
      })
    }
    if(object.geometry) {
      object.geometry.dispose()
    }
    if(object.material) {
      object.material.dispose()
    }
  }
  removeMeshes(meshes) {
    if(!meshes) {
      return
    }
    while(meshes.length) {
      this.objectDispose(meshes[0])
      this.scene.remove(meshes[0])
    }
  }
  download({ data, meta }) {
    var filename = "screenshot_ALICE"
    var url = null
    const imageCamera = this.camera.clone()
    const width = data.useCustomResolution ? data.width || this.canvas.clientWidth : this.canvas.clientWidth
    const height = data.useCustomResolution ? data.height || this.canvas.clientHeight : this.canvas.clientHeight
    imageCamera.aspect = width/height
    imageCamera.updateProjectionMatrix()
    if(!data.useSVG) {
      filename += ".png"
      // this.renderer.setClearColor(data.darkMode ? new THREE.Color(0x000000) : new THREE.Color(0xffffff))
      this.renderer.setSize(
        width,
        height
      )
      this.renderer.render(this.scene, imageCamera)
      url = this.renderer.domElement.toDataURL("image/png").replace("image/png", "image/octet-stream")
      this.renderer.setSize(
        this.canvas.clientWidth,
        this.canvas.clientHeight
      )
    } else {
      filename += ".svg"
      if(!this.svgRenderer) {
        this.svgRenderer = new SVGRenderer()
      }
      const clearColor = new THREE.Color(meta && meta.darkMode ? 0x000000 : 0xffffff)
      this.svgRenderer.setClearColor(clearColor, 1)
      this.svgRenderer.setSize(
        width,
        height
      )
      this.svgRenderer.render(this.scene, imageCamera)
      this.svgRenderer.domElement.setAttribute("xmlns", 'http://www.w3.org/2000/svg')
      const bgrect = document.createElement("rect")
      bgrect.setAttribute('width', '100%')
      bgrect.setAttribute('height', '100%')
      const viewBoxValues = this.svgRenderer.domElement.getAttribute('viewBox').split(/\s+|,/)
      bgrect.setAttribute('x', viewBoxValues[0])
      bgrect.setAttribute('y', viewBoxValues[1])
      bgrect.setAttribute('fill', clearColor.getStyle())
      const firstChild = this.svgRenderer.domElement.children[0]
      this.svgRenderer.domElement.insertBefore(bgrect, firstChild)
      var blobData = new Blob(
        [this.svgRenderer.domElement.outerHTML],
        { type:"image/svg+xml;charset=utf-8" }
      )
      url = URL.createObjectURL(blobData)
    }
    var a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  createTrackObject(track) {
    let tmp = []
    let i = 0
    const colorMap = {
      '1': 0x00ff00,
      '-1': 0x0000ff
    }
    for(;i < track.fPolyX.length; i++) {
      tmp.push(new THREE.Vector3(track.fPolyX[i], track.fPolyY[i], track.fPolyZ[i]))
    }
    var curve = new THREE.CatmullRomCurve3(tmp)
    const points = curve.getPoints(track.fPolyX.length)
    var geometry = new THREE.BufferGeometry().setFromPoints(points)
    var material = new THREE.LineBasicMaterial({color: colorMap[track.fCharge] || 0xff0000})

    var obj = new THREE.Line(geometry, material)
    obj.userData = track
    return obj
  }
  createClusterObject(cluster) {
    var width = 5
    var height = cluster.fEnergy
    var color = 0xDAA520
    var length = 5
    var geometry = new THREE.BoxGeometry(width,height,length)
    var material = new THREE.MeshBasicMaterial({ color })
    var obj = new THREE.Mesh(geometry, material)
    obj.position.set(
      (cluster.fR + height / 2) * Math.cos(cluster.fPhi),
      (cluster.fR + height / 2) * Math.sin(cluster.fPhi),
      cluster.fZ
    )
    obj.lookAt(0,0,obj.position.z)
    obj.rotateX(Math.PI / 2)
    obj.userData = cluster
    return obj
  }
  addObjects(data) {
    this.addTracks(data.fTracks)
    this.addClusters(data.fCaloClusters || data.fClusters)
  }
  addTracks(tracks) {
    (tracks || []).forEach(track => this.scene.add(this.createTrackObject(track)))
  }
  addClusters(clusters) {
    (clusters || []).forEach(cluster => this.scene.add(this.createClusterObject(cluster)))
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