const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Settings
app.set('port', process.env.PORT || 3000);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Init Server
server.listen(app.get('port'), () => {
  console.log('Servidor en puerto', app.get('port'));
});

// Websockets
const io = require('socket.io')(server);
require('./sockets')(io);
