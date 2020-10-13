'use strict'
const http = require('http')
const https = require('https')
const fs = require('fs')
const Papa = require('./node_modules/papaparse')
const _ = require('lodash')

const etfMetadata = require('./static/etfs.json')
const wisdomTree = (function () {
  const json = require('./static/wisdomtree.json')
  json.etf = {}
  for (let entry of json.ETFs) {
    json.etf[entry.bloombergTicker] = entry
  }
  return json
})()

const transforms = {
  csvToJson: function (data) {
    const parsed = Papa.parse(data)
    const headers = parsed.data[0]
    let jsonArray = []
    for (let i = 1; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      const obj = {}
      for (let j = 0; j < row.length; j++) {
        obj[_.trim(headers[j])] = _.trim(row[j])
      }
      jsonArray.push(obj)
    }
    return jsonArray
  },
  ark: function (data) {
    let jsonArray = []
    for (const obj of transforms.csvToJson(data)) {
      if (obj.fund && obj.fund != '') {
        let obj = obj
        obj.name = obj.company
        obj.percent = Number(obj['weight(%)'])
        obj.weight = 1 * (obj.percent / 100).toPrecision(8)
        jsonArray.push(obj)
      }
    }
    return jsonArray
  },
  invesco: function (data) {
    let jsonArray = []
    for (const obj of transforms.csvToJson(data)) {
      if (true) {
        obj.ticker = obj['Holding Ticker']
        if (!obj.ticker) {
          // bonds don't have tkr, but may have 'Security Identifier'
          obj.ticker = obj['Security Identifier']
        }
        obj.name = obj.Name
        obj.percent = obj.Weight
        if (!obj.percent) {
          // bond's may express it as PercentageOfFund
          obj.percent = obj.PercentageOfFund
        }
        obj.weight = 1 * (obj.percent / 100).toPrecision(8)
        jsonArray.push(obj)
      }
    }
    return jsonArray
  },

  wisdomTree: function (data) {
    let jsonArray = []
    for (const obj of transforms.csvToJson(data)) {
      if (obj['Security Ticker'] && obje['Security Ticker'] != '') {
        obj.ticker = _.split(obj['Security Ticker'], ' ')[0]
        obj.name = obj['Security Description']
        obj.weight = obj['Weight %']
        obj.percent = obj.weight * 100.0
        _.unset(obj, 'Fund Name')
        jsonArray.push(obj)
      }
    }
    return jsonArray
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

  wisdomTree: function (etf) {
    let wtEtf = wisdomTree.etf[etf.ticker]
    _.assign(wtEtf, {
      holdingDataSource: {
        local: etf.ticker + '.csv',
        fileExt: 'csv',
        transform: 'wisdomTree',
      },
      website: wtEtf.url,
    })
    return wtEtf
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
    if (fs.existsSync(jsonpath)) {
      continue
    }
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
