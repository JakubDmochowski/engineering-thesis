if (process.env.NODE_ENV !== 'production') {
   require('dotenv').config();
}
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const fs = require('fs');
const fse = require('fs-extra');

const filename = 'data.json';
const directory = './data/'
var clients = 0;

const PORT = process.env.DATA_SERVER_PORT || 5000

app.get('/', function(req, res) {
   res.sendFile('./index.html', { root: __dirname });
});

io.on('connection', function(socket) {
   clients++;
   try{
      fs.readFile(`${directory}${filename}`, (err, data) => {
         if(err) throw err;
         io.sockets.emit('initialize', JSON.stringify(JSON.parse(data)));
      })
   } catch(e) {
      console.log(e)
   }
   io.sockets.emit('broadcast',{ description: clients + ' clients connected!'});
   socket.on('disconnect', function () {
      clients--;
      io.sockets.emit('broadcast',{ description: clients + ' clients connected!'});
   });
});
 
fse.ensureFileSync(`${directory}${filename}`)
http.listen(PORT, function() {
   console.log(`Watching for file changes on ${directory}${filename}`);
   let filepath =`${directory}${filename}`
   fs.watch(filepath, (event, filename) => {
      const filepath = `${directory}${filename}`
      const data = fse.readJsonSync(filepath, { throws: false})
      if(data) {
         console.log(data)
         let msg = JSON.stringify(data)
         io.sockets.emit('track', msg)
      }
   })
})
