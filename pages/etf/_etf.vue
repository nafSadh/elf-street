<template>
  <div>
    XYZ
    {{ $route.params }}
    {{ etfId }}
  </div>
</template>
<script>
export default {
  computed: {
    etfId() {
      return this.$route.params.etf
    },
    etfData() {
      const etfJson = require('~/static/etf/' + this.etfId + '.json')
      return etfJson
    },
  },
}
</script>
