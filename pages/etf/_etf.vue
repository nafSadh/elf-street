<template>
  <div class="page-container">
    <md-app md-waterfall md-mode="overlap">
      <md-app-toolbar class="md-primary md-large">
        <div class="md-toolbar-row">
          <md-button class="md-icon-button" @click="menuVisible = !menuVisible">
            <md-icon>menu</md-icon>
          </md-button>
          <span class="md-title">{{ etfId }}</span>
        </div>
      </md-app-toolbar>

      <md-app-drawer :md-active.sync="menuVisible">
        <md-toolbar class="md-transparent" md-elevation="0">
          Navigation
        </md-toolbar>

        <md-list>
          <md-list-item>
            <md-icon>move_to_inbox</md-icon>
            <span class="md-list-item-text">Inbox</span>
          </md-list-item>
        </md-list>
      </md-app-drawer>

      <md-app-content>
        <md-field>
          <md-select name="etf" id="etf">
            <md-option
              v-for="etf of etfs"
              v-model="toEtf"
              :value="etf.ticker"
              :key="etf.ticker"
              >{{ etf.ticker }}</md-option
            >
          </md-select>
        </md-field>
        {{ etfs }}
        <ul>
          <li v-for="etf of etfs" :key="etf.ticker">
            {{ etf.ticker }}
          </li>
        </ul>
      </md-app-content>
    </md-app>
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
  }),
  computed: {
    etfId() {
      return this.$route.params.etf
    },
    etfData() {
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
