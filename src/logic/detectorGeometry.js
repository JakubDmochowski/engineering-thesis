import * as THREE from 'three'

class DetectorGeometry {
  constructor(scene) {
    // Placeholder
    let geometry = new THREE.CylinderGeometry(500, 500, 800, 16, 1, true)
    let material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true
    })
    let mesh = new THREE.Mesh(geometry, material)
    mesh.rotateOnAxis(new THREE.Vector3(1,0,0), Math.PI / 2)
    mesh.material.opacity = 0.05
    mesh.layers.set(1)
    mesh.userData = this
    scene.add(mesh)
  }
}

export default DetectorGeometry