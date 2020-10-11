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

for (const etf of etfMetadata.ETFs) {
  const filepath = './static/etf/' + etf.ticker + '.' + etf.holdings.fileExt
  const jsonpath = './static/etf/' + etf.ticker + '.json'
  console.log(etf.holdings.url)
  downloadFile(etf.holdings.url, filepath, (data) => {
    const transform = transforms[etf.holdings.transform]
    const json = transform(data)
    fs.writeFile(jsonpath, JSON.stringify(json, null, 2), (e, d) => {
      if (e) {
        console.error(e)
      }
    })
  })
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
