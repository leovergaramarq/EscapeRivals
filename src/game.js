socket.on('print:id', ()=>{
  printId();
});

socket.on('sala:disp', (disp)=>{
  salaDisp=disp;
});

socket.on('jugador2:playing', (id)=>{
  jugador2Playing(id);
});

socket.on('jugador:mov', (x, y, flip)=>{
  moveJugador(x, y, flip);
});

socket.on('jugador:anim_caminar', (a)=>{
  animJugador(a);
});

socket.on('jugador:reset', ()=>{
  user2.jugador.reset();
});

socket.on('jugador:left', ()=>{
  user2.playing=false;
});

var cont, tiempo, tiempo2, texto1, texto2, intervalo1, intervalo, salaDisp, partida, nivel, main, niveles, user1, user2,
arriba, derecha, izquierda, space, n, d, inicio, mapa;
const velocidad=350, alturaSalto=-500;
init();

var Inicio = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize:
    function Inicio() {
      Phaser.Scene.call(this, { key: 'Inicio' });
    },

    preload(){
      this.load.image('title_bg','./assets/images/escape_rivals.png');
      this.load.image('boton','./assets/images/boton_inicio.png');
    },

    create() {
      game.config.backgroundColor.setTo(0, 0, 0);
      this.add.image(game.config.width,game.config.height, 'title_bg').setOrigin(1.035, 1,1);
      /*
      var nombre=this.add.text(game.config.width/2,game.config.height/3.5,'Escape Rivals',{
        fontSize:'60px',
        fill: '#ffffff'
      }).setOrigin(0.5)
      */
      var texto = this.add.text(game.config.width / 2, game.config.height / 1.8, 'Iniciar', {
        fontSize: '40px',
        fill: '#ffffff'
      }).setOrigin(0.5).setInteractive();
      texto.on('pointerdown', () => {
        iniciarJuego(this);
      });
      iniciar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      iniciar.reset();
    },

    update(){
      if(iniciar.isDown){
        iniciarJuego(this);
      }
    }
});

var Transicion = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize:
    function Transicion() {
      Phaser.Scene.call(this, { key: 'Transicion' });
    },

    preload(){
    },

    create() {
      game.config.backgroundColor.setTo(0, 0, 0);
      //let p1=tiempo, p2=tiempo2;

      let p1=0, p2=0;
      for(let i=0; i<=nivel; i++){
        p1+=niveles[i].jugador1.puntos;
        p2+=niveles[i].jugador2.puntos;
      }

      var msg;
      switch (nivel) {
        case 0:
          msg=p1>p2?"Nada mal, pero no te confíes":p2==p1?"Todo está igualado por ahora":"No es momento de bajar el ánimo, aún";
        break;
        case 1:
          msg=p1>p2?"Llevas la ventaja, sigue así":p2==p1?"Un empate, eh?.":"No todo está perdido, te queda un round";
        break;
        case 2:
          msg=p1>p2?"Ganaste por "+p1+" a "+p2+", eres Asombroso.":p2==p1?"Es un Empate! ¿Quieres volver a Intentar?":"Tu Rival Ganó la Batalla, pero no la Guerra!!!";
      }
      this.add.text(game.config.width/2,game.config.height/5,'Puntaje acumulado',{
        fontSize:'40px',
        fill: '#ffffff'
      }).setOrigin(0.5)
      this.add.text(game.config.width/2,game.config.height/3,'Tu puntaje: '+p1,{
        fontSize:'40px',
        fill: '#ffffff'
      }).setOrigin(0.5)
      this.add.text(game.config.width/2,game.config.height/2.5,'Puntaje de tu Rival: '+p2,{
        fontSize:'40px',
        fill: '#ffffff'
      }).setOrigin(0.5)
      this.add.text(game.config.width/2,game.config.height/2, msg,{
        fontSize:'40px',
        fill: '#ffffff'
      }).setOrigin(0.5)
      var txt=this.add.text(game.config.width/2,game.config.height/1.5,(nivel<2)?'Siguiente nivel':'Volver a la Pantalla de Inicio',{
        fontSize:'40px',
        fill: '#ffffff'
      }).setOrigin(0.5).setInteractive();
      txt.on('pointerdown', () => {
        nextLevel(this);
      });
      iniciar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    },

    update(){
      if(iniciar.isDown){
        nextLevel(this);
      }
    }
});

