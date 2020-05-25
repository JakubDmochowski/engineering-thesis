import * as THREE from 'three'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader'

class DetectorGeometry {
  constructor(scene) {
    let mesh = null
    var loadingManager = new THREE.LoadingManager(() => {
      scene.add( mesh )
    })
    var loader = new ColladaLoader(loadingManager)
    loader.load('./aliceGeom.dae', (collada) => {
      mesh = collada.scene
      mesh.scale.x = mesh.scale.y = mesh.scale.z = 1
      this.setPropertiesRecursively(
        mesh,
        {
          layers: (l) => l.set(1),
          material: {
            transparent: true,
            opacity: 0.075
          },
          userData: this,
        },
      )
    })
    scene.add(mesh)
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