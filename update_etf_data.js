'use strict'
const http = require('http')
const https = require('https')
const request = require('request')
const fs = require('fs')
const Papa = require('./node_modules/papaparse')
const XLSX = require('xlsx')
const _ = require('lodash')

const etfMetadata = require('./static/etfs.json')

const wisdomTree = (function () {
  const json = require('./data/wisdomtree.json')
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
  spdr: function (buf) {
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const holdings = XLSX.utils.sheet_to_json(workbook.Sheets['holdings'], {
      // 5th row is header, https://github.com/SheetJS/sheetjs/issues/482
      range: 4,
    })
    for (const obj of holdings) {
      obj.ticker = obj.Ticker
      obj.name = obj.Name
    }
    return holdings
  },
  wisdomTree: function (data) {
    let jsonArray = []
    for (const obj of transforms.csvToJson(data)) {
      if (obj['Security Ticker'] && obj['Security Ticker'] != '') {
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

const infer = {
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
  spdr: function (etf) {
    const tkr = _.toLower(etf.ticker)
    return {
      issuer: 'SSGA',
      holdingDataSource: {
        fileUrl:
          'https://www.ssga.com/us/en/individual/etfs/library-content/products/fund-data/etfs/us/holdings-daily-us-en-' +
          tkr +
          '.xlsx',
        fileExt: 'xlsx',
        transform: 'spdr',
      },
    }
  },
  wisdomTree: function (etf) {
    let wtEtf = wisdomTree.etf[etf.ticker]
    _.assign(wtEtf, {
      holdingDataSource: {
        file: './data/stored/' + etf.ticker + '.csv',
        fileExt: 'csv',
        transform: 'wisdomTree',
      },
      website: wtEtf.url,
    })
    return wtEtf
  },
}

function fromUrl(url, path, processData) {
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

function fileFromUrl(fileUrl, path, callback) {
  request.head(fileUrl, (err, res, body) => {
    request(fileUrl).pipe(fs.createWriteStream(path)).on('close', callback)
  })
}

function dataToJsonFile(data, etf, jsonpath) {
  etf.holdings = transforms[etf.holdingDataSource.transform](data)
  fs.writeFile(jsonpath, JSON.stringify(etf, null, 2), (e, d) => {
    if (e) {
      console.error(e)
    }
  })
}

for (const etf of etfMetadata.ETFs) {
  if (!etf.ticker) continue
  if (etf.infer) {
    _.merge(etf, infer[etf.infer](etf))
  }
  if (etf.holdingDataSource) {
    const filepath =
      './data/download/' + etf.ticker + '.' + etf.holdingDataSource.fileExt
    const jsonpath = './static/etf/' + etf.ticker + '.json'
    if (fs.existsSync(jsonpath)) {
      continue
    } else if (etf.holdings || etf.infer === 'spdr') {
      fs.writeFileSync(jsonpath, JSON.stringify(etf, null, 2))
    } else if (etf.holdingDataSource.url) {
      console.log('getting from: ' + etf.holdingDataSource.url)
      fromUrl(etf.holdingDataSource.url, filepath, (data) => {
        dataToJsonFile(data, etf, jsonpath)
      })
    } else if (etf.holdingDataSource.file) {
      console.log('reading file: ' + etf.holdingDataSource.file)
      const data = fs.readFileSync(etf.holdingDataSource.file, 'utf8')
      dataToJsonFile(data, etf, jsonpath)
    } else if (etf.holdingDataSource.fileUrl) {
      console.log('downloading: ' + etf.holdingDataSource.fileUrl)
      fileFromUrl(etf.holdingDataSource.fileUrl, filepath, () => {
        dataToJsonFile(fs.readFileSync(filepath), etf, jsonpath)
      })
    }
  }
}
