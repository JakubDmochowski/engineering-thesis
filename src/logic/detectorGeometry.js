class DetectorGeometry {
  constructor(scene, data) {
    this.setProperties(
      data,
      {
        layers: (l) => l.set(1),
        material: {
          transparent: true,
          opacity: 0.05,
          wireframe: true
        },
      },
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