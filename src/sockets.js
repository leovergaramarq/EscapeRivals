module.exports = io => {
    const players = [];
    const rooms = {};
    // const SCREEN_MAIN_MENU = 0, SCREEN_TRANSITION = 1, SCREEN_LEVEL = 2;

    io.on('connection', socket => {
        socket.on('room:join', joinRoom);
        socket.on('player1:startMatch', player1StartMatch);
        socket.on('player1:startLevel', player1StartLevel);
        socket.on('player1:progress', player1SendProgress);
        socket.on('player1:move', player1Move);
        socket.on('player1:animate', player1Animate);
        // socket.on('player1:resetLocation', player1ResetLocation);
        socket.on('player1:finishedLevel', player1FinishedLevel);
        socket.on('player1:finishedMatch', player1FinishedMatch);
        socket.on('disconnect', remPlayer);

        function joinRoom(roomId) {
            const room = rooms[roomId];

            if (room && !roomFull(roomId)) {

                for (let r of socket.rooms) {
                    socket.leave(r);
                    updateRoom(r);
                }

                socket.join(roomId);
                players[getPlayerIndex()].room = roomId;

                socket.to(roomId).emit('player2:joined', socket.id);

                if (!room.player1) room.player1 = socket.id;
                else if (!room.player2) room.player2 = socket.id;

                const player2 = room.player1 == socket.id ? room.player2 : room.player1;
                socket.emit('room:joinSuccess', roomId, player2);
            } else {
                socket.emit('room:joinFailed', roomId);
            }

            printPlayersByRooms();
        }

        function player1StartMatch() {
            socket.to(getRoomId()).emit('player2:startMatch');
        }

        function player1StartLevel(level) {
            socket.to(getRoomId()).emit('player2:startLevel', level);
        }

        function player1SendProgress(points, totPoints) {
            socket.to(getRoomId()).emit('player2:progress', points, totPoints);
        }

        function player1Move(x, y, flip) {
            socket.to(getRoomId()).emit('player2:move', x, y, flip);
        }

        function player1Animate(code) {
            socket.to(getRoomId()).emit('player2:animate', code);
        }

        // function player1ResetLocation() {
        //     socket.to(getRoomId()).emit('player2:resetLocation');
        // }

        function player1FinishedLevel(level) {
            socket.to(getRoomId()).emit('player2:finishedLevel', level);
        }

        function player1FinishedMatch() {
            socket.to(getRoomId()).emit('player2:finishedMatch');
        }

        function remPlayer() {
            console.log(`Bye ${socket.id}!\n`);

            updateRoom(getRoomId());

            players.splice(getPlayerIndex(), 1);
            
            printPlayersByRooms();
        }

        function updateRoom(roomId) {
            const room = rooms[roomId];

            if (room.player1 == socket.id) room.player1 = null;
            else if (room.player2 == socket.id) room.player2 = null;

            if (!room.player1 && !room.player2) {
                delete rooms[roomId];
            } else {
                io.in(roomId).emit('player2:disconnected');
            }
        }

        function addPlayer() {
            console.log(`New player: ${socket.id}\n`);
            
            const roomId = socket.id;

            rooms[roomId] = {
                // 'id': roomId,
                'player1': socket.id,
                // 'screen': SCREEN_MAIN_MENU
            }
            socket.join(roomId);
            players.push({ id: socket.id, room: roomId });
            socket.emit('room:welcome', roomId);

            printPlayersByRooms();
        }

        function roomFull(room) {
            return room.player1 && room.player2;
        }

        function getRoomId() {
            return players[getPlayerIndex()].room;
            // return socket.rooms.values().next().value;
        }

        function getPlayerIndex() {
            return players.findIndex(p => p.id == socket.id);
        }

        function printPlayers() {
            console.log('Players:');
            for(let player of io.sockets.clients()) {
                console.log(player);
            }
            console.log();
        }

        function printRoomPlayers(roomId) {
            console.log(`Players from room ${roomId}:`);
            const room = rooms[roomId];
            console.log(`${room.player1}, ${room.player2}\n`);
        }

        function printPlayersByRooms() {
            console.log('Players:');
            for(let roomId in rooms) {
                printRoomPlayers(roomId);
            }
        }

        addPlayer();

        // cola.push(socket.id);
        // printClients();

        // if (scene == 'principal') {
        //   socket.emit('room:disp', false);
        // }

        // socket.on('room:in', () => {
        //   if (player1 == null) {
        //     socket.join('room1');
        //     cola.splice(cola.indexOf(socket.id), 1);
        //     player1 = socket.id;

        //     console.log('\n', player1, 'se ha unido a la partida.');
        //     printClients();

        //     if (player2 != null) {
        //       socket.emit('player2:playing', player2);
        //       socket.to('room1').emit('player2:playing', player1);

        //       io.sockets.emit('room:disp', false);
        //       scene = 'principal';

        //       //socket.emit('player:main', true);
        //       //socket.broadcast.to(player2).emit('player:main', false);
        //       main_player = 1;
        //       console.log('Que empiece el juego!');
        //     }
        //   } else if (player2 == null) {
        //     socket.join('room1');
        //     cola.splice(cola.indexOf(socket.id), 1);
        //     player2 = socket.id;

        //     socket.emit('player2:playing', player1);
        //     socket.to('room1').emit('player2:playing', player2);

        //     io.sockets.emit('room:disp', false);
        //     scene = 'principal';

        //     //socket.emit('player:main', true);
        //     //socket.broadcast.to(player1).emit('player:main', false);
        //     main_player = 2;

        //     console.log('\n', player2, 'se ha unido a la partida.');
        //     printClients();
        //     console.log('Que empiece el juego!');
        //   }
        // });

        // socket.on('player:izquierda', (x, y) => {
        //   socket.to('room1').emit('player:mov', x, y, 1);
        // });

        // socket.on('player:derecha', (x, y) => {
        //   socket.to('room1').emit('player:mov', x, y, 0);
        // });

        // socket.on('player:salto', (x, y) => {
        //   socket.to('room1').emit('player:mov', x, y, -1);
        // });

        // socket.on('player:anim_caminar', (a) => {
        //   socket.to('room1').emit('player:anim_caminar', a);
        // });

        // socket.on('player:reset', () => {
        //   socket.to('room1').emit('player:reset');
        // });

        // socket.on('player:main', () => {
        //   if (main_player == 1) {
        //     io.in('room1').emit('player:main', player1);
        //   } else {
        //     io.in('room1').emit('player:main', player2);
        //   }
        // });

        // socket.on('player:next_nivel', () => {
        //   if (player1 == null || player2 == null) {
        //     io.in('room1').emit('nivel:next');
        //   } else {
        //     player_wait = !player_wait;
        //     if (!player_wait)
        //       io.in('room1').emit('nivel:next');
        //     else
        //       socket.to('room1').emit('player:next_nivel');
        //   }
        // });

        // socket.on('game:end', () => {
        //   socket.leave('room1');
        //   if (socket.id == player1)
        //     player1 = null;
        //   else if (socket.id == player2)
        //     player2 = null;
        //   cola.push(socket.id);

        //   console.log('\n', socket.id, 'deja la room de juego.');
        //   printClients();

        //   if (player1 == null && player2 == null) {
        //     console.log('Final de la partida!');
        //     printClients();
        //     scene = 'inicio';
        //     io.sockets.emit('room:disp', true);
        //   }
        // });

        // socket.on('player:info', (puntos) => {
        //   socket.to('room1').emit('player:info', puntos);
        // });

        // socket.on('player:finished', () => {
        //   if (player1 == null || player2 == null) {
        //     io.in('room1').emit('game:transición');
        //   } else {
        //     player_wait = !player_wait;
        //     if (!player_wait)
        //       io.in('room1').emit('game:transición');
        //     else
        //       socket.to('room1').emit('player:finished');
        //   }
        // });

        // socket.on('disconnect', () => {
        //   console.log('\nAbandona el servidor:', socket.id + '.');
        //   if (scene == 'inicio') {
        //     console.log('disconnect on inicio');
        //     if (cola.length > 0)
        //       cola.splice(cola.indexOf(socket.id), 1);
        //   } else if (scene == 'principal') {
        //     console.log('disconnect on principal');
        //     if (player1 == socket.id) {
        //       console.log('1');
        //       player1 = null;
        //       socket.to('room1').emit('player:left');
        //     } else if (player2 == socket.id) {
        //       console.log('2');
        //       player2 = null;
        //       socket.to('room1').emit('player:left');
        //     } else {
        //       console.log('3');
        //       if (cola.length > 0)
        //         cola.splice(cola.indexOf(socket.id), 1);
        //     }
        //   }

        //   printClients();
        //   if (player1 == null && player2 == null) {
        //     main_player = -1;
        //     scene = 'inicio';
        //     io.sockets.emit('room:disp', true);
        //     /*
        //     player1=cola.shift();
        //     player2=cola.shift();
        //     console.log('\nActualización.');
        //     printClients();
        //     */
        //   }
        // });
    });

    // function leaveRoom(roomId) {
    //   socket.leave(roomId);
    // }
}

// function printClients() {
//     console.log('*************CLIENTES*************');
//     printPlayers();
//     printCola();
// }

// function printPlayers() {
//     console.log('Players:');
//     console.log(player1);
//     console.log(player2);
// }

// function printCola() {
//     console.log('Cola:');
//     for (let i of cola) console.log(i);
// }
