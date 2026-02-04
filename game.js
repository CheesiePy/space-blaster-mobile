/**
 * Space Blaster 2.0 - Smart TV Game
 * Built with Phaser 2 CE
 */

// ============================================
// SAFE ZONE CONSTANTS (5% margin from edges)
// ============================================
const SAFE_MARGIN = 0.05;
const SAFE_LEFT = 1920 * SAFE_MARGIN;        // 96px
const SAFE_RIGHT = 1920 * (1 - SAFE_MARGIN); // 1824px
const SAFE_TOP = 1080 * SAFE_MARGIN;         // 54px
const SAFE_BOTTOM = 1080 * (1 - SAFE_MARGIN);// 1026px
const SAFE_WIDTH = SAFE_RIGHT - SAFE_LEFT;   // 1728px
const SAFE_HEIGHT = SAFE_BOTTOM - SAFE_TOP;  // 972px

// ============================================
// KEY CODES FOR SMART TV
// ============================================
const KEYS = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    ENTER: 13,
    BACK_WEBOS: 461,
    BACK_TIZEN: 10009
};

// ============================================
// SPACESHIP TYPES
// ============================================
const SHIP_TYPES = [
    {
        name: 'STRIKER',
        color: 0x00ff00,
        speed: 14,
        fireRate: 200,
        bulletColor: 0x00ffff,
        description: 'Balanced & Fast'
    },
    {
        name: 'SENTINEL',
        color: 0x3366ff,
        speed: 10,
        fireRate: 150,
        bulletColor: 0x99ccff,
        description: 'Rapid Fire'
    },
    {
        name: 'VANGUARD',
        color: 0xffcc00,
        speed: 18,
        fireRate: 350,
        bulletColor: 0xffaa00,
        description: 'High Speed'
    }
];

// ============================================
// SOUND SYNTHESIZER (Web Audio API)
// ============================================
class SoundEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.value = 0.3;
        this.masterVolume.connect(this.ctx.destination);
    }

    playLaser() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    startMusic() {
        if (this.musicStarted) return;
        this.musicStarted = true;
        this.playBeat();
    }

    playBeat() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
        
        // Simple 4/4 loop
        setTimeout(() => this.playBeat(), 500);
        
        // Add a random melody note sometimes
        if (Math.random() > 0.7) {
            this.playNote();
        }
    }

    playNote() {
        const notes = [261.63, 311.13, 392.00, 466.16]; // C4, Eb4, G4, Bb4
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}

