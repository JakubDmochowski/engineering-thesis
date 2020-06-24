'use strict'
const fs = require('fs')
let file1 = fs.readFileSync('data1.json')
let file2 = fs.readFileSync('data2.json')
let idx = 0;
let data = null;
setInterval(
  () => {
    data = JSON.stringify(JSON.parse(idx ? file1 : file2))
    idx = (idx+1) % 2
    fs.writeFileSync('data.json', data);
    console.log(data)
  },
  1000
)