var Principal = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize:
  function Principal() {
    Phaser.Scene.call(this, { key: 'Principal' });
  },

  preload(){
    initNivel(this);
  },

  create(){
    socket.on('jugador:main',(id)=>{
      jugadorMain(this, (id==socket.id));
    });

    socket.on('jugador:info', (puntos)=>{
      console.log('Recibiendo info.');
      niveles[nivel].jugador2.puntos=puntos;
      tiempo2=puntos;
    });

    socket.on('jugador:finished', ()=>{
      console.log('Perdimos, socio.');
      user2.finished=true;
    });

    socket.on('game:transición', ()=>{
      console.log('Continuando transición.');
      transición(this);
    });

    socket.on('jugador:next_nivel', ()=>{
      console.log('Hurry up, te están esperando.');
      user2.playing=true;
    });

    socket.on('nivel:next', ()=>{
      console.log('Partida confirmada.');
      partida=true;
    });

    game.config.backgroundColor.setTo(178, 255, 255);
    mapa = this.make.tilemap({ key: 'mapa'+nivel });
    var tilesets = mapa.addTilesetImage('tiles', 'tiles'+nivel)
    var solidos = mapa.createDynamicLayer('solidos', tilesets, 0, 0)
    solidos.setCollisionByProperty({ solido: true });
    //var puerta = mapa.createDynamicLayer('puerta', tilesets, 0, 0)
    //puerta.setCollisionByProperty({ meta: true });

    texto1 = this.add.text(40,40, 'Tiempo:'+tiempo, {
      fontSize: '20px',
      fill: '#0A0A0A'
    }).setDepth(0.1);
    /*
    texto2 = this.add.text(40,60, 'Puntaje:'+niveles[nivel].jugador1.puntos, {
      fontSize: '20px',
      fill: '#0A0A0A'
    }).setDepth(0.1);
    */
    user1.jugador=this.physics.add.sprite(niveles[0].main.x, niveles[0].main.y,'personajes',0);
    user2.jugador=this.physics.add.sprite(niveles[0].not_main.x, niveles[0].not_main.y,'personajes',0);
    //user1.jugador.setSize(25,0);
    //user2.jugador.setSize(25,0);
    initJugador(user1);
    initJugador(user2);
    if(partida && nivel==0){
      console.log("Calculando main...");
      socket.emit('jugador:main');
    }
    printId();
    //jugador.setCollideWorldBounds(true)

    this.anims.create({
      key: 'caminar',
      frames: this.anims.generateFrameNumbers('personajes', { start: 1, end: 8 }),
      frameRate: 10
    });
    this.physics.add.collider(user1.jugador, solidos);
    this.physics.add.collider(user2.jugador, solidos);
    this.cameras.main.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    this.cameras.main.startFollow(user1.jugador);
    //this.physics.add.collider(user1.jugador, puerta);
    //this.physics.add.collider(user2.jugador, puerta);

    arriba = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    izquierda = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    derecha = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    n=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    d=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  },

  update(){
    updateNivel(this);
  }
});

function printId(){
  console.log(socket.id);
}

function iniciarJuego(inicio){
  if(salaDisp){
    nivel=0;
    user1.playing=true;
    inicio.scene.start('Principal');
    socket.emit('sala:in');
  }
}

function jugador2Playing(id){
  user2.id=id;
  if(id!=null){
    partida=user2.playing=true;
  }else{
    user2.playing=false;
    console.log(user2.id,"se ha desconectado.");
  }
}

function initNivel(principal){
  //principal.load.spritesheet('personajes','assets/sprites/personaje1.png',{frameWidth:37, frameHeight:45})
  principal.load.spritesheet('personajes','./assets/sprites/personaje1.png',{frameWidth:57, frameHeight:62});
  principal.load.tilemapTiledJSON('mapa'+nivel, './assets/mapas/'+nivel+'.json');
  principal.load.image('tiles'+nivel,'./assets/tilesets/'+nivel+'.png');
  console.log("Nivel ",(nivel+1)," cargado.");
}

function initJugador(user){
  if(user.jugador==user1.jugador){
    user.playing=true;
    //user.id=socket.id;
  }

  user.jugador.saltar=function(){
    if(user.jugador.body.onFloor()){
      user.jugador.body.setVelocityY(alturaSalto);
    }
  };
  user.jugador.derecha=function(){
    user.jugador.body.setVelocityX(velocidad);
    user.jugador.flipX = false;
  };
  user.jugador.izquierda=function(){
    user.jugador.body.setVelocityX(-velocidad);
    user.jugador.flipX = true;
  };
}

function jugadorMain(principal, bool){
  main=bool;
  var x1=niveles[nivel].main.x, y1=niveles[nivel].main.y,
  x2=niveles[nivel].not_main.x, y2=niveles[nivel].not_main.y;

  if(!bool){
    var a=x1, b=y1;
    x1=x2; y1=y2; x2=a; y2=b;
    user1.jugador.setX(x1);
    user1.jugador.setY(y1);
    user2.jugador.setX(x2);
    user2.jugador.setY(y2);
  }
  user1.jugador.reset=function(){
    user1.jugador.setX(x1);
    user1.jugador.setY(y1);
  };

  user2.jugador.reset=function(){
    user2.jugador.setX(x2);
    user2.jugador.setY(y2);
  };

  if(this.main) console.log("main");
  else console.log("not main");
}

