'use strict'
const fs = require('fs')

let number = 500

let file1 = fs.readFileSync('data2.json')
let file2 = fs.readFileSync(`testcase_tracks_no_${number}.json`)
let idx = 0;
let data = null;
setInterval(
  () => {
    data = JSON.stringify(JSON.parse(idx ? file1 : file2))
    idx = (idx+1) % 2
    fs.writeFileSync('data.json', data)
  },
  10000
)
