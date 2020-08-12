import * as THREE from 'three'
import { createPopper } from '@popperjs/core'

class PickHelper {
  constructor(tooltip) {
    this.raycaster = new THREE.Raycaster()
    this.pickPosition = {
      relative: {
        x: null,
        y: null
      },
      absolute: {
        x: null,
        y: null
      }
    }
    this.tooltip = tooltip
    this.popper = null
    this.pickedObject = null
  }
  getCanvasRelativePosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * canvas.height / rect.height,
    }
  }
  setPickPosition(event, canvas) {
    const pos = this.getCanvasRelativePosition(event, canvas)
    this.pickPosition.absolute.x = pos.x
    this.pickPosition.absolute.y = pos.y
    this.pickPosition.relative.x = (pos.x / canvas.width ) *  2 - 1
    this.pickPosition.relative.y = (pos.y / canvas.height) * -2 + 1
  }
  clearPickPosition() {
    this.pickPosition = {
      relative: {
        x: null,
        y: null
      },
      absolute: {
        x: null,
        y: null
      }
    }
  }
  pick(event, canvas, scene, camera) {
    if (this.pickedObject) {
      this.onPickEnd(this.pickedObject)
    }
    this.setPickPosition(event, canvas)
    // cast a ray through the frustum
    this.raycaster.setFromCamera(this.pickPosition.relative, camera)
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children)
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.onPickStart(intersectedObjects[0].object)
      this.showTooltip()
      console.log(intersectedObjects)
      return intersectedObjects
    } else {
      this.hideTooltip()
      return null
    }
  }
  showTooltip() {
    this.tooltip.setAttribute('data-show', '')
  }
  hideTooltip() {
    this.tooltip.removeAttribute('data-show')
  }
  onPickStart(object) {
    this.pickedObject = object
    this.createPopper()
  }
  onPickEnd() {
    this.pickedObject = undefined
  }
  createPopper() {
    const virtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        top: this.pickPosition.absolute.y,
        right: this.pickPosition.absolute.x,
        bottom: this.pickPosition.absolute.y,
        left: this.pickPosition.absolute.x
      })
    }
    this.popper = createPopper(virtualElement, this.tooltip, {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8]
          }
        }
      ]
    })
  }
}
export default PickHelper