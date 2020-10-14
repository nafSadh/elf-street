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
          <v-toolbar-title>Compare</v-toolbar-title>
          <v-spacer />
        </v-row>
      </v-container>
    </v-app-bar>
    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container>
        <v-toolbar outlined tile>
          <v-toolbar-title>ETFs</v-toolbar-title>
          <v-autocomplete
            filled
            dense
            multiple
            chips
            deletable-chips
            clearable
            hide-details
            :items="ETFs"
            item-value="ticker"
            :item-text="(item) => item.ticker + ' - ' + item.name"
            v-model="etfToComp"
            class="mx-4"
            color="blue"
            @change="updateComparison"
          >
            <template v-slot:selection="data">
              <v-chip
                v-bind="data.attrs"
                :input-value="data.selected"
                close
                @click="data.select"
                @click:close="remove(data.item)"
              >
                {{ data.item.ticker }}
              </v-chip>
            </template>
          </v-autocomplete>
        </v-toolbar>
        <!-- If using vue-router -->
        <v-card outlined tile>
          <v-card-title> Comparing </v-card-title>
          <v-card-text> {{ etfToComp }} </v-card-text>
        </v-card>
        <v-card outlined tile>
          <v-card-title> Compare holdings </v-card-title>
          <v-card-subtitle>Compare weight of holdings</v-card-subtitle>
          <v-card-text>
            <v-data-table
              hide-default-footer
              :headers="comprisonHeaders"
              :items="holdingComparison"
              :items-per-page="holdingComparison.length"
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
const stickyHeaderStyle = 'sticky-header blue-grey darken-4'

export default {
  mounted() {
    this.onMutate()
  },
  data: () => ({
    menuVisible: false,
    etfToComp: [],
    holdingComparison: [],
    comprisonHeaders: [],
  }),
  computed: {
    ETFs() {
      const etfs = require('~/static/etfs.json')
      return etfs.ETFs
    },
  },
  methods: {
    onMutate() {
      // this.windowSize = { x: window.innerWidth, y: window.innerHeight }
      let height = 0
      const toolbar = this.$refs.toolbar
      if (toolbar) {
        height = `${toolbar.$el.offsetHeight}px`
      }
      document.documentElement.style.setProperty('--headerHeight', height)
    },
    async updateComparison() {
      const etfData = {}
      const tkrPerEtf = {}
      this.comprisonHeaders = [
        { text: 'Ticker', value: 'ticker', class: stickyHeaderStyle },
      ]
      for (const etfId of this.etfToComp) {
        this.comprisonHeaders.push({
          text: etfId,
          value: etfId,
          class: stickyHeaderStyle,
        })
        if (!etfData[etfId]) {
          const etfJsonData = await this.$axios
            .$get('etf/' + etfId + '.json')
            .then((res) => res)
          etfData[etfId] = etfJsonData
        }
        for (const asset of etfData[etfId].holdings) {
          if (!tkrPerEtf[asset.ticker]) {
            tkrPerEtf[asset.ticker] = { ticker: asset.ticker }
          }
          tkrPerEtf[asset.ticker][etfId] = asset.percent
        }
      }
      this.holdingComparison = []
      for (const tkr in tkrPerEtf) {
        this.holdingComparison.push(tkrPerEtf[tkr])
      }
    },
    remove(item) {
      const index = this.etfToComp.indexOf(item.ticker)
      if (index >= 0) this.etfToComp.splice(index, 1)
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
