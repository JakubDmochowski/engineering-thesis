import * as THREE from 'three'

class DetectorGeometry {
  constructor(scene = null) {
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
    objectLoader.load(file, (data) => {
      console.log(data.toJSON())
      let mesh = data
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
      scene.add(data)
    })
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