function updateNivel(principal){

  user1.jugador.body.setVelocityX(0);
  user2.jugador.body.setVelocityX(0);
  if(!salaDisp && cont){
    intervalo=setInterval(function(){tiempo=tiempo-1;}, 1000);
    intervalo1=setInterval(function(){
      if(niveles[nivel]!=undefined) niveles[nivel].jugador1.puntos-=3;
    }, 3000);
    cont=false;
  }
  if(tiempo==0){
    clearInterval(intervalo);
  }
  if(niveles[nivel].jugador1.puntos==0){
    clearInterval(intervalo1);
  }
  texto1.setText('Tiempo:'+tiempo);
  //texto2.setText('Puntaje:'+niveles[nivel].jugador1.puntos);

  if(partida && !user1.finished){
    if(izquierda.isDown){
      user1.jugador.izquierda();
      socket.emit("jugador:izquierda", user1.jugador.x, user1.jugador.y);
    }
    if(derecha.isDown){
      user1.jugador.derecha();
      socket.emit("jugador:derecha", user1.jugador.x, user1.jugador.y);
    }
    if(arriba.isDown){
      user1.jugador.saltar();
      socket.emit("jugador:salto", user1.jugador.x, user1.jugador.y);
    }else if(!user1.jugador.body.onFloor()){
      socket.emit("jugador:salto", user1.jugador.x, user1.jugador.y);
    }

    if((izquierda.isDown || derecha.isDown) && user1.jugador.body.onFloor()){
      user1.jugador.anims.play('caminar',true);
      socket.emit('jugador:anim_caminar', 0);
    }else if(!user1.jugador.body.onFloor()){
        user1.jugador.setFrame(9);
        socket.emit('jugador:anim_caminar', 1);
    }else{
        user1.jugador.setFrame(0);
        socket.emit('jugador:anim_caminar', 2);
    }

    if(space.isDown){
      user1.jugador.reset();
      socket.emit("jugador:reset");
    }
    if(n.isDown){
      finishLevel(principal);
    }
    if(d.isDown){
      if(!user1.done){
        user1.done=true;
        console.log('done');
      }
    }
  }
}

function moveJugador(x, y, flip){
  user2.jugador.setX(x);
  user2.jugador.setY(y);
  if(flip==1) user2.jugador.flipX=true;
  else if(flip==0) user2.jugador.flipX=false;
}

function animJugador(a){
  if(user2.jugador==undefined) return;
  switch(a){
    case 0: user2.jugador.anims.play('caminar',true); break;
    case 1: user2.jugador.setFrame(9); break;
    case 2: user2.jugador.setFrame(0);
  }
}

function nextLevel(transición){
  nivel++;
  if(nivel>2){
    console.log("Fin del Juego.");
    restartGame(transición);
    salaDisp=false;
    socket.emit('game:end');
  }else{
    console.log("Pasando al nivel ",(nivel+1));
    user1.playing=true;
    socket.emit('jugador:next_nivel');
    transición.scene.start('Principal');
  }
}

function sendPuntos(){
  //socket.emit('jugador:info', niveles[nivel].jugador1.puntos);
  niveles[nivel].jugador1.puntos=tiempo;
  socket.emit('jugador:info', tiempo);
}

function finishLevel(principal){
  if(user1.done && !user1.finished){
    console.log('Nivel terminado.');
    user1.done=false;
    user1.finished=true;
    sendPuntos();
    socket.emit('jugador:finished');
    /*
    if(!user2.finished) socket.emit('jugador:finished');
    else socket.emit('jugador:finished', principal);;
    */
    if(!user2.finished) principal.cameras.main.startFollow(user2.jugador);
  }
}

function transición(principal){
  partida=user1.playing=user2.playing=user1.finished=user2.finished=false;
  principal.scene.start('Transicion');
}

function restartGame(transición){
  init();
  socket.emit('game:restart');
  transición.scene.start('Inicio');
}

function init(){
  this.cont=true;
  this.tiempo=1000;
  this.texto1;

  this.salaDisp=true; this.partida=false;
  this.nivel=20;
  this.main=null;
  this.niveles=[
    {
      mapa: '', tileSets: '', tiempoInicial: 240,
      jugador1:{monedas: 0, tiempoRest: 120, puntos: 3000},
      jugador2:{monedas: 0, tiempoRest: 120, puntos: 3000},
      main:{x: 100, y: 0},
      not_main:{x: 160, y: 0}
    },
    {
      mapa: '', tileSets: '', tiempoInicial: 240,
      jugador1:{monedas: 0, tiempoRest: 120, puntos: 3000},
      jugador2:{monedas: 0, tiempoRest: 120, puntos: 3000},
      main:{x: 100, y: 0},
      not_main:{x: 160, y: 0}
    },
    {
      mapa: '', tileSets: '', tiempoInicial: 240,
      jugador1:{monedas: 0, tiempoRest: 120, puntos: 3000},
      jugador2:{monedas: 0, tiempoRest: 120, puntos: 3000},
      main:{x: 100, y: 0},
      not_main:{x: 160, y: 0}
    }
  ];
  this.user1={playing: false, id: socket.id, done: false, finished: false};
  this.user2={playing: false, id: null, done: false, finished: false};
}

var config={
  type: Phaser.AUTO,
  width:window.innerWidth,
  height: window.innerHeight,
  autoResize:true,
  physics:{
    default: 'arcade',
    arcade:{
      debug: false,
      gravity: {y: 1000}
    }
  },
  parent:'escenas',
  scene: [Inicio, Transicion, Principal]
};

var game = new Phaser.Game(config);
