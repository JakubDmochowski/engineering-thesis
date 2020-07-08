import * as THREE from 'three'

class DetectorGeometry {
  constructor(scene, { data, meta }) {
    const lightModeDefaults = {
      layers: (l) => l.set(1),
      material: {
        transparent: true,
        opacity: 0.05,
        wireframe: meta && meta.wireframe,
        depthWrite: false,
      },
      visible: !(meta && meta.hideDetector),
    }
    const darkModeDefaults = {
      layers: (l) => l.set(1),
      material: {
        transparent: true,
        opacity: 0.05,
        wireframe: meta && meta.wireframe,
        depthWrite: false,
        emissive: new THREE.Color(0xffff00),
      },
      visible: !(meta && meta.hideDetector),
    }
    this.setProperties(
      data,
      meta && meta.darkMode ? darkModeDefaults : lightModeDefaults,
      true
    )
    data.userData = {
      _typename: 'DetectorGeometry'
    }
    scene.add(data)
  }
  setProperties(obj, properties, recursive = false) {
    Object.keys(properties).forEach(prop => {
      if(typeof obj[prop] !== 'undefined') {
        if(typeof properties[prop] === 'function') {
          properties[prop](obj[prop])
        } else if(typeof properties[prop] === 'object') {
          this.setProperties(obj[prop], properties[prop], recursive)
        } else {
          obj[prop] = properties[prop]
        }
      }
    })
    if(recursive && obj.children && obj.children.length) {
      for(let i = 0; i < obj.children.length; i++ ){
        this.setProperties(obj.children[i], properties, recursive)
      }
    }
  }
}

export default DetectorGeometry