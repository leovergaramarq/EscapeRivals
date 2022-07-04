import { SPEED, JUMP_HEIGHT, ANIMATE_ON_AIR, ANIMATE_STANDING, ANIMATE_WALKING } from './constants.js';

export default class Player {
    constructor(id, SPEED, jumpHeight) {
        this.id = id;
        // this.inMatch = false;
        this.inLevel = false;
        this.finishedLevel = false;
        this.sprite = null;
        this.xInit = 0;
        this.yInit = 0;
    }

    jump() {
        if (this.sprite.body.onFloor())
            this.sprite.body.setVelocityY(JUMP_HEIGHT);
    }
    
    right() {
        this.sprite.body.setVelocityX(SPEED);
        this.sprite.flipX = false;
    }
    
    left() {
        this.sprite.body.setVelocityX(-SPEED);
        this.sprite.flipX = true;
    }
    
    resetLocation() {
        this.sprite.setX(this.xInit);
        this.sprite.setY(this.yInit);
    }

    move(x, y, flip) {
        if (!this.sprite) return;

        this.sprite.setX(x);
        this.sprite.setY(y);
        if (this.sprite.flipX != flip) this.sprite.flipX = flip;
    }
      
    animate(code) {
        if (!this.sprite) return;
        
        switch (code) {
            case ANIMATE_WALKING: this.sprite.anims.play('walk', true); break;
            case ANIMATE_STANDING: this.sprite.setFrame(0); break;
            case ANIMATE_ON_AIR: this.sprite.setFrame(9);
        }
    }
}
