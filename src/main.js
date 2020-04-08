import Vue from 'vue'
import App from './App.vue'

import './assets/styles/index.css'
import '@fortawesome/fontawesome-free/css/all.css'

import globalMixin from './mixins/global'


import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

const requireComponent = require.context(
  './components/global',
  false,
  /\w+\.(vue|js)$/
)

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)
  const componentName = upperFirst(
    camelCase(
      fileName
        .split('/')
        .pop()
        .replace(/\.\w+$/, '')
    )
  )
  Vue.component(
    componentName,
    componentConfig.default || componentConfig
  )
})

Vue.mixin(globalMixin)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
