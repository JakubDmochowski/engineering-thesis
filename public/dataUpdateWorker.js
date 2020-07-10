onmessage = (event) => {
  const { new: data, old: oldData } = event.data
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
  const newGeometriesUuids = newChildren.map(c => c.geometry)
  const newMaterialUuids = newChildren.map(c => c.material)
  const newGeometries = data.geometries.filter(g => newGeometriesUuids.includes(g.uuid))
  const newMaterials = data.materials.filter(g => newMaterialUuids.includes(g.uuid))
  self.postMessage({
    object: {
      ...data.object,
      children: newChildren
    },
    geometries: newGeometries,
    materials: newMaterials,
    metadata: data.metadata,
  })
}