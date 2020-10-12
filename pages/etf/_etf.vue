<template>
  <!-- App.vue -->

  <v-app>
    <v-app-bar app elevate-on-scroll ref="toolbar" v-mutate="onMutate">
      {{ etf.ticker }}
    </v-app-bar>

    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container fluid>
        <nuxt-link to="SPMO">SPMO</nuxt-link>
        <nuxt-link to="ARKK">ARKK</nuxt-link>
        <br />
        <!-- If using vue-router -->
        {{ etf.holdings.length }}
        <v-data-table
          :headers="holdingsHeaders"
          :items="etf.holdings"
          :items-per-page="etf.holdings.length"
          :footer-props="{
            itemsPerPageOptions: [-1, 5, 10, 15],
          }"
        >
        </v-data-table>
      </v-container>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>
<script>
export default {
  mounted() {
    this.onMutate()
  },
  data: () => ({
    menuVisible: false,
    toEtf: null,
    holdingsHeaders: [
      { text: 'TKR', value: 'ticker', class: 'sticky-header grey lighten-3' },
      { text: '%', value: 'percent', class: 'sticky-header grey lighten-3' },
      { text: 'Name', value: 'name', class: 'sticky-header grey lighten-3' },
    ],
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
    onMutate() {
      let height = 0
      const toolbar = this.$refs.toolbar
      if (toolbar) {
        height = `${toolbar.$el.offsetHeight}px`
      }
      document.documentElement.style.setProperty('--headerHeight', height)
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
<style scoped>
.v-data-table /deep/ .sticky-header {
  position: sticky;
  top: var(--headerHeight);
}

.v-data-table /deep/ .v-data-table__wrapper {
  overflow: unset;
}
</style>
