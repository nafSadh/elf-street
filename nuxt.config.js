import etfJson from './static/etfs.json'

export default {
  // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
  ssr: true,

  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',
  router: {
    base: '/elf-street/',
  },

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: 'elf-street',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [{ src: '~/plugins/install.js', ssr: false }],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [['@nuxtjs/vuetify', { theme: { dark: true } }]],

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {},

  generate: {
    routes() {
      const etfRoutes = []
      const fs = require('fs')
      for (const etf of etfJson.ETFs) {
        if (etf.ticker) {
          const jsonpath = './static/etf/' + etf.ticker + '.json'
          if (fs.existsSync(jsonpath)) {
            etfRoutes.push('/etf/' + etf.ticker)
          }
        }
      }
      return etfRoutes
    },
  },
}
