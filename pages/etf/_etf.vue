<template>
  <!-- App.vue -->

  <v-app>
    <v-app-bar
      dark
      app
      ref="toolbar"
      v-mutate="onMutate"
      elevate-on-scroll
      color="blue darken-4"
      prominent
      shrink-on-scroll
      flat
    >
      <v-container class="py-0 fill-height">
        <v-row>
          <v-toolbar-title>{{ etf.ticker }}</v-toolbar-title>
          <v-spacer />
          <v-chip label small color="blue">
            {{ etf.holdings.length }} holdings
          </v-chip>
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
        <!-- If using vue-router -->
        <v-card outlined tile>
          <v-card-title> {{ etf.name }} </v-card-title>
          <v-card-text>
            <p>Issuer: {{ etf.issuer }}</p>
            <p v-if="etf.website">
              website: <a :href="etf.website">{{ etf.website }}</a>
            </p>
            <p v-for="field of overviewProps" :key="field">
              {{ field }} : {{ etf[field] }}
            </p>
          </v-card-text>
        </v-card>
        <v-card outlined tile>
          <v-card-title> {{ etf.ticker }} holdings </v-card-title>
          <v-card-subtitle>{{ etf.name }}</v-card-subtitle>
          <v-card-text>
            <v-data-table
              hide-default-footer
              :headers="holdingsHeaders"
              :items="etf.holdings"
              :items-per-page="etf.holdings.length"
              :footer-props="{
                itemsPerPageOptions: [-1, 5, 10, 15],
              }"
            >
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>
<script>
import _ from 'lodash'
const stickyHeaderStyle = 'sticky-header blue-grey darken-4'

export default {
  mounted() {
    this.onMutate()
  },
  data: () => ({
    menuVisible: false,
    toEtf: null,
    holdingsHeaders: [
      {
        text: 'Ticker',
        value: 'ticker',
        class: stickyHeaderStyle,
      },
      { text: '%', value: 'percent', class: stickyHeaderStyle },
      { text: 'Name', value: 'name', class: stickyHeaderStyle },
    ],
  }),
  computed: {
    etfId() {
      return this.$route.params.etf
    },
    etf() {
      const etfJson = require('~/static/etf/' + this.etfId + '.json')
      return etfJson
    },
    overviewProps() {
      return _.without(
        _.keys(this.etf),
        'ticker',
        'website',
        'issuer',
        'holdings',
        'holdingDataSource'
      )
    },
    ETFs() {
      const etfs = require('~/static/etfs.json')
      return etfs.ETFs
    },
  },
  methods: {
    onMutate() {
      // adopted from https://medium.com/untitled-factory/sticky-table-header-in-vuetify-js-fab39988dc3
      let height = 0
      const toolbar = this.$refs.toolbar
      if (toolbar) {
        height = `${toolbar.$el.offsetHeight}px`
      }
      document.documentElement.style.setProperty('--headerHeight', height)
    },
    changeEtf() {
      this.$router.push(this.toEtf)
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
