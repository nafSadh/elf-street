'use strict'
const http = require('http')
const https = require('https')
const fs = require('fs')
const Papa = require('./node_modules/papaparse')

const etfMetadata = require('./static/etfs.json')
console.log(etfMetadata)

const transforms = {
  csvToJson: function (data) {
    const parsed = Papa.parse(data)
    const headers = parsed.data[0]
    let jsonArray = []
    for (let i = 1; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      const obj = {}
      for (let j = 0; j < row.length; j++) {
        obj[headers[j]] = row[j]
      }
      jsonArray.push(obj)
    }
    return jsonArray
  },
  ark: function (data) {
    let jsonArray = []
    for (const _ of transforms.csvToJson(data)) {
      if (_.fund && _.fund != '') {
        let obj = _
        obj.name = obj.company
        obj.percent = Number(_['weight(%)'])
        obj.weight = 1 * (obj.percent / 100).toPrecision(8)
        jsonArray.push(obj)
      }
    }
    return jsonArray
  },
  invesco: function (data) {
    let jsonArray = []
    for (const _ of transforms.csvToJson(data)) {
      if (true) {
        let obj = _
        obj.ticker = _['Holding Ticker']
        obj.name = _.Name
        obj.percent = _.Weight
        obj.weight = 1 * (obj.percent / 100).toPrecision(8)
        jsonArray.push(obj)
      }
    }
    return jsonArray
  },
}

const holdingDataSourceFn = {
  invesco: function (ticker) {
    return {
      url:
        'https://www.invesco.com/us/financial-products/etfs/holdings/main/holdings/0?audienceType=Investor&action=download&ticker=' +
        ticker,
      fileExt: 'csv',
      transform: 'invesco',
    }
  },
}

const inferDataFn = {
  invesco: function (etf) {
    return {
      issuer: 'Invesco',
      website:
        'https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Investor&ticker=' +
        etf.ticker,
      holdingDataSource: {
        url:
          'https://www.invesco.com/us/financial-products/etfs/holdings/main/holdings/0?audienceType=Investor&action=download&ticker=' +
          etf.ticker,
        fileExt: 'csv',
        transform: 'invesco',
      },
    }
  },
}

function downloadFile(url, path, processData) {
  const file = fs.createWriteStream(path)
  const chunks = []
  https
    .get(url, (res) => {
      res.pipe(file)
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => processData(Buffer.concat(chunks).toString('utf8')))
    })
    .on('error', (e) => {
      console.error(e)
    })
}

for (let etf of etfMetadata.ETFs) {
  if (!etf.ticker) continue
  if (etf.inferDataFn) {
    const fn = inferDataFn[etf.inferDataFn]
    etf = Object.assign(fn(etf), etf)
  }
  if (etf.holdingDataSource && etf.holdingDataSource.url) {
    const filepath =
      './static/etf/' + etf.ticker + '.' + etf.holdingDataSource.fileExt
    const jsonpath = './static/etf/' + etf.ticker + '.json'
    console.log(etf.holdingDataSource.url)
    downloadFile(etf.holdingDataSource.url, filepath, (data) => {
      const transform = transforms[etf.holdingDataSource.transform]
      let json = etf
      etf.holdings = transform(data)
      fs.writeFile(jsonpath, JSON.stringify(json, null, 2), (e, d) => {
        if (e) {
          console.error(e)
        }
      })
    })
  }
}
