/**
 * Space Blaster 3.2.2 - Stability Overhaul
 */

const SAFE_MARGIN = 0.05;
const SAFE_LEFT = 1920 * SAFE_MARGIN;
const SAFE_RIGHT = 1920 * (1 - SAFE_MARGIN);
const SAFE_TOP = 1080 * SAFE_MARGIN;
const SAFE_BOTTOM = 1080 * (1 - SAFE_MARGIN);
const SAFE_WIDTH = SAFE_RIGHT - SAFE_LEFT;
const SAFE_HEIGHT = SAFE_BOTTOM - SAFE_TOP;

const KEYS = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, BACK_WEBOS: 461, BACK_TIZEN: 10009 };

const WEAPON_TYPES = {
    NORMAL: { name: 'PLASMA', fireRate: 200, speed: 15, color: 0x00ffff, spread: 0, count: 1 },
    SPREAD: { name: 'SPREAD', fireRate: 300, speed: 12, color: 0xff00ff, spread: 0.3, count: 3 },
    BEAM: { name: 'HYPER BEAM', fireRate: 100, speed: 25, color: 0xffff00, spread: 0, count: 1 },
    WAVE: { name: 'WAVE', fireRate: 250, speed: 10, color: 0x00ff00, spread: 0.5, count: 5 }
};

const SHIP_TYPES = [
    { name: 'STRIKER', color: 0x00ff00, speed: 18, fireRateMult: 1, description: 'Fast & Agile' },
    { name: 'SENTINEL', color: 0x3366ff, speed: 12, fireRateMult: 0.7, description: 'Heavy Armor' },
    { name: 'VANGUARD', color: 0xffcc00, speed: 22, fireRateMult: 1.2, description: 'Interceptor' }
];

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.musicStarted = false;
    }
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.value = 0.3;
            this.masterVolume.connect(this.ctx.destination);
        } catch(e) { console.error("Audio init failed", e); }
    }
    resume() { 
        if(!this.ctx) this.init();
        if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); 
    }
    playLaser(type = 'NORMAL') {
        this.resume();
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type === 'BEAM' ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(type === 'WAVE' ? 400 : 800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.masterVolume);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
    playExplosion() {
        this.resume();
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain); gain.connect(this.masterVolume);
        osc.start(); osc.stop(this.ctx.currentTime + 0.3);
    }
    playPowerUp() {
        this.resume();
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.masterVolume);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
    }
    startMusic() { 
        this.resume();
        if (!this.musicStarted && this.ctx) { 
            this.musicStarted = true; 
            this.playBeat(); 
        } 
    }
    playBeat() {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.masterVolume);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
        setTimeout(() => this.playBeat(), 400);
    }
}

class CursorManager {
    constructor(game) { this.game = game; this.items = []; this.currentIndex = 0; this.onSelect = null; this.enabled = false; }
    setItems(items, onSelect) { this.items = items; this.onSelect = onSelect; this.currentIndex = 0; this.enabled = true; this.updateHighlight(); }
    moveNext() { if (!this.enabled || this.items.length === 0) return; this.currentIndex = (this.currentIndex + 1) % this.items.length; this.updateHighlight(); }
    movePrev() { if (!this.enabled || this.items.length === 0) return; this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length; this.updateHighlight(); }
    select() { if (!this.enabled || this.items.length === 0) return; if (this.onSelect) this.onSelect(this.currentIndex, this.items[this.currentIndex]); }
    updateHighlight() {
        this.items.forEach((item, index) => {
            const hl = index === this.currentIndex;
            if (item.setShipHighlight) item.setShipHighlight(hl);
            else if (item.setStyle) { item.setStyle({ fill: hl ? '#ffff00' : '#ffffff' }); item.alpha = hl ? 1 : 0.7; }
        });
    }
}

const BootState = {
    create: function() {
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.pageAlignHorizontally = true;
        this.game.scale.pageAlignVertically = true;
        this.game.soundEngine = new SoundEngine();
        this.game.state.start('Menu');
    }
};

