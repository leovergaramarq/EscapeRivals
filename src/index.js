const path=require('path');
const express=require('express');
const app=express();
const server=require('http').createServer(app);

//settings
app.set('port', process.env.PORT || 3000);

//static files
//app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.static(__dirname));

//iniciar server

server.listen(app.get('port'), ()=>{
  console.log('Servidor en puerto', app.get('port'));
});

//websockets
const SocketIO=require('socket.io');
//const io=SocketIO.listen(server);
const io=SocketIO(server); //conexión

require('./sockets')(io);
