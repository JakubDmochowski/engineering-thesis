import * as THREE from 'three'

class DetectorGeometry {
  constructor(scene = null) {
    const file = './alice.json'
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
    objectLoader.load(file, (data) => {
      const geom = data.children.find(c => c.type !== 'PerspectiveCamera')
      const camera = data.children.find(c => c.type === 'PerspectiveCamera')
      if(camera) {
        camera.children.forEach(c => {
          scene.add(c)
        })
      }
      if(geom) {
        var mergeGeometry = new THREE.Geometry()
        var meshFaceMaterial = new THREE.MeshLambertMaterial()
        this.mergeGeometriesRecursively(mergeGeometry, geom)
        
        var mesh = new THREE.Mesh(mergeGeometry, meshFaceMaterial)
        this.setPropertiesRecursively(
          mesh,
          {
            layers: (l) => l.set(1),
            material: {
              transparent: true,
              opacity: 0.05,
              wireframe: true
            },
            userData: this,
          },
        )
        scene.add(mesh)
      }
    })
  }
  mergeGeometriesRecursively(mergeGeom, node) {
    if(node instanceof THREE.Mesh) {
      let geom = new THREE.Geometry()
      mergeGeom.merge(geom.fromBufferGeometry(node.geometry), this.getPositionMatrix(node))
    }
    node.children.forEach(child => {
      this.mergeGeometriesRecursively(mergeGeom, child)
    })
  }
  getPositionMatrix(node) {
    if(!node) return new THREE.Matrix4()
    if(!node.parent) {
      return node.matrix
    } else {
      node.updateMatrixWorld()
      node.applyMatrix4(this.getPositionMatrix(node.parent))
      return node.matrix
    }
  }
  setPropertiesRecursively(obj, properties) {
    Object.keys(properties).forEach(prop => {
      if(typeof obj[prop] !== 'undefined') {
        if(typeof properties[prop] === 'function') {
          properties[prop](obj[prop])
        } else if(typeof properties[prop] === 'object') {
          this.setPropertiesRecursively(obj[prop], properties[prop])
        } else {
          obj[prop] = properties[prop]
        }
      }
    })
    if(obj.children && obj.children.length) {
      for(let i = 0; i < obj.children.length; i++ ){
        this.setPropertiesRecursively(obj.children[i], properties)
      }
    }
  }
}

export default DetectorGeometry