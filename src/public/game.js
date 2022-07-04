// IMPORTS

// Classes

import Player from './js/Player.js';
import { ANIMATE_ON_AIR, ANIMATE_STANDING, ANIMATE_WALKING } from './js/constants.js';

// Levels

import levels from './assets/json/levels.json' assert { type: 'json' };

// EVENTS

// Socket
const socket = io();

// Room

socket.on('room:welcome', welcome);
socket.on('room:joinSuccess', joinSuccess);
socket.on('room:joinFailed', joinFailed);

// Player 2

socket.on('player2:joined', player2Joined);
socket.on('player2:disconnected', player2Disconnected);
socket.on('player2:startMatch', player2StartMatch);
socket.on('player2:startLevel', player2StartLevel);
// socket.on('player2:inMatch', player2InMatch);

// FUNCTIONS

// Room

function welcome(roomId) {
    room = roomId;

    console.log('Your id:', socket.id);
    let result = prompt(`Current room: ${roomId}
    \n\nPass it to your friend or paste his to join the same room!`,
    socket.id);

    if (!result) return;

    result = result.trim();
    if (result && result !== socket.id) socket.emit('room:join', result);
}

// Player1

function joinFailed(roomId) {
    alert(`Sorry, the room ${roomId} doesn\'t exist or is full`);
}

function joinSuccess(roomId, player2Id) {
    if(player2Id) {
        player2 = new Player(player2Id);
        if(sprite2) player2.sprite = sprite2;;
    }
    alert(`Joined to room ${roomId} succesfully!`);
}

function startMatch(currentScene) {
    console.log('Starting match...');
    
    if (player2) {
        level = 1;
        player1.totPoints = player2.totPoints = 0;
        socket.emit('player1:startMatch');
    
        startLevel(currentScene);
    } else {
        alert(`No one else is in the room (${room})`);
    }
}

function nextLevel(currentScene) {
    if (++level > levels.length) finishMatch(currentScene);
    else startLevel(currentScene);
}

function startLevel(currentScene) {
    time = levels[level - 1].time;
    player1.finishedLevel = false;
    player1.inLevel = true;
    socket.emit('player1:startLevel', level);
    // if(player2.inMatch && player2.inLevel) cont = true;
    if(player2.inLevel) cont = true;
    currentScene.scene.start('Level');

    console.log(`Going to level ${level + 1}`);
}

function finishLevel(currentScene) {
    player1.points = time;
    player1.totPoints += time;
    if(player2.finishedLevel) clearInterval(intervalTime);

    console.log('Level finished');
    
    player1.finishedLevel = true;
    socket.emit('player1:finishedLevel', level);

    // levels[level - 1].player1.points = time;
    sendProgress();

    if (!player2.finishedLevel) currentScene.cameras.main.startFollow(player2.sprite);
    else levelTransition(currentScene);
}

function finishMatch(currentScene) {
    console.log('End of game');
    socket.emit('player1:finishedMatch');
    currentScene.scene.start('MainMenu');
}

function sendProgress() {
    socket.emit('player1:progress', player1.points, player1.totPoints);
}

function sendMove() {
    const sprite = player1.sprite;
    socket.emit('player1:move', sprite.x, sprite.y, sprite.flipX);
}

// Player2

function player2Joined(player2Id) {
    player2 = new Player(player2Id);
    if(sprite2) player2.sprite = sprite2;;

    alert(`${player2Id} joined the room`);
}

function player2StartMatch() {
    // player2.inMatch = true;
}

function player2StartLevel(level) {
    player2.finishedLevel = false;
    player2.inLevel = true;
    // if(player1.inMatch && player2.inLevel) cont = true;
    if(player2.inLevel) cont = true;
}

function player2Disconnected() {
    player2 = null;
    if(player1.inLevel) {
        player1.inLevel = false;
        clearInterval(intervalTime);
        finishMatch(game.scene.scenes[2]);
    }
    alert('Your rival has surrended');
}

// General

function levelTransition(currentScene) {
    // player1.finishedLevel = player2.finishedLevel = false;
    player1.inLevel = player2.inLevel = false;
    console.log(currentScene);
    currentScene.scene.start('Transition');
}

// VARIABLES

// Scenes

class MainMenu extends Phaser.Scene {