const MenuState = {
    create: function() {
        this.game.add.graphics(0, 0).beginFill(0x0a0a20).drawRect(0, 0, 1920, 1080);
        const title = this.game.add.text(960, 300, 'SPACE BLASTER 3.2', { font: 'bold 90px Arial', fill: '#00ffff' }); title.anchor.setTo(0.5);
        const start = this.game.add.text(960, 550, '▶ START MISSION', { font: '52px Arial', fill: '#ffffff' }); start.anchor.setTo(0.5);
        this.cursorManager = new CursorManager(this.game);
        this.cursorManager.setItems([start], () => { 
            this.game.soundEngine.startMusic(); 
            this.game.state.start('ShipSelect'); 
        });
        this.game.input.keyboard.addCallbacks(this, (e) => {
            if (e.keyCode === KEYS.ENTER) { this.cursorManager.select(); }
        });
    },
    shutdown: function() { this.game.input.keyboard.onDownCallback = null; }
};

const ShipSelectState = {
    create: function() {
        this.game.add.text(960, 150, 'SELECT CRAFT', { font: '64px Arial', fill: '#00ffff' }).anchor.setTo(0.5);
        const items = [];
        SHIP_TYPES.forEach((t, i) => {
            const x = 500 + i * 460;
            const group = this.game.add.group(); group.x = x; group.y = 540;
            const bg = this.game.add.graphics(0,0); bg.lineStyle(4, 0xffffff, 0.3); bg.beginFill(0x111111); bg.drawRect(-180, -250, 360, 500); group.add(bg);
            const ship = this.game.add.graphics(0, -80); ship.beginFill(t.color); ship.moveTo(0, -40); ship.lineTo(35, 40); ship.lineTo(-35, 40); ship.close(); ship.endFill(); group.add(ship);
            const name = this.game.add.text(0, 50, t.name, { font: 'bold 36px Arial', fill: '#ffffff' }); name.anchor.setTo(0.5); group.add(name);
            group.setShipHighlight = (hl) => { bg.clear(); bg.lineStyle(6, hl ? 0xffff00 : 0xffffff); bg.beginFill(hl ? 0x222222 : 0x111111); bg.drawRect(-180, -250, 360, 500); };
            items.push(group);
        });
        this.cursorManager = new CursorManager(this.game);
        this.cursorManager.setItems(items, (index) => { this.game.selectedShip = SHIP_TYPES[index]; this.game.state.start('Play'); });
        this.game.input.keyboard.addCallbacks(this, (e) => {
            if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.UP) this.cursorManager.movePrev();
            if (e.keyCode === KEYS.RIGHT || e.keyCode === KEYS.DOWN) this.cursorManager.moveNext();
            if (e.keyCode === KEYS.ENTER) this.cursorManager.select();
        });
    },
    shutdown: function() { this.game.input.keyboard.onDownCallback = null; }
};

