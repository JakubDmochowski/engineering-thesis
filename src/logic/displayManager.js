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
      "AliMinimalisticCaloCluster",
      "AliMinimalisticCluster",
    ]
    this.darkMode = meta.darkMode
    this.spinner = null
    this.spinnerCount = 0
    this.updateWorker = null
    this.infobox = {
      object: null,
      distanceFromCamera: 2,
      aspectRatio: 16 / 9,
      requestedHeight: 100, //in pixels
      height: null,
      width: null,
    }
  }
  async init({ data: initData, meta }, callback = null) {
    const fov = 90
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    const near = 1.95
    const far = 20000
    this.camera = new THREE.PerspectiveCamera(fov,aspect,near,far)
    this.camera.layers.enableAll();
    this.camera.position.set( 450, 450, 900 )
    this.objectLoader = new THREE.ObjectLoader()

    this.scene = new THREE.Scene()
    if(initData) {
      this.addObjects(initData)
      this.addInfoboxText(`run: ${initData.fRunID}\nevent: ${initData.fEventID}`)
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
    var infoboxMaterial = new THREE.MeshBasicMaterial({ color: 0xdddddd })
    var infoboxBackground = new THREE.PlaneGeometry(1, 1, 1, 1)
    this.infobox.object = new THREE.Mesh(infoboxBackground, infoboxMaterial)
    this.infobox.object.userData = {
      _typename: 'Infobox',
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setClearColor(
      this.darkMode ? 0x000000 : 0xffffff,
      1
    )
    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight
    )
    this.scene.add(this.infobox.object)
    this.adjustInfobox()
    this.canvas.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.update()
    this.pickHelper = new Tooltip(this.tooltip)
    this.stats = this.createStats()
    this.canvas.appendChild(this.stats.domElement)
    this.render()
    return this.scene.toJSON()
  }
  addInfoboxText(message) {
    const currentMessage = this.infobox.object
      && this.infobox.object.children
      && this.infobox.object.children.find(c => c.userData._typename === 'InfoboxText')
    if(currentMessage) {
      this.objectDispose(currentMessage)
      this.infobox.object.remove(currentMessage)
    }
    var loader = new THREE.FontLoader();
    loader.load( 'fonts/helvetiker_regular.typeface.json', ( font ) => {
      var text;
      var color = 0x006699;
      var matDark = new THREE.LineBasicMaterial( {
        color: color,
        side: THREE.DoubleSide
      } );
      var matLite = new THREE.MeshBasicMaterial( {
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      } );
      var shapes = font.generateShapes( message, 100 );
      var exampleShape = font.generateShapes("Text", 100)
      let geometry = new THREE.ShapeBufferGeometry( shapes );
      let exampleTextGeometry = new THREE.ShapeBufferGeometry(exampleShape)
      geometry.computeBoundingBox();
      exampleTextGeometry.computeBoundingBox()
      const fontSize = this.getFontSize()
      const currentFontSize = exampleTextGeometry.boundingBox.max.y - exampleTextGeometry.boundingBox.min.y
      const screenheight = 2*this.infobox.distanceFromCamera*(Math.tan(this.camera.fov / 360 * Math.PI))
      let fontScale = (screenheight / this.canvas.clientHeight) * (fontSize / currentFontSize)
      geometry.scale(fontScale, fontScale, 1)
      text = new THREE.Mesh( geometry, matLite );
      // make shape ( N.B. edge view not visible )
      // make line shape ( N.B. edge view remains visible )
      var holeShapes = [];
      for ( var i = 0; i < shapes.length; i ++ ) {
        let shape = shapes[ i ];
        if ( shape.holes && shape.holes.length > 0 ) {
          for ( var j = 0; j < shape.holes.length; j ++ ) {
            var hole = shape.holes[ j ];
            holeShapes.push( hole );
          }
        }
      }
      shapes.push.apply( shapes, holeShapes );
      var lineText = new THREE.Object3D();
      for ( let i = 0; i < shapes.length; i ++ ) {
        let shape = shapes[ i ];
        var points = shape.getPoints();
        let geometry = new THREE.BufferGeometry().setFromPoints( points );
        geometry.scale(fontScale, fontScale, 1)
        var lineMesh = new THREE.Line( geometry, matDark );
        lineText.add( lineMesh );
      }
      if(this.infobox.object.children.length) {
        this.removeMeshes(false, this.infobox.object.children)
      }
      const mesh = new THREE.Mesh()
      mesh.userData = {
        _typename: 'InfoboxText'
      }
      mesh.add(text)
      mesh.add(lineText)
      this.infobox.object.add(mesh)
      const displacement = this.moveOnDisplayInPixels([fontSize, -fontSize * 3/2])
      mesh.translateX(-0.5 + displacement.x)
      mesh.translateY(0.5 + displacement.y)
      mesh.translateZ(0.04)
      mesh.scale = new THREE.Vector3(1/this.infobox.aspectRatio, 1, 1)
    } )
  }
  moveOnDisplayInPixels(displacement) {
    const [x, y] = displacement
    const screenheight = 2*this.infobox.distanceFromCamera*(Math.tan(this.camera.fov / 360 * Math.PI))
    const screenAspectRatio = this.canvas.clientWidth / this.canvas.clientHeight
    const screenwidth = (screenheight * screenAspectRatio)
    const yPixel = screenheight / this.canvas.clientHeight
    const xPixel = screenwidth / this.canvas.clientWidth
    return new THREE.Vector3(xPixel * x, yPixel * y, 1)
  }
  getFontSize() {
    var el = document.querySelector("body")
    var style = window.getComputedStyle(el, null).getPropertyValue('font-size')
    var fontSize = parseFloat(style)
    return fontSize
  }
  async adjustInfobox() {
    const screenheight = 2*this.infobox.distanceFromCamera*(Math.tan(this.camera.fov / 360 * Math.PI))
    this.infobox.height = this.infobox.requestedHeight / this.canvas.clientHeight * screenheight
    this.infobox.width = this.infobox.aspectRatio * this.infobox.height
    this.infobox.object.scale = new THREE.Vector3(this.infobox.width, this.infobox.height, 1)
    let newPosition = this.camera.position.clone()

    let cameraDirection = new THREE.Vector3()
    this.camera.getWorldDirection(cameraDirection)
    cameraDirection.multiplyScalar(this.infobox.distanceFromCamera)
    newPosition.add(cameraDirection)
    cameraDirection.multiplyScalar(1/this.infobox.distanceFromCamera)

    const rightDisplacementCoefficient = -(this.infobox.distanceFromCamera * this.camera.aspect - this.infobox.width / 2)
    const upDisplacementCoefficient = -((((2*this.infobox.distanceFromCamera) / this.infobox.height) - 1)/2) * this.infobox.height
    this.displaceWrtCamera(
      newPosition,
      {
        up: upDisplacementCoefficient,
        right: rightDisplacementCoefficient
      }
    )
    this.infobox.object.position = newPosition

    let cameraOrientation = this.camera.quaternion.clone()
    this.infobox.object.setRotationFromQuaternion(cameraOrientation)
  }
  displaceWrtCamera(position, displacement) {
    const { up, right } = displacement
    let displ = new THREE.Vector3()
    this.camera.getWorldDirection(displ)
    displ.cross(this.camera.up)
    displ.normalize()
    displ.multiplyScalar(right)
    position.add(displ)
    displ.multiplyScalar(1/right)
    let cameraDirection = new THREE.Vector3()
    this.camera.getWorldDirection(cameraDirection)
    displ.cross(cameraDirection)
    displ.normalize()
    displ.multiplyScalar(up)
    position.add(displ)
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
    this.startSpinner()
    if(data) {
      const removeMeshesArgs = meta.nonblock
        ? [c => this.dataTypes.dynamic.includes(c.userData._typename), meta.chunksize || 64]
        : [this.scene.children.filter(c => this.dataTypes.dynamic.includes(c.userData._typename))]
      this.removeMeshes(meta.nonblock, ...removeMeshesArgs)
        .then(() => {
          this.addObjects(data)
          this.addInfoboxText(`run: ${data.fRunID}\nevent: ${data.fEventID}`)
          console.log(`updatedIn: ${new Date().getTime() - startTime}ms`)
          this.endSpinner()
        })
    }
    return this.scene.toJSON()
  }
  updateData({ data, meta }) {
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
          const removeMeshesArgs = meta.nonblock
            ? [m => diffObjectUuids.includes(m.uuid), meta.chunksize || 64]
            : [this.scene.children.filter(m => diffObjectUuids.includes(m.uuid))]
          const addMeshesArgs = meta.nonblock
            ? [diffScene.children, meta.chunksize || 64]
            : [diffScene.children]
          this.removeMeshes(meta.nonblock, ...removeMeshesArgs)
            .then(() => {
              this.addMeshes(meta.nonblock, ...addMeshesArgs)
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
      const removeMeshesArgs = meta.nonblock
        ? [m => diffObjectUuids.includes(m.uuid), meta.chunksize || 64]
        : [this.scene.children.filter(m => diffObjectUuids.includes(m.uuid))]
      const addMeshesArgs = meta.nonblock
        ? [diffScene.children, meta.chunksize || 64]
        : [diffScene.children]
      this.removeMeshes(meta.nonblock, ...removeMeshesArgs)
        .then(() => {
          this.addMeshes(meta.nonblock, ...addMeshesArgs)
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
    this.adjustInfobox()
  }
  render(time) {
    this.scene.children
      .filter(mesh => mesh.userData.onRender)
      .forEach((mesh) => {
        mesh.userData.onRender(time)
      })

    this.adjustInfobox()
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    this.stats.update();
    requestAnimationFrame((time) => this.render(time))
  }
}

export default DisplayManager