// ============================================
// CURSOR MANAGER
// ============================================
class CursorManager {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.currentIndex = 0;
        this.onSelect = null;
        this.enabled = false;
    }

    setItems(items, onSelect) {
        this.items = items;
        this.onSelect = onSelect;
        this.currentIndex = 0;
        this.enabled = true;
        this.updateHighlight();
    }

    moveUp() {
        if (!this.enabled || this.items.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.updateHighlight();
    }

    moveDown() {
        if (!this.enabled || this.items.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateHighlight();
    }

    moveLeft() {
        this.moveUp();
    }

    moveRight() {
        this.moveDown();
    }

    select() {
        if (!this.enabled || this.items.length === 0) return;
        if (this.onSelect) {
            this.onSelect(this.currentIndex, this.items[this.currentIndex]);
        }
    }

    updateHighlight() {
        this.items.forEach((item, index) => {
            if (index === this.currentIndex) {
                if (item.setShipHighlight) {
                    item.setShipHighlight(true);
                } else {
                    item.setStyle({ fill: '#ffff00' });
                    item.alpha = 1;
                }
            } else {
                if (item.setShipHighlight) {
                    item.setShipHighlight(false);
                } else {
                    item.setStyle({ fill: '#ffffff' });
                    item.alpha = 0.7;
                }
            }
        });
    }
}

// ============================================
// BOOT STATE
// ============================================
const BootState = {
    create: function() {
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.pageAlignHorizontally = true;
        this.game.scale.pageAlignVertically = true;
        this.game.soundEngine = new SoundEngine();
        this.game.state.start('Menu');
    }
};

// ============================================
// MENU STATE
// ============================================
const MenuState = {
    create: function() {
        this.createStarfield();

        const title = this.game.add.text(960, SAFE_TOP + 150, 'SPACE BLASTER 2.0', { font: 'bold 84px Arial', fill: '#00ffff', align: 'center' });
        title.anchor.setTo(0.5);
        title.setShadow(4, 4, '#003366', 8);

        const startText = this.game.add.text(960, 550, '▶ START MISSION', { font: '52px Arial', fill: '#ffffff' });
        startText.anchor.setTo(0.5);

        const exitText = this.game.add.text(960, 650, '✕ EXIT', { font: '52px Arial', fill: '#ffffff' });
        exitText.anchor.setTo(0.5);

        this.cursorManager = new CursorManager(this.game);
        this.cursorManager.setItems([startText, exitText], (index) => {
            if (index === 0) {
                this.game.soundEngine.startMusic();
                this.game.state.start('ShipSelect');
            } else if (window.close) window.close();
        });

        this.inputHandler = (e) => {
            if (e.keyCode === KEYS.UP) this.cursorManager.moveUp();
            if (e.keyCode === KEYS.DOWN) this.cursorManager.moveDown();
            if (e.keyCode === KEYS.ENTER) this.cursorManager.select();
        };
        document.addEventListener('keydown', this.inputHandler);
    },

    createStarfield: function() {
        const graphics = this.game.add.graphics(0, 0);
        graphics.beginFill(0x0a0a20);
        graphics.drawRect(0, 0, 1920, 1080);
        graphics.endFill();
        for (let i = 0; i < 200; i++) {
            graphics.beginFill(0xffffff, Math.random() * 0.5 + 0.5);
            graphics.drawCircle(Math.random() * 1920, Math.random() * 1080, Math.random() * 2 + 1);
        }
    },

    shutdown: function() {
        document.removeEventListener('keydown', this.inputHandler);
    }
};

// ============================================
// SHIP SELECTION STATE
// ============================================
const ShipSelectState = {
    create: function() {
        this.game.add.text(960, 200, 'CHOOSE YOUR SPACESHIP', { font: '64px Arial', fill: '#00ffff' }).anchor.setTo(0.5);

        const shipContainers = [];
        SHIP_TYPES.forEach((type, i) => {
            const x = 500 + i * 460;
            const container = this.game.add.group();
            container.x = x;
            container.y = 540;

            const bg = this.game.add.graphics(0, 0);
            bg.lineStyle(4, 0xffffff, 0.3);
            bg.beginFill(0x111111);
            bg.drawRect(-180, -250, 360, 500);
            container.add(bg);

            const ship = this.game.add.graphics(0, -80);
            ship.beginFill(type.color);
            ship.moveTo(0, -40); ship.lineTo(35, 40); ship.lineTo(-35, 40); ship.lineTo(0, -40);
            ship.endFill();
            container.add(ship);

            const name = this.game.add.text(0, 50, type.name, { font: 'bold 36px Arial', fill: '#ffffff' });
            name.anchor.setTo(0.5);
            container.add(name);

            const desc = this.game.add.text(0, 100, type.description, { font: '24px Arial', fill: '#aaaaaa' });
            desc.anchor.setTo(0.5);
            container.add(desc);

            container.setShipHighlight = (hl) => {
                bg.clear();
                bg.lineStyle(6, hl ? 0xffff00 : 0xffffff, hl ? 1 : 0.3);
                bg.beginFill(hl ? 0x222222 : 0x111111);
                bg.drawRect(-180, -250, 360, 500);
            };
            shipContainers.push(container);
        });

        this.cursorManager = new CursorManager(this.game);
        this.cursorManager.setItems(shipContainers, (index) => {
            this.game.selectedShip = SHIP_TYPES[index];
            this.game.state.start('Play');
        });

        this.inputHandler = (e) => {
            if (e.keyCode === KEYS.LEFT) this.cursorManager.moveLeft();
            if (e.keyCode === KEYS.RIGHT) this.cursorManager.moveRight();
            if (e.keyCode === KEYS.ENTER) this.cursorManager.select();
        };
        document.addEventListener('keydown', this.inputHandler);
    },

    shutdown: function() {
        document.removeEventListener('keydown', this.inputHandler);
    }
};

// ============================================
// PLAY STATE
// ============================================
const PlayState = {
    create: function() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameOver = false;
        this.shipConfig = this.game.selectedShip || SHIP_TYPES[0];

        this.createBackground();
        this.createPlayer();

        this.enemies = this.game.add.group();
        this.enemyBullets = this.game.add.group();
        this.bullets = this.game.add.group();

        this.createUI();
        this.setupInput();

        this.spawnTimer = this.game.time.events.loop(1500, this.spawnEnemy, this);
        this.lastFire = 0;
    },

    createBackground: function() {
        this.game.add.graphics(0, 0).beginFill(0x0a0a20).drawRect(0, 0, 1920, 1080);
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            const star = this.game.add.graphics(Math.random() * 1920, Math.random() * 1080);
            star.beginFill(0xffffff, Math.random() * 0.5 + 0.5).drawCircle(0, 0, Math.random() * 2 + 1);
            star.speed = Math.random() * 2 + 1;
            this.stars.push(star);
        }
    },

    createPlayer: function() {
        this.player = this.game.add.graphics(960, 900);
        this.player.beginFill(this.shipConfig.color);
        this.player.moveTo(0, -35); this.player.lineTo(30, 35); this.player.lineTo(-30, 35); this.player.lineTo(0, -35);
        this.player.endFill();
        this.player.beginFill(this.shipConfig.bulletColor); this.player.drawRect(-12, 30, 24, 8);
        this.player.speed = this.shipConfig.speed;
    },

    createUI: function() {
        this.scoreText = this.game.add.text(SAFE_LEFT + 20, SAFE_TOP + 20, 'SCORE: 0', { font: '36px Arial', fill: '#00ffff' });
        this.levelText = this.game.add.text(960, SAFE_TOP + 20, 'LEVEL: 1', { font: '36px Arial', fill: '#ffff00' });
        this.levelText.anchor.setTo(0.5, 0);
        this.livesText = this.game.add.text(SAFE_RIGHT - 20, SAFE_TOP + 20, 'LIVES: 3', { font: '36px Arial', fill: '#ff6666' });
        this.livesText.anchor.setTo(1, 0);
    },

    setupInput: function() {
        this.keyState = { left: false, right: false, fire: false };
        this.kd = (e) => {
            if (e.keyCode === KEYS.LEFT) this.keyState.left = true;
            if (e.keyCode === KEYS.RIGHT) this.keyState.right = true;
            if (e.keyCode === KEYS.ENTER) this.keyState.fire = true;
        };
        this.ku = (e) => {
            if (e.keyCode === KEYS.LEFT) this.keyState.left = false;
            if (e.keyCode === KEYS.RIGHT) this.keyState.right = false;
            if (e.keyCode === KEYS.ENTER) this.keyState.fire = false;
        };
        document.addEventListener('keydown', this.kd);
        document.addEventListener('keyup', this.ku);
    },

    update: function() {
        if (this.gameOver) return;

        this.stars.forEach(s => { s.y += s.speed; if (s.y > 1080) s.y = 0; });

        if (this.keyState.left && this.player.x > SAFE_LEFT + 40) this.player.x -= this.player.speed;
        if (this.keyState.right && this.player.x < SAFE_RIGHT - 40) this.player.x += this.player.speed;
        if (this.keyState.fire) this.fire();

        this.bullets.forEach(b => { b.y -= 15; if (b.y < -50) b.destroy(); });
        this.enemyBullets.forEach(b => { b.y += 8 + (this.level * 0.5); if (b.y > 1100) b.destroy(); });
        this.enemies.forEach(e => {
            e.y += e.speed;
            if (e.y > 1100) e.destroy();
            if (Math.random() < 0.005 + (this.level * 0.002)) this.enemyFire(e);
        });

        this.checkCollisions();
    },

    fire: function() {
        if (this.game.time.now - this.lastFire < this.shipConfig.fireRate) return;
        this.lastFire = this.game.time.now;
        const b = this.game.add.graphics(this.player.x, this.player.y - 40);
        b.beginFill(this.shipConfig.bulletColor).drawRect(-4, -15, 8, 30);
        this.bullets.add(b);
        this.game.soundEngine.playLaser();
    },

    spawnEnemy: function() {
        const enemy = this.game.add.graphics(SAFE_LEFT + Math.random() * SAFE_WIDTH, -50);
        enemy.beginFill(0xff4444);
        enemy.moveTo(0, -25); enemy.lineTo(25, 0); enemy.lineTo(0, 25); enemy.lineTo(-25, 0); enemy.lineTo(0, -25);
        enemy.speed = (3 + Math.random() * 3) * (1 + (this.level - 1) * 0.1);
        this.enemies.add(enemy);
    },

    enemyFire: function(e) {
        const b = this.game.add.graphics(e.x, e.y + 30);
        b.beginFill(0xff6600).drawCircle(0, 0, 10);
        this.enemyBullets.add(b);
    },

    checkCollisions: function() {
        this.bullets.forEach(b => {
            this.enemies.forEach(e => {
                if (Phaser.Math.distance(b.x, b.y, e.x, e.y) < 35) {
                    b.destroy(); this.killEnemy(e);
                }
            });
        });
        this.enemyBullets.forEach(b => {
            if (Phaser.Math.distance(b.x, b.y, this.player.x, this.player.y) < 30) {
                b.destroy(); this.hitPlayer();
            }
        });
        this.enemies.forEach(e => {
            if (Phaser.Math.distance(e.x, e.y, this.player.x, this.player.y) < 45) {
                this.killEnemy(e); this.hitPlayer();
            }
        });
    },

    killEnemy: function(e) {
        this.game.soundEngine.playExplosion();
        const ex = this.game.add.graphics(e.x, e.y);
        ex.beginFill(0xff6600).drawCircle(0, 0, 40);
        this.game.time.events.add(100, () => ex.destroy());
        e.destroy();
        this.score += 100;
        this.scoreText.setText('SCORE: ' + this.score);
        
        if (Math.floor(this.score / 1000) + 1 > this.level) {
            this.levelUp();
        }
    },

    levelUp: function() {
        this.level++;
        this.levelText.setText('LEVEL: ' + this.level);
        this.spawnTimer.delay = Math.max(500, 1500 - (this.level * 100));
        
        const msg = this.game.add.text(960, 540, 'LEVEL UP!', { font: 'bold 84px Arial', fill: '#ffff00' });
        msg.anchor.setTo(0.5);
        this.game.time.events.add(1500, () => msg.destroy());
    },

    hitPlayer: function() {
        this.lives--;
        this.livesText.setText('LIVES: ' + this.lives);
        this.player.tint = 0xff0000;
        this.game.time.events.add(150, () => this.player.tint = 0xffffff);
        if (this.lives <= 0) this.gameOverState();
    },

    gameOverState: function() {
        this.gameOver = true;
        this.game.global = { finalScore: this.score };
        this.game.time.events.add(1000, () => this.game.state.start('GameOver'));
    },

    shutdown: function() {
        document.removeEventListener('keydown', this.kd);
        document.removeEventListener('keyup', this.ku);
    }
};

