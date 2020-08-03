'use strict'
const fs = require('fs')
let files = [
  fs.readFileSync('event35_run226466.json'),
  fs.readFileSync('event41_run226466.json'),
  fs.readFileSync('event91_run226466.json'),
  fs.readFileSync('event254_run226466.json'),
  fs.readFileSync('event769_run122374.json'),
  fs.readFileSync('event786_run122374.json'),
  fs.readFileSync('event1153_run122374.json'),
  fs.readFileSync('event2162_run226466.json'),
  fs.readFileSync('event3055_run226466.json'),
  fs.readFileSync('event3205_run122374.json'),
  fs.readFileSync('event3490_run226466.json'),
  fs.readFileSync('event4047_run226466.json')
]
// let idx = Math.floor(Math.random() * (files.length + 1));
let idx = 0
let data = null;
setInterval(
  () => {
    data = JSON.stringify(JSON.parse(files[idx++]))
    // idx = (idx+1) % files.length
    fs.writeFileSync('data.json', data);
    console.log(data)
  },
  1000*60*3
)
