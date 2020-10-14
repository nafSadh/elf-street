<template>
  <!-- App.vue -->
  <v-app>
    <v-app-bar
      dark
      app
      ref="toolbar"
      elevate-on-scroll
      color="blue darken-4"
      prominent
      shrink-on-scroll
      flat
    >
      <v-container class="py-0 fill-height">
        <v-row>
          <v-toolbar-title>ETFs</v-toolbar-title>
          <v-spacer />
        </v-row>
      </v-container>
    </v-app-bar>
    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container>
        <v-toolbar outlined tile>
          <v-toolbar-title>ETF</v-toolbar-title>
          <v-autocomplete
            filled
            dense
            hide-details
            :items="ETFs"
            item-value="ticker"
            :item-text="(item) => item.ticker + ' - ' + item.name"
            @change="changeEtf"
            v-model="toEtf"
            class="mx-4"
          />
        </v-toolbar>
      </v-container>
      <p>params: {{ $route.params }}</p>
      <p>query: {{ $route.query }}</p>
      <p>hash: {{ $route.hash }}</p>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>
<script>
// import _ from 'lodash'
export default {
  mounted() {},
  data: () => ({
    menuVisible: false,
    toEtf: null,
  }),
  computed: {
    routInfo() {
      return this.$route
    },
    ETFs() {
      const etfs = require('~/static/etfs.json')
      return etfs.ETFs
    },
  },
  methods: {
    changeEtf() {
      this.$router.push('/etf/' + this.toEtf)
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
