var scene='inicio';
var jugador1=null, jugador2=null;
var jugador_espera=false;
var cola=[];
var main_jug=-1;

module.exports=function(io){
  io.on('connection', (socket)=>{
    console.log("\nSe une al servidor: ",socket.id,".");
    socket.emit('print:id');

    cola.push(socket.id);
    printClients();

    if(scene=='principal'){
      socket.emit('sala:disp', false);
    }

    socket.on('sala:in', ()=>{
      if(jugador1==null){
        socket.join('room1');
        cola.splice(cola.indexOf(socket.id), 1);
        jugador1=socket.id;

        console.log('\n',jugador1,'se ha unido a la partida.');
        printClients();

        if(jugador2!=null){
          socket.emit('jugador2:playing', jugador2);
          socket.to('room1').emit('jugador2:playing', jugador1);

          io.sockets.emit('sala:disp', false);
          scene='principal';

          //socket.emit('jugador:main', true);
          //socket.broadcast.to(jugador2).emit('jugador:main', false);
          main_jug=1;
          console.log('Que empiece el juego!');
        }
      }else if(jugador2==null){
        socket.join('room1');
        cola.splice(cola.indexOf(socket.id), 1);
        jugador2=socket.id;

        socket.emit('jugador2:playing', jugador1);
        socket.to('room1').emit('jugador2:playing', jugador2);

        io.sockets.emit('sala:disp', false);
        scene='principal';

        //socket.emit('jugador:main', true);
        //socket.broadcast.to(jugador1).emit('jugador:main', false);
        main_jug=2;

        console.log('\n',jugador2,'se ha unido a la partida.');
        printClients();
        console.log('Que empiece el juego!');
      }
    });

    socket.on('jugador:izquierda', (x, y)=>{
      socket.to('room1').emit('jugador:mov', x, y, 1);
    });

    socket.on('jugador:derecha', (x, y)=>{
      socket.to('room1').emit('jugador:mov', x, y, 0);
    });

    socket.on('jugador:salto', (x, y)=>{
      socket.to('room1').emit('jugador:mov', x, y, -1);
    });

    socket.on('jugador:anim_caminar', (a)=>{
      socket.to('room1').emit('jugador:anim_caminar', a);
    });

    socket.on('jugador:reset', ()=>{
      socket.to('room1').emit('jugador:reset');
    });

    socket.on('jugador:main', ()=>{
      if(main_jug==1){
        io.in('room1').emit('jugador:main', jugador1);
      }else{
        io.in('room1').emit('jugador:main', jugador2);
      }
    });

    socket.on('jugador:next_nivel', ()=>{
      if(jugador1==null || jugador2==null){
        io.in('room1').emit('nivel:next');
      }else{
        jugador_espera=!jugador_espera;
        if(!jugador_espera) io.in('room1').emit('nivel:next');
        else socket.to('room1').emit('jugador:next_nivel');
      }
    });

    socket.on('game:end', ()=>{
      socket.leave('room1');
      if(socket.id==jugador1) jugador1=null;
      else if(socket.id==jugador2) jugador2=null;
      cola.push(socket.id);

      console.log('\n',socket.id,'deja la sala de juego.');
      printClients();

      if(jugador1==null && jugador2==null){
        console.log('Final de la partida!');
        printClients();
        scene='inicio';
        io.sockets.emit('sala:disp', true);
      }
    });

    socket.on('jugador:info', (puntos)=>{
      socket.to('room1').emit('jugador:info', puntos);
    });

    socket.on('jugador:finished', ()=>{
      if(jugador1==null || jugador2==null){
        io.in('room1').emit('game:transición');
      }else{
        jugador_espera=!jugador_espera;
        if(!jugador_espera) io.in('room1').emit('game:transición');
        else socket.to('room1').emit('jugador:finished');
      }
    });

    socket.on('disconnect', ()=>{
      console.log("\nAbandona el servidor:",socket.id+".");
      if(scene=='inicio'){
        console.log('disconnect on inicio');
        if(cola.length>0) cola.splice(cola.indexOf(socket.id), 1);
      }else if(scene=='principal'){
        console.log('disconnect on principal');
        if(jugador1==socket.id){
          console.log('1');
          jugador1=null;
          socket.to('room1').emit('jugador:left');
        }else if(jugador2==socket.id){
          console.log('2');
          jugador2=null;
          socket.to('room1').emit('jugador:left');
        }else{
          console.log('3');
          if(cola.length>0) cola.splice(cola.indexOf(socket.id), 1);
        }
      }

      printClients();
      if(jugador1==null && jugador2==null){
        main_jug=-1;
        scene='inicio';
        io.sockets.emit('sala:disp', true);
        /*
        jugador1=cola.shift();
        jugador2=cola.shift();
        console.log("\nActualización.");
        printClients();
        */
      }
    });
  });
}

function printClients(){
  console.log("*************CLIENTES*************");
  printPlayers();
  printCola();
}

function printPlayers(){
  console.log('Players:');
  console.log(jugador1);
  console.log(jugador2);
}

function printCola(){
  console.log('Cola:');
  for(let i of cola) console.log(i);
}
