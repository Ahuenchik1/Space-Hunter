class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isGameRunning = false;
        this.player = {
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            baseSpeed: 35,
            speed: 35,
            targetX: 0
        };
        this.asteroids = [];
        this.lastTime = 0;
        this.asteroidInterval = 500;
        this.lastAsteroid = 0;
        this.baseAsteroidSpeed = 4;
        this.difficultyLevel = 1;
        this.multiAsteroidChance = 0;
        this.minSafePathWidth = 60;
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false
        };
        
        this.init();
        this.setupEventListeners();
        this.initSpaceBackground();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.targetX = this.player.x;
        this.player.y = this.canvas.height - this.player.height - 20;
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = window.innerHeight * 0.7;
    }

    initSpaceBackground() {
        // Создаем галактики
        const galaxies = document.querySelector('.galaxies');
        for (let i = 0; i < 8; i++) {
            const galaxy = document.createElement('div');
            galaxy.className = 'galaxy';
            galaxy.style.left = Math.random() * 100 + '%';
            galaxy.style.top = Math.random() * 100 + '%';
            galaxy.style.animationDelay = Math.random() * 8 + 's';
            // Случайный размер для разнообразия
            const size = 150 + Math.random() * 50;
            galaxy.style.width = size + 'px';
            galaxy.style.height = size + 'px';
            galaxies.appendChild(galaxy);
        }
    }

    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startGame());
        
        
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isGameRunning) {
                this.startGame();
            }
            if (!this.isGameRunning) return;
            if (e.key in this.keys) {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key in this.keys) {
                this.keys[e.key] = false;
            }
        });

        const touchArea = document.getElementById('touchArea');
        
        touchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isGameRunning) return;
            const touch = e.touches[0];
            const rect = touchArea.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            this.player.targetX = (x / rect.width) * this.canvas.width - this.player.width / 2;
        });

        touchArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isGameRunning) return;
            const touch = e.touches[0];
            const rect = touchArea.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            this.player.targetX = (x / rect.width) * this.canvas.width - this.player.width / 2;
        });
    }

    updatePlayer() {
        
        if (this.keys.ArrowLeft) {
            this.player.targetX = this.player.x - this.player.speed;
        }
        if (this.keys.ArrowRight) {
            this.player.targetX = this.player.x + this.player.speed;
        }

        
        const smoothingFactor = Math.min(0.4, 0.2 + (this.difficultyLevel - 1) * 0.02);
        const dx = this.player.targetX - this.player.x;
        this.player.x += dx * smoothingFactor;

        
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.targetX = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.targetX));
    }

    updateDifficulty() {
        const newLevel = Math.floor(this.score / 10) + 1;
        if (newLevel !== this.difficultyLevel) {
            this.difficultyLevel = newLevel;
            this.asteroidInterval = Math.max(300, 500 - (this.difficultyLevel - 1) * 20);
            this.multiAsteroidChance = 0;
            this.player.speed = Math.max(15, this.player.baseSpeed - (this.difficultyLevel - 1) * 2);
        }
    }

    startGame() {
        this.isGameRunning = true;
        this.score = 0;
        this.asteroids = [];
        this.player.targetX = this.player.x;
        this.difficultyLevel = 1;
        this.asteroidInterval = 500;
        this.multiAsteroidChance = 0;
        this.player.speed = this.player.baseSpeed;
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('startButton').style.display = 'none';
        this.gameLoop();
    }

    createAsteroid(xPosition = null) {
        const size = Math.random() * 20 + 20;
        const speedMultiplier = 1 + (this.difficultyLevel - 1) * 0.07;
        const speed = (Math.random() * 1 + this.baseAsteroidSpeed) * speedMultiplier;
        
        const angle = this.difficultyLevel > 3 ? (Math.random() - 0.5) * 0.15 : 0;
        
        return {
            x: xPosition !== null ? xPosition : Math.random() * (this.canvas.width - size),
            y: -size,
            size: size,
            speed: speed,
            angle: angle,
            rotationSpeed: this.difficultyLevel > 5 ? (Math.random() - 0.5) * 0.08 : 0
        };
    }

    findSafePath() {
        
        const dangerZone = this.canvas.height - this.player.height * 3;
        const nearAsteroids = this.asteroids.filter(a => a.y > dangerZone);
        
        if (nearAsteroids.length === 0) return true;

        
        const sortedAsteroids = nearAsteroids.sort((a, b) => a.x - b.x);
        
        
        let lastX = 0;
        for (const asteroid of sortedAsteroids) {
            if (asteroid.x - lastX >= this.minSafePathWidth) {
                return true; 
            }
            lastX = asteroid.x + asteroid.size;
        }
        
        
        return (this.canvas.width - lastX) >= this.minSafePathWidth;
    }

    spawnAsteroids() {
        if (!this.findSafePath()) {
            return;
        }

        const asteroid = this.createAsteroid();
        
        this.asteroids.push(asteroid);
        const hasSafePath = this.findSafePath();
        
        if (!hasSafePath) {
            this.asteroids.pop();
            return;
        }
    }

    updateAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.y += asteroid.speed;
            
            if (asteroid.angle) {
                asteroid.x += Math.sin(asteroid.y * 0.05) * asteroid.angle * asteroid.speed;
            }
            
            asteroid.x = Math.max(0, Math.min(this.canvas.width - asteroid.size, asteroid.x));

            if (this.checkCollision(asteroid)) {
                this.gameOver();
                return;
            }

            if (asteroid.y > this.canvas.height) {
                this.asteroids.splice(i, 1);
                this.score += 1;
                document.getElementById('scoreValue').textContent = this.score;
                this.updateDifficulty();
            }
        }

        
        if (!this.findSafePath() && this.asteroids.length > 0) {
            
            const dangerZone = this.canvas.height - this.player.height * 3;
            const nearAsteroids = this.asteroids.filter(a => a.y > dangerZone);
            if (nearAsteroids.length > 0) {
                const randomAsteroid = nearAsteroids[Math.floor(Math.random() * nearAsteroids.length)];
                const index = this.asteroids.indexOf(randomAsteroid);
                if (index > -1) {
                    this.asteroids.splice(index, 1);
                }
            }
        }
    }

    checkCollision(asteroid) {
        return (
            this.player.x < asteroid.x + asteroid.size &&
            this.player.x + this.player.width > asteroid.x &&
            this.player.y < asteroid.y + asteroid.size &&
            this.player.y + this.player.height > asteroid.y
        );
    }

    gameOver() {
        this.isGameRunning = false;
        document.getElementById('startButton').style.display = 'block';
        document.getElementById('startButton').textContent = 'Повторить';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.fillStyle = `hsl(${360 * (this.difficultyLevel / 10)}, 100%, 50%)`;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.shadowBlur = 5;
            
            const centerX = asteroid.x + asteroid.size / 2;
            const centerY = asteroid.y + asteroid.size / 2;
            
            if (asteroid.rotationSpeed) {
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(asteroid.y * asteroid.rotationSpeed);
                this.ctx.translate(-centerX, -centerY);
            }
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, asteroid.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    gameLoop(currentTime) {
        if (!this.isGameRunning) return;

        if (!this.lastTime) this.lastTime = currentTime;
        const delta = currentTime - this.lastTime;

        if (currentTime - this.lastAsteroid > this.asteroidInterval) {
            this.spawnAsteroids();
            this.lastAsteroid = currentTime;
        }

        this.updatePlayer();
        this.updateAsteroids();
        this.draw();
        this.lastTime = currentTime;

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

window.addEventListener('load', () => {
    new Game();
}); 