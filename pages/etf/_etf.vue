<template>
  <!-- App.vue -->

  <v-app>
    <v-app-bar app elevate-on-scroll>
      {{ etf.ticker }}
    </v-app-bar>

    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container v-resize="onResize">
        <nuxt-link to="SPMO">SPMO</nuxt-link>
        <nuxt-link to="ARKK">ARKK</nuxt-link>
        <br />
        <!-- If using vue-router -->
        {{ etf.holdings.length }}
        <v-card>
          <v-data-table
            fixed-header
            hide-default-footer
            :height="windowSize.y - 64 - 24 - 59 - 36 - 20"
            :headers="holdingsHeaders"
            :items="etf.holdings"
            :items-per-page="etf.holdings.length"
            :footer-props="{
              itemsPerPageOptions: [-1, 5, 10, 15],
            }"
          >
          </v-data-table>
        </v-card>
      </v-container>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>
<script>
export default {
  data: () => ({
    menuVisible: false,
    toEtf: null,
    holdingsHeaders: [
      { text: 'TKR', value: 'ticker', class: 'sticky-header grey lighten-3' },
      { text: '%', value: 'percent', class: 'sticky-header grey lighten-3' },
      { text: 'Name', value: 'name', class: 'sticky-header grey lighten-3' },
    ],
    windowSize: {
      x: 0,
      y: 0,
    },
    // holdingsOptions: {
    //   itemsPerPage: 13,
    // },
  }),
  computed: {
    etfId() {
      return this.$route.params.etf
    },
    etf() {
      const etfJson = require('~/static/etf/' + this.etfId + '.json')
      return etfJson
    },
    etfs() {
      const etfs = require('~/static/etfs.json')
      return etfs.ETFs
    },
  },
  methods: {
    onResize() {
      this.windowSize = { x: window.innerWidth, y: window.innerHeight }
    },
  },
  head: {
    link: [
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons',
      },
    ],
  },
}
</script>
