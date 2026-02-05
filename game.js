/**
 * Space Blaster 4.0 - Orchestrated by Atlas (Opus Thinking)
 * A clean, robust implementation optimized for Mobile and TV.
 */

// --- Constants & Config ---
const CONFIG = {
    SCREEN: { width: 1920, height: 1080 },
    SAFE_ZONE: { top: 54, bottom: 1026, left: 96, right: 1824 },
    KEYS: { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13 },
    WEAPONS: {
        PLASMA: { name: 'PLASMA', rate: 200, speed: 1000, color: 0x00ffff, spread: 0, count: 1 },
        SPREAD: { name: 'SPREAD', rate: 300, speed: 800, color: 0xff00ff, spread: 0.3, count: 3 },
        BEAM:   { name: 'BEAM',   rate: 80,  speed: 1500, color: 0xffff00, spread: 0, count: 1 },
        WAVE:   { name: 'WAVE',   rate: 250, speed: 600,  color: 0x00ff00, spread: 0.5, count: 5 }
    },
    SHIPS: [
        { id: 0, name: 'STRIKER',  color: 0x00ff00, speed: 600, fireMult: 1.0 },
        { id: 1, name: 'SENTINEL', color: 0x3366ff, speed: 400, fireMult: 0.7 },
        { id: 2, name: 'VANGUARD', color: 0xffcc00, speed: 800, fireMult: 1.3 }
    ]
};

// --- Sound Engine (Web Audio) ---
class GameAudio {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.isMusicPlaying = false;
    }
    init() {
        if (this.ctx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.2;
            this.master.connect(this.ctx.destination);
        } catch(e) { console.warn("Audio Context init failed."); }
    }
    resume() { 
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
    playSfx(type) {
        this.resume();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        
        if (type === 'laser') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
            g.gain.setValueAtTime(0.1, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.start(); osc.stop(this.ctx.currentTime + 0.1);
        } else if (type === 'explosion') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.2);
            g.gain.setValueAtTime(0.2, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
            osc.start(); osc.stop(this.ctx.currentTime + 0.2);
        }
    }
    startMusic() {
        if (this.isMusicPlaying || !this.ctx) return;
        this.isMusicPlaying = true;
        this.playPulse();
    }
    playPulse() {
        if (!this.isMusicPlaying) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(50, this.ctx.currentTime);
        o.connect(g); g.connect(this.master);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        o.start(); o.stop(this.ctx.currentTime + 0.2);
        setTimeout(() => this.playPulse(), 400);
    }
}

const audio = new GameAudio();

// --- States ---
const Boot = {
    preload: function() {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
    },
    create: function() { this.state.start('Menu'); }
};

const Menu = {
    create: function() {
        this.add.graphics().beginFill(0x050510).drawRect(0, 0, 1920, 1080);
        const txt = this.add.text(960, 540, 'SPACE BLASTER 4.0\n\nPRESS FIRE TO START', { font: 'bold 64px Arial', fill: '#00ffff', align: 'center' });
        txt.anchor.set(0.5);
        
        this.input.keyboard.addCallbacks(this, (e) => {
            if (e.keyCode === CONFIG.KEYS.ENTER) {
                audio.resume();
                audio.startMusic();
                this.state.start('ShipSelect');
            }
        });
    },
    shutdown: function() { this.input.keyboard.onDownCallback = null; }
};

const ShipSelect = {
    create: function() {
        this.add.graphics().beginFill(0x050510).drawRect(0, 0, 1920, 1080);
        this.add.text(960, 150, 'SELECT YOUR SHIP', { font: '48px Arial', fill: '#ffffff' }).anchor.set(0.5);
        
        this.index = 0;
        this.containers = [];
        
        CONFIG.SHIPS.forEach((s, i) => {
            const c = this.add.group();
            c.x = 450 + (i * 500); c.y = 540;
            const bg = this.add.graphics().lineStyle(4, 0x444444).beginFill(0x111111).drawRect(-150, -200, 300, 400);
            const ship = this.add.graphics().beginFill(s.color).moveTo(0, -50).lineTo(40, 50).lineTo(-40, 50).lineTo(0, -50);
            this.add.text(0, 100, s.name, { font: '32px Arial', fill: '#ffffff' }, c).anchor.set(0.5);
            c.add(bg); c.add(ship);
            this.containers.push({ group: c, bg: bg });
        });
        
        this.updateHighlight();
        
        this.input.keyboard.addCallbacks(this, (e) => {
            if (e.keyCode === CONFIG.KEYS.LEFT) { this.index = (this.index - 1 + 3) % 3; this.updateHighlight(); }
            if (e.keyCode === CONFIG.KEYS.RIGHT) { this.index = (this.index + 1) % 3; this.updateHighlight(); }
            if (e.keyCode === CONFIG.KEYS.ENTER) {
                this.game.selectedShip = CONFIG.SHIPS[this.index];
                this.state.start('Play');
            }
        });
    },
    updateHighlight: function() {
        this.containers.forEach((c, i) => {
            c.bg.clear();
            const active = i === this.index;
            c.bg.lineStyle(6, active ? 0xffff00 : 0x444444).beginFill(active ? 0x222222 : 0x111111).drawRect(-150, -200, 300, 400);
        });
    },
    shutdown: function() { this.input.keyboard.onDownCallback = null; }
};

