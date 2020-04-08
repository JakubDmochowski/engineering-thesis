import translation from '../lang/translations'

export default {
  methods: {
    $tr(key) {
      return translation[key]
    }
  }
}