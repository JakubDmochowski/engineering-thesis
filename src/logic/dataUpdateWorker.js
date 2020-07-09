onmessage = ({ new: data, old: oldData }) => {
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
  self.postMessage({
    object: {
      ...data.object,
      children: newChildren
    },
    geometries: data.geometries.filter(g => newGeometries.includes(g.uuid)),
    materials: data.materials.filter(g => newMaterials.includes(g.uuid)),
    metadata: data.metadata,
  })
}