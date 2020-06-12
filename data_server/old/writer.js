'use strict'
const fs = require('fs')
let rawdata = fs.readFileSync('data.json')
let lista = JSON.parse(rawdata)
let idx = 0;
setInterval(function() {
    let data = JSON.stringify(lista.data[idx]);
    idx = (idx+1) % lista.data.length 
    fs.writeFileSync('tracks.json', data);
    console.log(data)
  }, 1000);
