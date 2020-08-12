'use strict'
const fs = require('fs')
const uuid = require('uuid')
let template = JSON.parse(fs.readFileSync('testGeneratorTemplate.json'))

let dataSampleSizes = [1,2,5,10,20,50,100,200,500,1000,1500,2000,2500,3000,4000,5000,6000]

const pickCasesFromArray = (data, numberOfElems) => {
  let tmp = JSON.parse(JSON.stringify(data))
  const result = []
  for(let i = 0; i < numberOfElems; i++) {
    if(!tmp.length) {
      tmp = JSON.parse(JSON.stringify(data))
    }
    const randomIndex = Math.floor(Math.random() * tmp.length)
    const newObj = tmp.splice(randomIndex, 1)[0]
    newObj.uuid = uuid()
    result.push(newObj)
  }
  return result
}

let generatedObjectTypes = [
  'fTracks',
]

dataSampleSizes.forEach(size => {
  let data = JSON.parse(JSON.stringify(template))
  generatedObjectTypes.forEach(type => {
    const objects = JSON.parse(fs.readFileSync(`${type}.json`))
    data[type] = pickCasesFromArray(objects, size)
  })
  fs.writeFileSync(`testcase_tracks_no_${size}.json`, JSON.stringify(data))
})


