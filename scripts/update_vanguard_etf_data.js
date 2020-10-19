'use strict'
const http = require('http')
const https = require('https')
const request = require('request')
const fs = require('fs')
const Papa = require('../node_modules/papaparse')
const XLSX = require('xlsx')
const _ = require('lodash')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getFromUrl(fileUrl, path, callback) {
  request.get(fileUrl, (err, res, body) => {
    request(fileUrl).pipe(fs.createWriteStream(path)).on('close', callback)
  })
}

function listTrackableEtf() {
  const ETFs = require('../data/vanguard.json').ETFs
  const trackable = []
  for (const etf of ETFs) {
    if (!etf.profile.fundFact.isBond) {
      trackable.push(etf.profile.ticker)
    }
  }
  console.log(JSON.stringify(trackable.sort()))
}

async function updateVanguardEtfData(skipExisting) {
  const keys = require('../data/keys.json')
  const trackedTickers = require('../data/vanguard.json').tracked
  const api = 'https://financialmodelingprep.com/api/v3/etf-holder/'

  for (const ticker of trackedTickers) {
    const logPrefix = 'Vanguard  | ' + ticker + ' | '
    const url = api + ticker + '?apikey=' + keys.financialmodelingprep
    const file = './data/stored/vanguard/' + ticker + '.json'
    if (skipExisting && fs.existsSync(file) && !require('.' + file)['Error Message']) {
      console.log(logPrefix + 'skipped existing ')
    } else {
      await sleep(1000)
      console.log(logPrefix + ' fetching ' + url)
      getFromUrl(url, file, () => console.log(logPrefix + ' saved to ' + file))
    }
  }
}

updateVanguardEtfData(true)
// listTrackableEtf()