// ============================================
// GAME OVER STATE
// ============================================
const GameOverState = {
    create: function() {
        this.game.add.graphics(0, 0).beginFill(0x1a0a0a).drawRect(0, 0, 1920, 1080);
        const t = this.game.add.text(960, 300, 'MISSION OVER', { font: 'bold 96px Arial', fill: '#ff4444' });
        t.anchor.setTo(0.5);
        const s = this.game.add.text(960, 450, 'FINAL SCORE: ' + (this.game.global ? this.game.global.finalScore : 0), { font: '48px Arial', fill: '#ffffff' });
        s.anchor.setTo(0.5);

        const r = this.game.add.text(960, 600, '▶ RESTART', { font: '42px Arial', fill: '#ffffff' });
        r.anchor.setTo(0.5);
        const m = this.game.add.text(960, 680, '◀ MAIN MENU', { font: '42px Arial', fill: '#ffffff' });
        m.anchor.setTo(0.5);

        this.cm = new CursorManager(this.game);
        this.cm.setItems([r, m], (i) => i === 0 ? this.game.state.start('ShipSelect') : this.game.state.start('Menu'));

        this.kh = (e) => {
            if (e.keyCode === KEYS.UP) this.cm.moveUp();
            if (e.keyCode === KEYS.DOWN) this.cm.moveDown();
            if (e.keyCode === KEYS.ENTER) this.cm.select();
        };
        document.addEventListener('keydown', this.kh);
    },
    shutdown: function() { document.removeEventListener('keydown', this.kh); }
};

const game = new Phaser.Game(1920, 1080, Phaser.AUTO, 'game-container');
game.state.add('Boot', BootState);
game.state.add('Menu', MenuState);
game.state.add('ShipSelect', ShipSelectState);
game.state.add('Play', PlayState);
game.state.add('GameOver', GameOverState);
game.state.start('Boot');
