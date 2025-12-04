import { createApp } from 'vue'
import App from './App.vue'

import 'vuetify/styles' // global CSS
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createVuetify } from 'vuetify'
// Import commonly used Vuetify components explicitly to ensure runtime resolution
import * as components from 'vuetify/components'
import * as labs from 'vuetify/labs/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components: { ...components, ...labs },
  directives,
  icons: {
    defaultSet: 'mdi',
  },
})

const app = createApp(App)
app.use(vuetify)
app.mount('#app')

