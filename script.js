// Variables del Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ==================== CLASE DINOSAURIO ====================
class Dinosaurio {
    constructor() {
        this.x = 50;
        this.y = 0;
        this.width = 40;
        this.height = 60;
        this.velocityY = 0;
        this.jumping = false;
        this.ducking = false;
        this.jumpPower = 15;
        this.gravity = 0.6;
    }

    update() {
        // Aplicar gravedad
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Límite del suelo
        const groundLevel = canvas.height - 100;
        if (this.y >= groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.jumping = false;
        }
    }

    jump() {
        if (!this.jumping && !this.ducking) {
            this.velocityY = -this.jumpPower;
            this.jumping = true;
        }
    }

    duck() {
        this.ducking = true;
    }

    standUp() {
        this.ducking = false;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = '#2D3E50';

        if (this.ducking) {
            // Dinosaurio agachado
            ctx.fillRect(this.x, this.y + 40, 50, 35);
            // Cabeza agachada
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 35, 12, 0, Math.PI * 2);
            ctx.fill();
            // Ojos agachado
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 32, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Cuerpo
            ctx.fillRect(this.x, this.y + 20, 40, 40);
            // Cabeza
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 15, 12, 0, Math.PI * 2);
            ctx.fill();
            // Cuernos
            ctx.fillRect(this.x + 5, this.y, 4, 15);
            ctx.fillRect(this.x + 13, this.y + 2, 4, 13);
            // Ojos
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + 6, this.y + 12, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x + 6, this.y + 12, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Patas
            ctx.fillStyle = '#2D3E50';
            ctx.fillRect(this.x + 5, this.y + 58, 8, 25);
            ctx.fillRect(this.x + 25, this.y + 58, 8, 25);
        }

        ctx.restore();
    }

    getCollisionBox() {
        if (this.ducking) {
            return {
                x: this.x,
                y: this.y + 40,
                width: 50,
                height: 35
            };
        }
        return {
            x: this.x,
            y: this.y,
            width: 40,
            height: 83
        };
    }
}

// ==================== CLASE OBSTÁCULO ====================
class Obstaculo {
    constructor(type = 'cactus') {
        this.x = canvas.width;
        this.type = type;
        
        if (type === 'cactus') {
            this.width = 30;
            this.height = 60;
            this.y = canvas.height - 100;
        } else if (type === 'pajaro') {
            this.width = 45;
            this.height = 30;
            this.y = canvas.height - 150;
            this.wingFrame = 0;
        }
    }

    update(speed) {
        this.x -= speed;
        if (this.type === 'pajaro') {
            this.wingFrame += 0.1;
        }
    }

    draw() {
        ctx.save();

        if (this.type === 'cactus') {
            ctx.fillStyle = '#27AE60';
            // Tallo principal
            ctx.fillRect(this.x + 10, this.y, 10, 60);
            // Púas
            ctx.fillRect(this.x, this.y + 15, 8, 12);
            ctx.fillRect(this.x + 32, this.y + 15, 8, 12);
            ctx.fillRect(this.x, this.y + 35, 8, 12);
            ctx.fillRect(this.x + 32, this.y + 35, 8, 12);
        } else if (this.type === 'pajaro') {
            ctx.fillStyle = '#E74C3C';
            // Cuerpo
            ctx.beginPath();
            ctx.ellipse(this.x + 15, this.y + 10, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Cabeza
            ctx.beginPath();
            ctx.arc(this.x + 28, this.y + 8, 7, 0, Math.PI * 2);
            ctx.fill();
            // Ojos
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + 32, this.y + 6, 2, 0, Math.PI * 2);
            ctx.fill();
            // Alas
            ctx.fillStyle = '#E74C3C';
            const wingOffset = Math.sin(this.wingFrame) * 5;
            ctx.beginPath();
            ctx.ellipse(this.x + 12, this.y + 10, 8 + wingOffset, 5, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + 18, this.y + 10, 8 + wingOffset, 5, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getCollisionBox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    isOutOfScreen() {
        return this.x + this.width < 0;
    }
}

// ==================== CLASE JUEGO ====================
class Juego {
    constructor() {
        this.dinosaurio = new Dinosaurio();
        this.obstaculos = [];
        this.score = 0;
        this.highScore = localStorage.getItem('dino_highscore') || 0;
        this.level = 1;
        this.gameOver = false;
        this.gameStarted = false;
        this.spawnRate = 120;
        this.spawnCounter = 0;
        this.speed = 5;
        this.maxSpeed = 12;
        this.particulas = [];

        this.updateUI();
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (!this.gameStarted) {
                    this.gameStarted = true;
                    this.gameOver = false;
                    this.gameLoop();
                } else if (this.gameOver) {
                    this.restart();
                } else {
                    this.dinosaurio.jump();
                }
            }
            if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.dinosaurio.duck();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                this.dinosaurio.standUp();
            }
        });