    constructor() {
        // Phaser.Scene.call(this, { key: 'MainMenu' })
        super({ key: 'MainMenu' });
    }

    preload() {
        this.load.image('background', '../assets/images/background.png');
        // this.load.image('boton', '../assets/images/boton_home.png');
    }

    create() {
        game.config.backgroundColor.setTo(0, 0, 0);
        this.add.image(game.config.width, game.config.height, 'background').setOrigin(1.035, 1, 1);
        this.add.text(game.config.width / 2, game.config.height / 1.8, 'Start', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => startMatch(this));

        KEY_INPUTS.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        // KEY_INPUTS.enter.reset();
    }

    update() {
        if (KEY_INPUTS.enter.isDown) startMatch(this);
    }
}

class Transition extends Phaser.Scene {

    constructor() {
        // Phaser.Scene.call(this, { key: 'Transition' })
        super({ key: 'Transition' });
    }

    // preload() {
    // },

    create() {
        // function getTransitionMsg() {
        //     switch (level) {
        //         case 0:
        //             return player1.points > player2.points ? 'Not bad, but don\'t relax' : player2.points == player1.points ? 'Everything\'s even for now' : 'Everything\'s still open, come on!';
        //         case 1:
        //             return player1.points > player2.points ? 'You got the advantage, keep it up' : player2.points == player1.points ? 'It\'s a tie for now' : 'Not everything\'s, you have one round left!';
        //         case 2:
        //             return player1.points > player2.points ? 'Victory! You\'ve won by ' + player1.points + ' to ' + player2.points + ', you\'re awesome!' : player2.points == player1.points ? 'It\'s a tie! Wanna break it?' : 'Your rival won the battle, but not the WAR!';
        //         default:
        //             return 'wat';
        //     }
        // }
        game.config.backgroundColor.setTo(0, 0, 0);

        this.add.text(game.config.width / 2, game.config.height * 5 / 20, `Your score: ${player1.points}` , {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(game.config.width / 2, game.config.height * 6 / 20, `Acummulated score: ${player1.totPoints}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(game.config.width / 2, game.config.height * 9 / 20, 'Rival\'s score: ' + player2.points, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(game.config.width / 2, game.config.height * 10 / 20, `Rival's acummulated score: ${player2.totPoints}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const msg = player1.totPoints > player2.totPoints ? levels[level - 1].transitionMsgs.win : 
            player1.totPoints == player2.totPoints ? levels[level - 1].transitionMsgs.tie : 
            levels[level - 1].transitionMsgs.lose;
        //

        this.add.text(game.config.width / 2, game.config.height * 13 / 20, msg, {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(game.config.width / 2, game.config.height * 16 / 20,
            (level < levels.length) ? 'Next level' : 'Back to Start', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => nextLevel(this));

        KEY_INPUTS.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    update() {
        if (KEY_INPUTS.enter.isDown) nextLevel(this);
    }
}

class Level extends Phaser.Scene {

    constructor() {
        // Phaser.Scene.call(this, { key: 'Level' });
        super({ key: 'Level' });
    }

    preload() {
        this.load.spritesheet('sprites', './assets/sprites/sprite1.png', { frameWidth: 57, frameHeight: 62 });
        this.load.tilemapTiledJSON(`map${level}`, `./assets/maps/${levels[level - 1].map}`);
        this.load.image(`tiles${level}`, `./assets/tilesets/${levels[level - 1].tilesets}`);
    }

    create() {
        const that = this;
        
        socket.on('player2:progress', receivePlayer2Progress);
        socket.on('player2:move', player2Move);
        socket.on('player2:animate', player2Animate);
        // socket.on('player2:move',  player2.move);
        // socket.on('player2:animate', player2.animate);
        // socket.on('player2:resetLocation', player2.resetLocation);
        socket.on('player2:finishedLevel', player2FinishedLevel);

        function receivePlayer2Progress(points, totPoints) {
            console.log('Recibiendo info');
            player2.points = points;
            player2.totPoints = totPoints;
        }

        function player2Move(x, y, flip) {
            player2.move(x, y, flip);
        }
        
        function player2Animate(code) {
            player2.animate(code);
        }
        
        function player2FinishedLevel() {
            console.log('Perdimos, socio');
            player2.finishedLevel = true;
            
            if(player1.finishedLevel) {
                clearInterval(intervalTime);
                levelTransition(that);
            }
        }
        
        game.config.backgroundColor.setTo(178, 255, 255);
        
        const map = this.make.tilemap({ key: `map${level}` });

        const tilesets = map.addTilesetImage('tiles', `tiles${level}`);
        
        const solids = map.createDynamicLayer('solids', tilesets, 0, 0);
        solids.setCollisionByProperty({ solid: true });
        
        //const door = map.createDynamicLayer('door', tilesets, 0, 0);
        //door.setCollisionByProperty({ meta: true });

        textTime = this.add.text(40, 40, 'Time:' + time, {
            fontSize: '20px',
            fill: '#0A0A0A'
        }).setDepth(0.1).setScrollFactor(0);

        /*
        text2 = this.add.text(40,60, 'Puntaje:'+levels[level - 1].player1.points, {
          fontSize: '20px',
          fill: '#0A0A0A'
        }).setDepth(0.1);
        */
        
        player1.sprite = this.physics.add.sprite(levels[level - 1].player1.x, levels[level - 1].player1.y, 'sprites', 0);
        sprite2 = this.physics.add.sprite(levels[level - 1].player2.x, levels[level - 1].player2.y, 'sprites', 0);
        if(player2) player2.sprite = sprite2;

        player1.xInit = levels[level - 1].player1.x;
        player1.yInit = levels[level - 1].player1.y;
        player2.xInit = levels[level - 1].player2.x;
        player2.yInit = levels[level - 1].player2.y;

        //player.setCollideWorldBounds(true)

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('sprites', { start: 1, end: 8 }),
            frameRate: 10
        });
        this.physics.add.collider(player1.sprite, solids);
        this.physics.add.collider(player2.sprite, solids);
        
        //this.physics.add.collider(main_player.sprite, door);
        //this.physics.add.collider(player2.sprite, door);

        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(player1.sprite);
        
        KEY_INPUTS.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        KEY_INPUTS.left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        KEY_INPUTS.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        KEY_INPUTS.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        KEY_INPUTS.n = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
        KEY_INPUTS.f = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }

    update() {
        // Timer
        if (cont) {
            intervalTime = setInterval(() => {
                time--;
                if (time == 0) {
                    clearInterval(intervalTime);
                    if(!player1.finishedLevel) player1.points = 0;
                }
            }, 1000);
            cont = false;
        }

        // Stop movement by default
        player1.sprite.body.setVelocityX(0);
        if(player2) player2.sprite.body.setVelocityX(0);

        // Movements and animations
        if (player2.inLevel && !player1.finishedLevel) {

            // Movements
            if (KEY_INPUTS.up.isDown) {
                player1.jump();
                sendMove();
            }// else if (!player1.sprite.body.onFloor()) sendMove();

            if (KEY_INPUTS.left.isDown) {
                player1.left();
                sendMove();
            } else if (KEY_INPUTS.right.isDown) {
                player1.right();
                sendMove();
            }
    
            // Tricks
            if (KEY_INPUTS.space.isDown) {
                player1.resetLocation();
                sendMove();
            } else if (KEY_INPUTS.f.isDown) {
                if (!player1.f && !player1.finishedLevel) player1.f = true;
            } else if (KEY_INPUTS.n.isDown) {
                if (player1.f && !player1.finishedLevel) {
                    // player1.finishedLevel = true;
                    player1.f = false;
                    finishLevel(this);
                }
            }

            // Animations
            let animCode;
            if(player1.sprite.body.onFloor()) {
                if(KEY_INPUTS.left.isDown || KEY_INPUTS.right.isDown) animCode = ANIMATE_WALKING;
                else animCode = ANIMATE_STANDING;
            } else animCode = ANIMATE_ON_AIR;
            player1.animate(animCode);
            socket.emit('player1:animate', animCode);
        }

        textTime.setText('Time:' + time);
    }
}

// Current room
let room;

// Input
const KEY_INPUTS = {
    // up, right, left, space, n, d, enter
}

// General
let cont, time, time2, textTime, text2, intervalPoints, intervalTime, level;

// Players
const player1 = new Player(socket.id);
let player2, sprite2;

// EXECUTION

// Variables initialization
// initVariables();

// Game

const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    autoResize: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 1000 }
        }
    },
    parent: 'escenas',
    scene: [MainMenu, Transition, Level]
})
