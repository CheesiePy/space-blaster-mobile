/**
 * Space Blaster - Smart TV Game
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
// CURSOR MANAGER - Spatial Navigation for Menus
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

    disable() {
        this.enabled = false;
        this.items = [];
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

    select() {
        if (!this.enabled || this.items.length === 0) return;
        if (this.onSelect) {
            this.onSelect(this.currentIndex, this.items[this.currentIndex]);
        }
    }

    updateHighlight() {
        this.items.forEach((item, index) => {
            if (index === this.currentIndex) {
                item.setStyle({ fill: '#ffff00' }); // Yellow highlight
                item.alpha = 1;
            } else {
                item.setStyle({ fill: '#ffffff' }); // White normal
                item.alpha = 0.7;
            }
        });
    }
}

// ============================================
// BOOT STATE
// ============================================
const BootState = {
    create: function() {
        // Scale settings for Smart TV
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.pageAlignHorizontally = true;
        this.game.scale.pageAlignVertically = true;
        this.game.state.start('Menu');
    }
};

// ============================================
// MENU STATE
// ============================================
const MenuState = {
    create: function() {
        // Starfield background
        this.createStarfield();

        // Title (within safe zone)
        const title = this.game.add.text(
            960, SAFE_TOP + 150,
            'SPACE BLASTER',
            { font: '72px Arial', fill: '#00ffff', align: 'center' }
        );
        title.anchor.setTo(0.5);
        title.setShadow(4, 4, '#003366', 8);

        // Menu items
        const startText = this.game.add.text(
            960, 480,
            '▶ START GAME',
            { font: '48px Arial', fill: '#ffffff', align: 'center' }
        );
        startText.anchor.setTo(0.5);

        const howToText = this.game.add.text(
            960, 560,
            '? HOW TO PLAY',
            { font: '48px Arial', fill: '#ffffff', align: 'center' }
        );
        howToText.anchor.setTo(0.5);

        const exitText = this.game.add.text(
            960, 640,
            '✕ EXIT',
            { font: '48px Arial', fill: '#ffffff', align: 'center' }
        );
        exitText.anchor.setTo(0.5);

        // Instructions (within safe zone)
        const instructions = this.game.add.text(
            960, SAFE_BOTTOM - 80,
            'Use ↑↓ to navigate • ENTER to select',
            { font: '28px Arial', fill: '#aaaaaa', align: 'center' }
        );
        instructions.anchor.setTo(0.5);

        // Setup cursor manager
        this.cursorManager = new CursorManager(this.game);
        this.cursorManager.setItems(
            [startText, howToText, exitText],
            this.handleMenuSelect.bind(this)
        );

        // Keyboard input
        this.setupInput();
    },

    createStarfield: function() {
        const graphics = this.game.add.graphics(0, 0);
        graphics.beginFill(0x0a0a20);
        graphics.drawRect(0, 0, 1920, 1080);
        graphics.endFill();

        // Draw stars
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 1920;
            const y = Math.random() * 1080;
            const size = Math.random() * 2 + 1;
            const alpha = Math.random() * 0.5 + 0.5;
            graphics.beginFill(0xffffff, alpha);
            graphics.drawCircle(x, y, size);
            graphics.endFill();
        }
    },

    setupInput: function() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    handleKeyDown: function(e) {
        switch(e.keyCode) {
            case KEYS.UP:
                this.cursorManager.moveUp();
                e.preventDefault();
                break;
            case KEYS.DOWN:
                this.cursorManager.moveDown();
                e.preventDefault();
                break;
            case KEYS.ENTER:
                this.cursorManager.select();
                e.preventDefault();
                break;
            case KEYS.BACK_WEBOS:
            case KEYS.BACK_TIZEN:
                // Handle back button - could exit or do nothing on main menu
                e.preventDefault();
                break;
        }
    },

    handleMenuSelect: function(index) {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        switch(index) {
            case 0: // Start Game
                this.game.state.start('Play');
                break;
            case 1: // How to Play
                this.showHowToPlay();
                break;
            case 2: // Exit
                // On Smart TVs, this might close the app
                if (window.close) window.close();
                break;
        }
    },

    showHowToPlay: function() {
        // Simple overlay
        const overlay = this.game.add.graphics(0, 0);
        overlay.beginFill(0x000000, 0.9);
        overlay.drawRect(0, 0, 1920, 1080);
        overlay.endFill();

        const helpText = this.game.add.text(
            960, 400,
            'HOW TO PLAY\n\n' +
            '← → : Move ship left/right\n' +
            'ENTER : Fire laser\n' +
            'Destroy enemies to score points!\n' +
            'Avoid enemy fire!\n\n' +
            'Press ENTER to go back',
            { font: '36px Arial', fill: '#ffffff', align: 'center' }
        );
        helpText.anchor.setTo(0.5);

        const closeHelp = (e) => {
            if (e.keyCode === KEYS.ENTER || e.keyCode === KEYS.BACK_WEBOS || e.keyCode === KEYS.BACK_TIZEN) {
                overlay.destroy();
                helpText.destroy();
                document.removeEventListener('keydown', closeHelp);
            }
        };
        document.addEventListener('keydown', closeHelp);
    },

    shutdown: function() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
};

// ============================================
// PLAY STATE - Main Game
// ============================================
const PlayState = {
    create: function() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;

        // Background
        this.createBackground();

        // Create player ship (geometric shape)
        this.createPlayer();

        // Create enemy group
        this.enemies = this.game.add.group();
        this.enemyBullets = this.game.add.group();

        // Create bullet group
        this.bullets = this.game.add.group();

        // UI
        this.createUI();

        // Input
        this.setupInput();

        // Spawn enemies periodically
        this.enemyTimer = this.game.time.events.loop(1500, this.spawnEnemy, this);

        // Fire rate limiter
        this.lastFire = 0;
        this.fireRate = 200;
    },

    createBackground: function() {
        // Scrolling starfield effect
        const graphics = this.game.add.graphics(0, 0);
        graphics.beginFill(0x0a0a20);
        graphics.drawRect(0, 0, 1920, 1080);
        graphics.endFill();

        // Static stars
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            const star = this.game.add.graphics(0, 0);
            star.beginFill(0xffffff, Math.random() * 0.5 + 0.5);
            star.drawCircle(0, 0, Math.random() * 2 + 1);
            star.endFill();
            star.x = Math.random() * 1920;
            star.y = Math.random() * 1080;
            star.speed = Math.random() * 2 + 1;
            this.stars.push(star);
        }
    },

    createPlayer: function() {
        // Create player ship using graphics
        this.player = this.game.add.graphics(960, 900);
        this.player.beginFill(0x00ff00);
        // Triangle ship shape
        this.player.moveTo(0, -30);
        this.player.lineTo(25, 30);
        this.player.lineTo(-25, 30);
        this.player.lineTo(0, -30);
        this.player.endFill();
        // Engine glow
        this.player.beginFill(0x00ffff);
        this.player.drawRect(-10, 25, 20, 10);
        this.player.endFill();

        this.player.speed = 12;
        this.player.alive = true;
    },

    createUI: function() {
        // Score (top-left, within safe zone)
        this.scoreText = this.game.add.text(
            SAFE_LEFT + 20, SAFE_TOP + 20,
            'SCORE: 0',
            { font: '36px Arial', fill: '#00ffff' }
        );

        // Lives (top-right, within safe zone)
        this.livesText = this.game.add.text(
            SAFE_RIGHT - 20, SAFE_TOP + 20,
            'LIVES: 3',
            { font: '36px Arial', fill: '#ff6666' }
        );
        this.livesText.anchor.setTo(1, 0);
    },

    setupInput: function() {
        this.keys = {
            left: false,
            right: false,
            fire: false
        };

        this.keyDownHandler = this.handleKeyDown.bind(this);
        this.keyUpHandler = this.handleKeyUp.bind(this);

        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    },

    handleKeyDown: function(e) {
        if (this.gameOver) return;

        switch(e.keyCode) {
            case KEYS.LEFT:
                this.keys.left = true;
                e.preventDefault();
                break;
            case KEYS.RIGHT:
                this.keys.right = true;
                e.preventDefault();
                break;
            case KEYS.ENTER:
                this.keys.fire = true;
                e.preventDefault();
                break;
            case KEYS.BACK_WEBOS:
            case KEYS.BACK_TIZEN:
                this.game.state.start('Menu');
                e.preventDefault();
                break;
        }
    },

    handleKeyUp: function(e) {
        switch(e.keyCode) {
            case KEYS.LEFT:
                this.keys.left = false;
                break;
            case KEYS.RIGHT:
                this.keys.right = false;
                break;
            case KEYS.ENTER:
                this.keys.fire = false;
                break;
        }
    },

    update: function() {
        if (this.gameOver) return;

        // Update starfield
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > 1080) {
                star.y = 0;
                star.x = Math.random() * 1920;
            }
        });

        // Player movement (constrained to safe zone)
        if (this.keys.left && this.player.x > SAFE_LEFT + 30) {
            this.player.x -= this.player.speed;
        }
        if (this.keys.right && this.player.x < SAFE_RIGHT - 30) {
            this.player.x += this.player.speed;
        }

        // Firing
        if (this.keys.fire) {
            this.fireBullet();
        }

        // Update bullets
        this.bullets.forEach(bullet => {
            bullet.y -= 15;
            if (bullet.y < -20) bullet.destroy();
        });

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.y += enemy.speed;
            if (enemy.y > 1100) enemy.destroy();

            // Enemy shooting
            if (Math.random() < 0.005) {
                this.enemyFire(enemy);
            }
        });

        // Update enemy bullets
        this.enemyBullets.forEach(bullet => {
            bullet.y += 8;
            if (bullet.y > 1100) bullet.destroy();
        });

        // Collision detection
        this.checkCollisions();
    },

    fireBullet: function() {
        const now = this.game.time.now;
        if (now - this.lastFire < this.fireRate) return;
        this.lastFire = now;

        const bullet = this.game.add.graphics(this.player.x, this.player.y - 35);
        bullet.beginFill(0x00ffff);
        bullet.drawRect(-3, -10, 6, 20);
        bullet.endFill();
        this.bullets.add(bullet);
    },

    spawnEnemy: function() {
        if (this.gameOver) return;

        const x = SAFE_LEFT + Math.random() * SAFE_WIDTH;
        const enemy = this.game.add.graphics(x, -40);
        enemy.beginFill(0xff4444);
        // Diamond shape enemy
        enemy.moveTo(0, -25);
        enemy.lineTo(20, 0);
        enemy.lineTo(0, 25);
        enemy.lineTo(-20, 0);
        enemy.lineTo(0, -25);
        enemy.endFill();
        // Eye
        enemy.beginFill(0xffff00);
        enemy.drawCircle(0, 0, 8);
        enemy.endFill();

        enemy.speed = 3 + Math.random() * 3;
        enemy.width = 40;
        enemy.height = 50;
        this.enemies.add(enemy);
    },

    enemyFire: function(enemy) {
        const bullet = this.game.add.graphics(enemy.x, enemy.y + 30);
        bullet.beginFill(0xff6600);
        bullet.drawCircle(0, 0, 8);
        bullet.endFill();
        this.enemyBullets.add(bullet);
    },

    checkCollisions: function() {
        // Player bullets vs enemies
        this.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (this.hitTest(bullet, enemy, 30)) {
                    bullet.destroy();
                    this.destroyEnemy(enemy);
                }
            });
        });

        // Enemy bullets vs player
        this.enemyBullets.forEach(bullet => {
            if (this.hitTest(bullet, this.player, 25)) {
                bullet.destroy();
                this.playerHit();
            }
        });

        // Enemies vs player
        this.enemies.forEach(enemy => {
            if (this.hitTest(enemy, this.player, 35)) {
                this.destroyEnemy(enemy);
                this.playerHit();
            }
        });
    },

    hitTest: function(obj1, obj2, radius) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy) < radius;
    },

    destroyEnemy: function(enemy) {
        // Explosion effect
        const explosion = this.game.add.graphics(enemy.x, enemy.y);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            explosion.beginFill(0xff6600, 0.8);
            explosion.drawCircle(Math.cos(angle) * 15, Math.sin(angle) * 15, 5);
            explosion.endFill();
        }
        this.game.time.events.add(200, () => explosion.destroy());

        enemy.destroy();
        this.score += 100;
        this.scoreText.setText('SCORE: ' + this.score);
    },

    playerHit: function() {
        this.lives--;
        this.livesText.setText('LIVES: ' + this.lives);

        // Flash effect
        this.player.tint = 0xff0000;
        this.game.time.events.add(100, () => {
            if (this.player) this.player.tint = 0xffffff;
        });

        if (this.lives <= 0) {
            this.endGame();
        }
    },

    endGame: function() {
        this.gameOver = true;
        this.game.time.events.remove(this.enemyTimer);

        // Store score for game over screen
        this.game.global = this.game.global || {};
        this.game.global.finalScore = this.score;

        this.game.time.events.add(1000, () => {
            this.game.state.start('GameOver');
        });
    },

    shutdown: function() {
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
    }
};

// ============================================
// GAME OVER STATE
// ============================================
const GameOverState = {
    create: function() {
        // Background
        const graphics = this.game.add.graphics(0, 0);
        graphics.beginFill(0x1a0a0a);
        graphics.drawRect(0, 0, 1920, 1080);
        graphics.endFill();

        // Game Over text
        const gameOverText = this.game.add.text(
            960, 300,
            'GAME OVER',
            { font: 'bold 96px Arial', fill: '#ff4444', align: 'center' }
        );
        gameOverText.anchor.setTo(0.5);
        gameOverText.setShadow(6, 6, '#660000', 10);

        // Score
        const score = this.game.global ? this.game.global.finalScore : 0;
        const scoreText = this.game.add.text(
            960, 450,
            'FINAL SCORE: ' + score,
            { font: '48px Arial', fill: '#ffffff', align: 'center' }
        );
        scoreText.anchor.setTo(0.5);

        // Menu options
        const playAgainText = this.game.add.text(
            960, 600,
            '▶ PLAY AGAIN',
            { font: '42px Arial', fill: '#ffffff', align: 'center' }
        );
        playAgainText.anchor.setTo(0.5);

        const menuText = this.game.add.text(
            960, 680,
            '◀ MAIN MENU',
            { font: '42px Arial', fill: '#ffffff', align: 'center' }
        );
        menuText.anchor.setTo(0.5);

        // Cursor manager
        this.cursorManager = new CursorManager(this.game);
        this.cursorManager.setItems(
            [playAgainText, menuText],
            this.handleSelect.bind(this)
        );

        // Input
        this.keyHandler = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.keyHandler);
    },

    handleKeyDown: function(e) {
        switch(e.keyCode) {
            case KEYS.UP:
                this.cursorManager.moveUp();
                e.preventDefault();
                break;
            case KEYS.DOWN:
                this.cursorManager.moveDown();
                e.preventDefault();
                break;
            case KEYS.ENTER:
                this.cursorManager.select();
                e.preventDefault();
                break;
            case KEYS.BACK_WEBOS:
            case KEYS.BACK_TIZEN:
                this.game.state.start('Menu');
                e.preventDefault();
                break;
        }
    },

    handleSelect: function(index) {
        if (index === 0) {
            this.game.state.start('Play');
        } else {
            this.game.state.start('Menu');
        }
    },

    shutdown: function() {
        document.removeEventListener('keydown', this.keyHandler);
    }
};

// ============================================
// GAME INITIALIZATION
// ============================================
const game = new Phaser.Game(1920, 1080, Phaser.AUTO, 'game-container');

game.state.add('Boot', BootState);
game.state.add('Menu', MenuState);
game.state.add('Play', PlayState);
game.state.add('GameOver', GameOverState);

game.state.start('Boot');