        // Touch para móviles
        document.addEventListener('touchstart', () => {
            if (!this.gameStarted) {
                this.gameStarted = true;
                this.gameOver = false;
                this.gameLoop();
            } else if (this.gameOver) {
                this.restart();
            } else {
                this.dinosaurio.jump();
            }
        });
    }

    spawnObstaculo() {
        const random = Math.random();
        const obstaculo = new Obstaculo(random > 0.7 ? 'pajaro' : 'cactus');
        this.obstaculos.push(obstaculo);
    }

    checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }

    update() {
        if (this.gameOver) return;

        this.dinosaurio.update();

        // Generar obstáculos
        this.spawnCounter++;
        if (this.spawnCounter > this.spawnRate) {
            this.spawnObstaculo();
            this.spawnCounter = 0;
            // Aumentar dificultad
            if (this.spawnRate > 60) {
                this.spawnRate -= 2;
            }
        }

        // Actualizar obstáculos
        for (let i = this.obstaculos.length - 1; i >= 0; i--) {
            this.obstaculos[i].update(this.speed);

            // Colisión
            if (this.checkCollision(
                this.dinosaurio.getCollisionBox(),
                this.obstaculos[i].getCollisionBox()
            )) {
                this.gameOver = true;
                this.updateUI();
                return;
            }

            // Eliminar obstáculos fuera de pantalla
            if (this.obstaculos[i].isOutOfScreen()) {
                this.obstaculos.splice(i, 1);
                this.score += 10;
                this.updateUI();
            }
        }

        // Aumentar velocidad gradualmente
        if (this.speed < this.maxSpeed) {
            this.speed += 0.001;
        }

        // Actualizar nivel
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel !== this.level) {
            this.level = newLevel;
            this.maxSpeed = 5 + this.level * 1.5;
            this.updateUI();
        }
    }

    draw() {
        // Fondo degradado
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Línea del suelo
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 80);
        ctx.lineTo(canvas.width, canvas.height - 80);
        ctx.stroke();

        // Hierba
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

        // Nubes decorativas
        this.drawClouds();

        // Dinosaurio
        this.dinosaurio.draw();

        // Obstáculos
        for (let obstaculo of this.obstaculos) {
            obstaculo.draw();
        }

        // UI del juego
        if (!this.gameStarted) {
            this.drawStartScreen();
        } else if (this.gameOver) {
            this.drawGameOverScreen();
        }
    }

    drawClouds() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const cloudX = (Date.now() / 50) % canvas.width;
        this.drawCloud(cloudX, 30, 40);
        this.drawCloud(cloudX + 400, 80, 35);
        this.drawCloud(cloudX + 200, 100, 45);
    }

    drawCloud(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 1.2, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x - size * 1.2, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStartScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🦖 DINOSAURIO', canvas.width / 2, canvas.height / 2 - 60);

        ctx.font = '24px Arial';
        ctx.fillText('Presiona ESPACIO para empezar', canvas.width / 2, canvas.height / 2 + 40);
    }

    drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);

        ctx.font = '24px Arial';
        ctx.fillText(`Puntuación: ${this.score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Mejor: ${this.highScore}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText(`Presiona ESPACIO para reintentar`, canvas.width / 2, canvas.height / 2 + 100);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('highscore').textContent = this.highScore;
        document.getElementById('level').textContent = this.level;

        if (this.gameOver) {
            const status = document.getElementById('status');
            status.textContent = '❌ GAME OVER - Presiona ESPACIO para reintentar';
            status.style.color = '#E74C3C';
        } else if (!this.gameStarted) {
            const status = document.getElementById('status');
            status.textContent = '✓ Presiona ESPACIO para empezar';
            status.style.color = '#667eea';
        } else {
            document.getElementById('status').textContent = '';
        }
    }

    restart() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dino_highscore', this.highScore);
        }

        this.dinosaurio = new Dinosaurio();
        this.obstaculos = [];
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.gameStarted = false;
        this.spawnRate = 120;
        this.spawnCounter = 0;
        this.speed = 5;
        this.maxSpeed = 12;

        this.updateUI();
    }

    gameLoop = () => {
        if (this.gameStarted && !this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(this.gameLoop);
        } else if (!this.gameOver) {
            this.draw();
        } else {
            this.draw();
        }
    }
}

// ==================== INICIAR JUEGO ====================
const juego = new Juego();
juego.draw();
