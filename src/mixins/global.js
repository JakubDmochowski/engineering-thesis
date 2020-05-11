import translation from '../lang/translations'

const traverseTranslation = (node, key) => {
  if (!key || !key.length) {
    return node
  }
  if(!node[key[0]]) {
    return undefined
  }
  return traverseTranslation(node[key[0]], key.slice(1))
}

export default {
  methods: {
    $tr(key) {
      return traverseTranslation(translation, key.split('.'))
    }
  }
}
