'use strict'
const http = require('http')
const https = require('https')
const request = require('request')
const fs = require('fs')
const Papa = require('./node_modules/papaparse')
const XLSX = require('xlsx')
const _ = require('lodash')

// const etfList = { ETFs: [] }
// const etfMetadata = require('./static/etfs.json')

// const spdr = require('./data/spdr.json')

// console.log(spdr.ETFs.length)

const wisdomTree = (function () {
  const json = require('./data/wisdomtree.json')
  json.etf = {}
  for (let entry of json.ETFs) {
    json.etf[entry.bloombergTicker] = entry
  }
  return json
})()

const conversion = {
  ark: function (etf) {
    return etf
  },
  invesco: function (etf, sourceJson) {
    etf.ticker = etf.Ticker
    if (sourceJson.skip[etf.ticker]) {
      return
    }
    return _.merge(etf, {
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
    })
  },
  spdr: function (etf, sourceJson) {
    const tkr = _.toLower(etf.ticker)
    return _.merge(etf, {
      issuer: 'SSGA',
      website:
        // etf name formatted to lower-case-kabab-case,
        // stripping of non alphamerics
        // appending ticker name to end
        'https://www.ssga.com/us/en/individual/etfs/funds/' +
        _.toLower(etf.name.replace(/[^0-9a-z\s]/gi, '').replace(/ /g, '-')) +
        '-' +
        tkr,
      holdingDataSource: sourceJson.skip[etf.ticker]
        ? undefined
        : {
            fileUrl:
              'https://www.ssga.com/us/en/individual/etfs/library-content/products/fund-data/etfs/us/holdings-daily-us-en-' +
              tkr +
              '.xlsx',
            fileExt: 'xlsx',
            transform: 'spdr',
          },
    })
  },
  wisdomtree: function (etf) {
    etf.ticker = etf.bloombergTicker
    _.merge(etf, {
      issuer: 'WisdomTree',
      holdingDataSource: {
        file: './data/stored/' + etf.ticker + '.csv',
        fileExt: 'csv',
        transform: 'wisdomtree',
      },
      website: etf.url,
    })
    return fs.existsSync(etf.holdingDataSource.file) ? etf : null
  },
}

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
      obj.percent = obj.Weight
    }
    return holdings
  },
  wisdomtree: function (data) {
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
  const useLeanJson = true
  const holdings = transforms[etf.holdingDataSource.transform](data)
  if (useLeanJson) {
    etf.holdings = []
    for (const obj of holdings) {
      if (obj.ticker || obj.name || obj.percent)
        etf.holdings.push({
          ticker: obj.ticker,
          name: obj.name,
          percent: obj.percent,
        })
    }
  } else {
    etf.holdings = holdings
  }
  writeJsonToFile(etf, jsonpath)
}

function writeJsonToFile(json, filepath) {
  fs.writeFile(filepath, JSON.stringify(json, null, 2), (e, d) => {
    if (e) {
      console.error(e)
    }
  })
}

function updateEtfData(updateExisting) {
  const ETFs = []
  for (const issuer of ['ark', 'invesco', 'spdr', 'wisdomtree']) {
    const sourceJson = require('./data/' + issuer + '.json')
    for (const etf of sourceJson.ETFs) {
      ETFs.push(conversion[issuer](etf, sourceJson))
    }
  }
  writeJsonToFile({ ETFs: ETFs }, './static/etfs.json')
  for (const etf of ETFs) {
    if (!etf) continue
    if (etf.holdingDataSource) {
      const filepath =
        './data/download/' + etf.ticker + '.' + etf.holdingDataSource.fileExt
      const jsonpath = './static/etf/' + etf.ticker + '.json'
      if (!updateExisting && fs.existsSync(jsonpath)) {
        continue
      } else if (etf.holdings) {
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
}

updateEtfData(false)
