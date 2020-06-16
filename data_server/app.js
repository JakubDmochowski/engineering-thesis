if (process.env.NODE_ENV !== 'production') {
   require('dotenv').config();
}
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const fs = require('fs');
const fse = require('fs-extra');

const file = './data/data.json';
var clients = 0;

const PORT = process.env.DATA_SERVER_PORT || 5000

app.get('/', function(req, res) {
   res.sendFile('./index.html', { root: __dirname });
});

io.on('connection', function(socket) {
   clients++;
   try{
      fs.readFile(file, (err, data) => {
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
 
fse.ensureFileSync(file)
http.listen(PORT, function() {
   console.log(`Watching for file changes on ${file}`);
   let fsWait = false;
   fs.watch(file, (event, filename) => {
      if (filename) {
         if (fsWait) return;
         fsWait = setTimeout(() => {
            fsWait = false;
         }, 100);
         console.log(`${filename} file Changed`);

         fs.readFile(filename, (err, data) => {
            if (err) throw err;
            let student = JSON.parse(data);
            console.log(student);
            let msg = JSON.stringify(student); 
            io.sockets.emit('track',{ description: msg});
         });
      }
   });
});