const Play = {
    create: function() {
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.shipData = this.game.selectedShip || CONFIG.SHIPS[0];
        
        // Groups
        this.player = this.add.graphics(960, 900);
        this.player.beginFill(this.shipData.color).moveTo(0, -30).lineTo(30, 30).lineTo(-30, 30).lineTo(0, -30);
        this.physics.arcade.enable(this.player);
        
        this.bullets = this.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(30, 'bullet'); // Placeholder, we redraw
        
        this.enemies = this.add.group();
        this.enemies.enableBody = true;
        
        this.powerups = this.add.group();
        this.powerups.enableBody = true;

        // UI
        this.score = 0;
        this.scoreText = this.add.text(CONFIG.SAFE_ZONE.left, CONFIG.SAFE_ZONE.top, 'SCORE: 0', { font: '32px Arial', fill: '#00ffff' });
        this.weapon = CONFIG.WEAPONS.PLASMA;
        this.nextFire = 0;
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(CONFIG.KEYS.ENTER);
        
        // Loop
        this.spawnTimer = this.time.events.loop(1200, this.spawnEnemy, this);
    },
    update: function() {
        this.player.body.velocity.set(0);
        const speed = this.shipData.speed;
        
        if (this.cursors.left.isDown && this.player.x > CONFIG.SAFE_ZONE.left) this.player.body.velocity.x = -speed;
        if (this.cursors.right.isDown && this.player.x < CONFIG.SAFE_ZONE.right) this.player.body.velocity.x = speed;
        if (this.cursors.up.isDown && this.player.y > CONFIG.SAFE_ZONE.top + 300) this.player.body.velocity.y = -speed;
        if (this.cursors.down.isDown && this.player.y < CONFIG.SAFE_ZONE.bottom) this.player.body.velocity.y = speed;
        
        if (this.fireKey.isDown) this.fire();
        
        this.physics.arcade.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.arcade.overlap(this.player, this.enemies, this.playerHit, null, this);
        this.physics.arcade.overlap(this.player, this.powerups, this.getPowerup, null, this);
        
        // Cleanup
        this.enemies.forEachAlive(e => { if (e.y > 1100) e.kill(); });
        this.bullets.forEachAlive(b => { if (b.y < -50 || b.y > 1100 || b.x < 0 || b.x > 1920) b.kill(); });
    },
    spawnEnemy: function() {
        const e = this.enemies.getFirstExists(false);
        const x = CONFIG.SAFE_ZONE.left + Math.random() * (CONFIG.SAFE_ZONE.right - CONFIG.SAFE_ZONE.left);
        if (!e) {
            const newE = this.add.graphics(0, 0);
            newE.beginFill(0xff3333).drawRect(-25, -25, 50, 50);
            const sprite = this.add.sprite(x, -50);
            sprite.addChild(newE);
            this.physics.arcade.enable(sprite);
            this.enemies.add(sprite);
            sprite.body.velocity.y = 300;
        } else {
            e.reset(x, -50);
            e.body.velocity.y = 300;
        }
    },
    fire: function() {
        if (this.time.now < this.nextFire) return;
        this.nextFire = this.time.now + (this.weapon.rate * this.shipData.fireMult);
        
        for (let i = 0; i < this.weapon.count; i++) {
            const b = this.bullets.getFirstExists(false);
            const angle = (i - (this.weapon.count - 1) / 2) * this.weapon.spread;
            if (!b) {
                const g = this.add.graphics(0,0).beginFill(this.weapon.color).drawRect(-4, -20, 8, 40);
                const s = this.add.sprite(this.player.x, this.player.y - 40);
                s.addChild(g); this.physics.arcade.enable(s);
                this.bullets.add(s);
                s.body.velocity.x = Math.sin(angle) * this.weapon.speed;
                s.body.velocity.y = -Math.cos(angle) * this.weapon.speed;
            } else {
                b.reset(this.player.x, this.player.y - 40);
                b.body.velocity.x = Math.sin(angle) * this.weapon.speed;
                b.body.velocity.y = -Math.cos(angle) * this.weapon.speed;
            }
        }
        audio.playSfx('laser');
    },
    hitEnemy: function(bullet, enemy) {
        bullet.kill(); enemy.kill();
        audio.playSfx('explosion');
        this.score += 100;
        this.scoreText.text = 'SCORE: ' + this.score;
        if (Math.random() > 0.8) this.spawnPowerup(enemy.x, enemy.y);
    },
    spawnPowerup: function(x, y) {
        const p = this.add.sprite(x, y);
        const types = Object.keys(CONFIG.WEAPONS);
        const type = CONFIG.WEAPONS[types[Math.floor(Math.random() * types.length)]];
        const g = this.add.graphics(0,0).beginFill(type.color).drawCircle(0, 0, 30);
        p.addChild(g); p.weaponData = type;
        this.physics.arcade.enable(p);
        this.powerups.add(p);
        p.body.velocity.y = 150;
    },
    getPowerup: function(player, powerup) {
        this.weapon = powerup.weaponData;
        powerup.kill();
    },
    playerHit: function() { this.state.start('Menu'); }
};

const game = new Phaser.Game(1920, 1080, Phaser.AUTO, 'game-container');
game.state.add('Boot', Boot);
game.state.add('Menu', Menu);
game.state.add('ShipSelect', ShipSelect);
game.state.add('Play', Play);
game.state.start('Boot');