const PlayState = {
    create: function() {
        this.score = 0; this.level = 1; this.lives = 3; this.gameOver = false;
        this.shipConfig = this.game.selectedShip || SHIP_TYPES[0];
        this.currentWeapon = WEAPON_TYPES.NORMAL;
        this.powerTimer = 0;

        this.stars = [];
        for (let i = 0; i < 150; i++) {
            const s = this.game.add.graphics(Math.random() * 1920, Math.random() * 1080);
            s.beginFill(0xffffff, Math.random()).drawCircle(0, 0, Math.random() * 3); s.speed = 4 + Math.random() * 6;
            this.stars.push(s);
        }

        this.player = this.game.add.graphics(960, 900);
        this.player.beginFill(this.shipConfig.color).moveTo(0, -40).lineTo(35, 40).lineTo(-35, 40).close();
        this.player.speed = this.shipConfig.speed;

        this.enemies = this.game.add.group();
        this.enemyBullets = this.game.add.group();
        this.bullets = this.game.add.group();
        this.items = this.game.add.group();

        this.scoreText = this.game.add.text(SAFE_LEFT + 20, SAFE_TOP + 20, 'SCORE: 0', { font: '36px Arial', fill: '#00ffff' });
        this.weaponText = this.game.add.text(SAFE_LEFT + 20, SAFE_TOP + 70, 'WEAPON: PLASMA', { font: '24px Arial', fill: '#ffffff' });
        this.livesText = this.game.add.text(SAFE_RIGHT - 20, SAFE_TOP + 20, 'LIVES: 3', { font: '36px Arial', fill: '#ff6666' }); this.livesText.anchor.setTo(1, 0);

        this.keys = { left: false, right: false, up: false, down: false, fire: false };
        this.game.input.keyboard.addCallbacks(this, (e) => {
            if (e.keyCode === KEYS.LEFT) this.keys.left = true;
            if (e.keyCode === KEYS.RIGHT) this.keys.right = true;
            if (e.keyCode === KEYS.UP) this.keys.up = true;
            if (e.keyCode === KEYS.DOWN) this.keys.down = true;
            if (e.keyCode === KEYS.ENTER) this.keys.fire = true;
        }, (e) => {
            if (e.keyCode === KEYS.LEFT) this.keys.left = false;
            if (e.keyCode === KEYS.RIGHT) this.keys.right = false;
            if (e.keyCode === KEYS.UP) this.keys.up = false;
            if (e.keyCode === KEYS.DOWN) this.keys.down = false;
            if (e.keyCode === KEYS.ENTER) this.keys.fire = false;
        });

        this.spawnTimer = this.game.time.events.loop(1000, this.spawnEnemy, this);
        this.lastFire = 0;
    },

    update: function() {
        if (this.gameOver) return;

        this.stars.forEach(s => { s.y += s.speed; if (s.y > 1080) s.y = -10; });

        if (this.keys.left && this.player.x > SAFE_LEFT) this.player.x -= this.player.speed;
        if (this.keys.right && this.player.x < SAFE_RIGHT) this.player.x += this.player.speed;
        if (this.keys.up && this.player.y > SAFE_TOP + 200) this.player.y -= this.player.speed * 0.8;
        if (this.keys.down && this.player.y < SAFE_BOTTOM) this.player.y += this.player.speed * 0.8;

        if (this.keys.fire) this.fire();

        if (this.powerTimer > 0) {
            this.powerTimer -= this.game.time.elapsed;
            if (this.powerTimer <= 0) {
                this.currentWeapon = WEAPON_TYPES.NORMAL;
                this.weaponText.setText('WEAPON: PLASMA');
                this.weaponText.fill = '#ffffff';
            }
        }

        this.bullets.forEachAlive(b => { 
            b.x += b.vx || 0; b.y -= b.vy || 15;
            if (b.y < -50 || b.x < 0 || b.x > 1920) b.destroy(); 
        });
        this.enemyBullets.forEachAlive(b => { 
            b.y += 10 + (this.level); if (b.y > 1100) b.destroy(); 
        });
        this.enemies.forEachAlive(e => {
            e.y += e.speed;
            if (e.y > 1100) e.destroy();
            if (Math.random() < 0.01 + (this.level * 0.005)) this.enemyFire(e);
        });
        this.items.forEachAlive(i => { i.y += 4; if (i.y > 1100) i.destroy(); });

        this.checkCollisions();
    },

    fire: function() {
        const rate = this.currentWeapon.fireRate * this.shipConfig.fireRateMult;
        if (this.game.time.now - this.lastFire < rate) return;
        this.lastFire = this.game.time.now;

        for (let i = 0; i < this.currentWeapon.count; i++) {
            const b = this.game.add.graphics(this.player.x, this.player.y - 40);
            b.beginFill(this.currentWeapon.color).drawRect(-4, -20, 8, 40);
            if (this.currentWeapon.spread > 0) {
                const angle = (i - (this.currentWeapon.count - 1) / 2) * this.currentWeapon.spread;
                b.vx = Math.sin(angle) * this.currentWeapon.speed;
                b.vy = Math.cos(angle) * this.currentWeapon.speed;
            } else {
                b.vy = this.currentWeapon.speed;
            }
            this.bullets.add(b);
        }
        this.game.soundEngine.playLaser(this.currentWeapon.name);
    },

    spawnEnemy: function() {
        if(this.gameOver) return;
        const e = this.game.add.graphics(SAFE_LEFT + Math.random() * SAFE_WIDTH, -50);
        e.beginFill(0xff3333).moveTo(0, -30).lineTo(30, 0).lineTo(0, 30).lineTo(-30, 0).close();
        e.speed = (5 + Math.random() * 5) * (1 + (this.level - 1) * 0.2);
        this.enemies.add(e);
    },

    enemyFire: function(e) {
        if(!e.alive) return;
        const b = this.game.add.graphics(e.x, e.y + 30);
        b.beginFill(0xffaa00).drawCircle(0, 0, 12);
        this.enemyBullets.add(b);
    },

    dropItem: function(x, y) {
        if (Math.random() > 0.2) return;
        const types = Object.keys(WEAPON_TYPES).filter(k => k !== 'NORMAL');
        const type = types[Math.floor(Math.random() * types.length)];
        const item = this.game.add.graphics(x, y);
        item.beginFill(WEAPON_TYPES[type].color).drawRect(-20, -20, 40, 40);
        item.weaponType = WEAPON_TYPES[type];
        this.items.add(item);
    },

    checkCollisions: function() {
        this.bullets.forEachAlive(b => {
            this.enemies.forEachAlive(e => {
                if (Phaser.Math.distance(b.x, b.y, e.x, e.y) < 40) {
                    b.destroy(); this.killEnemy(e);
                }
            });
        });
        this.items.forEachAlive(i => {
            if (Phaser.Math.distance(i.x, i.y, this.player.x, this.player.y) < 50) {
                this.currentWeapon = i.weaponType;
                this.powerTimer = 8000;
                this.weaponText.setText('WEAPON: ' + i.weaponType.name);
                this.weaponText.fill = '#ffff00';
                this.game.soundEngine.playPowerUp();
                i.destroy();
            }
        });
        this.enemyBullets.forEachAlive(b => {
            if (Phaser.Math.distance(b.x, b.y, this.player.x, this.player.y) < 30) {
                b.destroy(); this.hitPlayer();
            }
        });
        this.enemies.forEachAlive(e => {
            if (Phaser.Math.distance(e.x, e.y, this.player.x, this.player.y) < 50) {
                this.killEnemy(e); this.hitPlayer();
            }
        });
    },

    killEnemy: function(e) {
        this.game.soundEngine.playExplosion();
        this.dropItem(e.x, e.y);
        e.destroy();
        this.score += 100; this.scoreText.setText('SCORE: ' + this.score);
        if (Math.floor(this.score / 1500) + 1 > this.level) this.levelUp();
    },

    levelUp: function() {
        this.level++;
        this.spawnTimer.delay = Math.max(300, 1000 - (this.level * 100));
        const t = this.game.add.text(960, 540, 'LEVEL UP!', { font: 'bold 80px Arial', fill: '#ffff00' }); t.anchor.setTo(0.5);
        this.game.time.events.add(1000, () => { if(t && t.alive) t.destroy(); });
    },

    hitPlayer: function() {
        this.lives--; this.livesText.setText('LIVES: ' + this.lives);
        if (this.player && this.player.alive) {
            this.player.tint = 0xff0000; 
            this.game.time.events.add(150, () => { if(this.player && this.player.alive) this.player.tint = 0xffffff; });
        }
        if (this.lives <= 0) { 
            this.gameOver = true; 
            this.game.global = { finalScore: this.score }; 
            this.game.state.start('GameOver'); 
        }
    },

    shutdown: function() { this.game.input.keyboard.onDownCallback = null; this.game.input.keyboard.onUpCallback = null; }
};

