<template>
  <div>
    <v-data-table :headers="holdingsHeaders" :items="etf.holdings" fixed-header>
    </v-data-table>
  </div>
</template>
<script>
export default {
  head: {
    link: [
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons',
      },
    ],
  },
  data: () => ({
    menuVisible: false,
    toEtf: null,
    holdingsHeaders: [
      { text: 'TKR', value: 'ticker' },
      { text: '%', value: 'percent' },
      { text: 'Name', value: 'name' },
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
    etfs() {
      const etfs = require('~/static/etfs.json')
      return etfs.ETFs
    },
  },
}
</script>
