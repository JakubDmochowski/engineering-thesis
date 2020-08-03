import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer'
import Tooltip from './tooltip'
import DetectorGeometry from './detectorGeometry'
import Stats from 'three/examples/jsm/libs/stats.module.js'

const tests_filename = 'performance.csv'
let fileData = ""

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
      "AliMinimalisticCaloCluster",
      "AliMinimalisticCluster",
    ]
    this.darkMode = meta.darkMode
    this.spinner = null
    this.spinnerCount = 0
    this.updateWorker = null
    this.startTime = 0
  }
  async init({ data: initData, meta }, callback = null) {
    const fov = 70
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    const near = 0.1
    const far = 20000
    this.camera = new THREE.PerspectiveCamera(fov,aspect,near,far)
    this.camera.layers.enableAll();
    this.camera.position.set( 600, 600, 1200 )
    this.objectLoader = new THREE.ObjectLoader()

    this.scene = new THREE.Scene()
    if(initData) {
      this.addObjects(initData)
    }
    const file = './AliceGeometry.json'
    var manager = new THREE.LoadingManager()
    manager.onStart = this.startSpinner
    manager.onLoad = this.endSpinner
    manager.onError = this.endSpinner
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
    var lights = {
      ambient: new THREE.AmbientLight(
        this.darkMode ? 0x535300 : 0x404040,
        meta && meta.lights ? 1 : 0
      ),
      directional: new THREE.DirectionalLight(
        this.darkMode ? 0xffff00 : 0xffffff,
        meta && meta.lights ? 1 : 0
      )
    }
    Object.values(lights).forEach(light => {
      light.userData = {
        _typename: light.type
      }
      this.scene.add(light)
    })

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setClearColor(
      this.darkMode ? 0x000000 : 0xffffff,
      1
    )
    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight
    )
    this.canvas.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.update()
    this.pickHelper = new Tooltip(this.tooltip)
    this.stats = this.createStats()
    this.canvas.appendChild(this.stats.domElement)
    this.render()

    const fileStart = `Number of existing objects;Number of objects added;Number of objects removed;Updated in\n`
    const timeGatheringTests = 1000*60*2
    fileData = fileStart
    setTimeout(() => {
      this.downloadTestData()
    }, timeGatheringTests)
    return this.scene.toJSON()
  }
  downloadTestData() {
    this.downloadTests(fileData, tests_filename, 'text/plain')
  }
  downloadTests(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }
  startSpinner() {
    if(!this.spinner) {
      this.spinner = document.createElement('div')
      var spinnerBackdrop = document.createElement('div')
      this.spinner.appendChild(spinnerBackdrop)
      this.spinner.classList.add("spinner")
      this.spinner.classList.add("geometry-loader")
    }
    if(!this.spinnerCount++) {
      document.body.appendChild(this.spinner)
    }
  }
  endSpinner() {
    if(!--this.spinnerCount) {
      document.body.removeChild(this.spinner)
    }
  }
  updateWithRawData({ data, meta }, startTime) {
    let testRecord = ""
    this.startSpinner()
    if(data) {
      // testRecord = `${this.scene.children.length}`
      // console.log("Number of objects before update:", this.scene.children.length)
      const removeMeshesArgs = meta.nonblock
        ? [c => this.typesManaged.includes(c.userData._typename), meta.chunksize || 64]
        : [this.scene.children.filter(c => this.typesManaged.includes(c.userData._typename))]
        
        testRecord = `${(data.fClusters || []).length + (data.fTracks || []).length + (data.fCaloClusters || []).length};${this.scene.children.filter(c => this.typesManaged.includes(c.userData._typename)).length}`
        // console.log("Number of objects added:", (data.fClusters || []).length + (data.fTracks || []).length + (data.fCaloClusters || []).length)
        // console.log("Number of objects removed:", this.scene.children.filter(c => this.typesManaged.includes(c.userData._typename)).length)
      this.removeMeshes(meta.nonblock, ...removeMeshesArgs)
        .then(() => {
          this.addObjects(data)
          testRecord = `${testRecord};${new Date().getTime() - startTime}\n`
          // console.log("Number of objects after update:", this.scene.children.length)
          // console.log(`Updated in: ${new Date().getTime() - startTime}ms`)
          fileData = fileData.concat(testRecord)
          this.endSpinner()
        })
    }
    return this.scene.toJSON()
  }
  addTestRecord(value, endTime) {
    fileData = fileData.concat(`${value};${endTime - this.startTime}\n`)
    this.startTime = 0
  }
  updateData({ data, meta }) {
    this.startTime = new Date().getTime()
    let testRecord = ""
    if(meta) {
      if(typeof meta.darkMode === 'boolean') {
        this.renderer.setClearColor(meta.darkMode ? 0x000000 : 0xffffff, 1)
      }
    }
    const oldData = this.scene.toJSON()

    if(!this.updateWorker && !meta.disableWorker) {
      this.updateWorker = new Worker('dataUpdateWorker.js')
      if(typeof(this.updateWorker) !== "undefined") {
        this.updateWorker.addEventListener("message", (event) => {
          const diffScene = this.objectLoader.parse(event.data)
          const diffObjectUuids = diffScene.children.map(c => c.uuid)
          testRecord = `${this.scene.children.length};${diffScene.children.length};${this.scene.children.filter(m => diffObjectUuids.includes(m.uuid)).length}`
          const removeMeshesArgs = meta.nonblock
            ? [m => diffObjectUuids.includes(m.uuid), meta.chunksize || 64]
            : [this.scene.children.filter(m => diffObjectUuids.includes(m.uuid))]
          const addMeshesArgs = meta.nonblock
            ? [diffScene.children, meta.chunksize || 64]
            : [diffScene.children]
          this.removeMeshes(meta.nonblock, ...removeMeshesArgs)
            .then(() => {
              this.addMeshes(meta.nonblock, ...addMeshesArgs)
              this.addTestRecord(testRecord, new Date().getTime())
            })
          diffScene.dispose()
          this.endSpinner()
        })
      }
    }
    if(typeof(this.updateWorker) !== "undefined" && !meta.disableWorker) {
      this.updateWorker.postMessage({ new: data, old: oldData })
      this.startSpinner()
    } else {
      if(typeof(this.updateWorker) === "undefined") {
        console.log("sorry, your browser does not support Web Workers")
      }
      const newChildren = data.object.children.filter(
        c => {
          const co = oldData.object.children.find(co => co.uuid === c.uuid)
          if(JSON.stringify(co) !== JSON.stringify(c)) return true
          const cMaterial = data.materials.find(m => m.uuid === c.material)
          const coMaterial = oldData.materials.find(m => m.uuid === co.material)
          if(JSON.stringify(coMaterial) !== JSON.stringify(cMaterial)) return true
          const cGeometry = data.geometries.find(m => m.uuid === c.geometry)
          const coGeometry = oldData.geometries.find(m => m.uuid === co.geometry)
          if(JSON.stringify(coGeometry) !== JSON.stringify(cGeometry)) return true
          return false
        })
      const newGeometries = newChildren.map(c => c.geometry)
      const newMaterials = newChildren.map(c => c.material)
      const differenceData = {
        object: {
          ...data.object,
          children: newChildren
        },
        geometries: data.geometries.filter(g => newGeometries.includes(g.uuid)),
        materials: data.materials.filter(g => newMaterials.includes(g.uuid)),
        metadata: data.metadata,
      }
      const diffScene = this.objectLoader.parse(differenceData)
      const diffObjectUuids = diffScene.children.map(c => c.uuid)
      testRecord = `${this.scene.children.length};${diffScene.children.length};${this.scene.children.filter(m => diffObjectUuids.includes(m.uuid)).length}`
      const removeMeshesArgs = meta.nonblock
        ? [m => diffObjectUuids.includes(m.uuid), meta.chunksize || 64]
        : [this.scene.children.filter(m => diffObjectUuids.includes(m.uuid))]
      const addMeshesArgs = meta.nonblock
        ? [diffScene.children, meta.chunksize || 64]
        : [diffScene.children]
      this.removeMeshes(meta.nonblock, ...removeMeshesArgs)
        .then(() => {
          this.addMeshes(meta.nonblock, ...addMeshesArgs)
          this.addTestRecord(testRecord, new Date().getTime())
        })
      diffScene.dispose()
    }
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
  addMeshes(nonblock, ...args) {
    if(nonblock) {
      return this.addMeshesNonBlock(...args)
    } else {
      return this.addMeshesBlock(...args)
    }
  }
  addMeshesNonBlock(meshes, chunksize) {
    if (meshes.length) {
      return new Promise(resolve => {
        setTimeout(
          () => {
            const max = Math.min(meshes.length, chunksize)
            meshes.slice(0, max).forEach(mesh => {
              this.scene.add(mesh)
            })
            setTimeout(
              () => resolve(this.addMeshesNonBlock(meshes.slice(max), chunksize)),
              0
            )
          },
          0
        )
      })
    } else {
      return new Promise(resolve => resolve())
    }
  }
  addMeshesBlock(meshes) {
    meshes.forEach(mesh => {
      this.scene.add(mesh)
    })
    return new Promise(resolve => resolve())
  }
  removeMeshes(nonblock, ...args) {
    if(nonblock) {
      return this.removeMeshesNonBlock(...args)
    } else {
      return this.removeMeshesBlock(...args)
    }
  }
  removeMeshesBlock(meshes) {
    if(!meshes) {
      return 
    }
    for(var i = meshes.length - 1; i >= 0; i--) {
      this.objectDispose(meshes[i])
      this.scene.remove(meshes[i])
    }
    return new Promise(resolve => resolve())
  }
  removeMeshesNonBlock(filter = () => true, chunksize) {
    const meshes = this.scene.children.filter(filter)
    if (meshes.length) {
      return new Promise(resolve => {
        setTimeout(
          () => {
            for(var i = Math.min(meshes.length - 1, chunksize); i >= 0; i--) {
              this.objectDispose(meshes[i])
              this.scene.remove(meshes[i])
            }
            setTimeout(
              () => resolve(this.removeMeshesNonBlock(filter, chunksize)),
              0
            )
          },
          0
        )
      })
    } else {
      return new Promise(resolve => resolve())
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
    let points = []
    let i = 0
    const colorMap = {
      '1': 0x00ff00,
      '-1': 0x0000ff
    }
    for(;i < track.fPolyX.length; i++) {
      points.push(new THREE.Vector3(track.fPolyX[i], track.fPolyY[i], track.fPolyZ[i]))
    }
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