const GameOverState = {
    create: function() {
        this.game.add.graphics(0,0).beginFill(0x1a0a0a).drawRect(0,0,1920,1080);
        const t = this.game.add.text(960, 400, 'MISSION FAILED', { font: 'bold 80px Arial', fill: '#ff4444' }); t.anchor.setTo(0.5);
        const s = this.game.add.text(960, 500, 'FINAL SCORE: ' + (this.game.global ? this.game.global.finalScore : 0), { font: '40px Arial', fill: '#ffffff' }); s.anchor.setTo(0.5);
        const r = this.game.add.text(960, 650, 'RETRY', { font: '40px Arial', fill: '#ffffff' }); r.anchor.setTo(0.5);
        this.cm = new CursorManager(this.game); this.cm.setItems([r], () => this.game.state.start('ShipSelect'));
        this.game.input.keyboard.addCallbacks(this, (e) => { if (e.keyCode === KEYS.ENTER) this.cm.select(); });
    },
    shutdown: function() { this.game.input.keyboard.onDownCallback = null; }
};

const game = new Phaser.Game(1920, 1080, Phaser.AUTO, 'game-container');
game.state.add('Boot', BootState); game.state.add('Menu', MenuState); game.state.add('ShipSelect', ShipSelectState); game.state.add('Play', PlayState); game.state.add('GameOver', GameOverState);
game.state.start('Boot');
