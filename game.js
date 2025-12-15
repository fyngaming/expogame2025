// =============================================
// KOKO ADVENTURE v4.0 - 10 LEVEL COMPLETE
// Sistem Damage Lengkap dengan Elemental & Armor Types
// + JUMP BOOSTER SYSTEM (3 charges per hidup, reset saat mati)
// + AUTO LEVEL PROGRESSION
// + FULLSCREEN CONTROLS FIX
// + ANIMATED LEVEL TRANSITION DENGAN TOMBOL LANJUT
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Koko Adventure v4.0 - Sistem Damage Komprehensif!");
    console.log("✨ FITUR: Elemental Damage, Armor Types, Combo System");
    console.log("🚀 JUMP BOOSTER: 3 charges per hidup, reset saat respawn");
    console.log("➡️ AUTO PROGRESS: Otomatis ke level berikutnya setelah menang");
    console.log("🖥️ FULLSCREEN: Kontrol hanya di dalam layar penuh");
    console.log("🎬 ANIMATED TRANSITION: Transisi level dengan tombol lanjut");
    
    // ========== GET CANVAS & CONTEXT ==========
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("❌ ERROR: Canvas element not found!");
        alert("Error: Canvas tidak ditemukan!");
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("❌ ERROR: Could not get canvas context!");
        alert("Error: Tidak bisa mendapatkan context canvas!");
        return;
    }
    
    console.log("✅ Canvas dan context siap!");
    
    // ========== GAME STATE ==========
    const gameState = {
        running: false,
        paused: false,
        score: 0,
        lives: 5,
        timeLeft: 180,
        gameOver: false,
        win: false,
        currentLevel: 1,
        maxLevel: 10,
        unlockedLevel: 1,
        gameStarted: false,
        lastTime: 0,
        deltaTime: 0,
        camera: {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
            followSpeed: 0.08
        },
        autoProgress: false, // Ubah ke false untuk menggunakan tombol manual
        showLevelTransition: false,
        transitionTimer: 0,
        transitionMessage: "",
        isFullscreen: false,
        countdownValue: 3,
        progressBarWidth: 0,
        progressBarTargetWidth: 300
    };
    // ========== FULLSCREEN GAME STATE ==========
    let fullscreenGameActive = false;
    let originalGameState = null;

    // ========== DEBUG VARIABLES ==========
    let showDebugInfo = false;
    
    // ========== PLAYER OBJECT ==========
    const player = {
        x: 50,
        y: canvas.height - 100,
        width: 40,
        height: 40,
        velocityX: 0,
        velocityY: 0,
        speed: 180,
        jumpPower: 550,
        originalJumpPower: 550,
        jumpSpeedBoost: 1.8,
        isJumping: false,
        facingRight: true,
        hasBoomerang: false,
        hasShield: false,
        shieldTime: 0,
        invincible: false,
        invincibleTimer: 0,
        
        // ===== JUMP SYSTEM =====
        canDoubleJump: true,
        doubleJumpUsed: false,
        maxDoubleJumps: 1,
        airControl: 0.85,
        jumpBuffer: 0,
        jumpBufferTime: 0.15,
        coyoteTime: 0,
        coyoteTimeMax: 0.1,
        jumpRequested: false,
        
        // ===== PHYSICS =====
        gravity: 900,
        maxFallSpeed: 600,
        groundFriction: 0.85,
        airFriction: 0.95,
        jumpCutMultiplier: 0.5,
        acceleration: 2000,
        deceleration: 1500,
        maxHorizontalSpeed: 250,
        onGround: false,
        justLanded: false,
        
        // ===== JUMP BOOSTER SYSTEM =====
        hasJumpBooster: false,
        jumpBoosterActive: false,
        jumpBoosterTimer: 0,
        jumpBoosterDuration: 5,
        jumpBoosterPower: 800,
        jumpBoosterCharges: 3,
        jumpBoosterMaxCharges: 3,
        jumpBoosterMultiplier: 2.0,
        jumpBoosterChargesThisLife: 3,
        
        // Method untuk menggunakan jump booster
        useJumpBooster: function() {
            if (this.jumpBoosterChargesThisLife <= 0) {
                console.log("🚀 No jump booster charges left for this life!");
                showJumpBoosterNotification("No boosters left for this life!", true);
                return false;
            }
            
            if (this.jumpBoosterActive) {
                console.log("🚀 Jump booster already active!");
                return false;
            }
            
            this.jumpBoosterActive = true;
            this.jumpBoosterTimer = this.jumpBoosterDuration;
            this.jumpBoosterChargesThisLife--;
            this.jumpBoosterCharges = this.jumpBoosterChargesThisLife;
            
            if (!this.originalJumpPower) {
                this.originalJumpPower = this.jumpPower;
            }
            
            this.jumpPower = this.jumpBoosterPower;
            this.hasJumpBooster = true;
            
            console.log(`🚀 JUMP BOOSTER ACTIVATED! Charges left this life: ${this.jumpBoosterChargesThisLife}, Duration: ${this.jumpBoosterDuration}s`);
            
            updateGameStats();
            
            const booster = this;
            setTimeout(() => {
                if (booster.jumpBoosterActive) {
                    booster.jumpBoosterActive = false;
                    booster.jumpPower = booster.originalJumpPower;
                    booster.hasJumpBooster = false;
                    console.log("🚀 Jump booster deactivated");
                }
            }, this.jumpBoosterDuration * 1000);
            
            return true;
        },
        
        resetJumpBoosterForNewLife: function() {
            this.jumpBoosterChargesThisLife = this.jumpBoosterMaxCharges;
            this.jumpBoosterCharges = this.jumpBoosterChargesThisLife;
            this.jumpBoosterActive = false;
            this.jumpBoosterTimer = 0;
            this.jumpPower = this.originalJumpPower;
            this.hasJumpBooster = false;
            console.log(`🚀 Jump booster reset for new life! Charges: ${this.jumpBoosterChargesThisLife}/${this.jumpBoosterMaxCharges}`);
        },
        
        resetJumpBoosterForGameOver: function() {
            this.jumpBoosterChargesThisLife = this.jumpBoosterMaxCharges;
            this.jumpBoosterCharges = this.jumpBoosterMaxCharges;
            this.jumpBoosterActive = false;
            this.jumpBoosterTimer = 0;
            this.jumpPower = this.originalJumpPower;
            this.hasJumpBooster = false;
            console.log(`🚀 Jump booster reset for game over! Charges: ${this.jumpBoosterCharges}`);
        },
        
        updateJumpBooster: function(deltaTime) {
            if (this.jumpBoosterActive) {
                this.jumpBoosterTimer -= deltaTime;
                if (this.jumpBoosterTimer <= 0) {
                    this.jumpBoosterActive = false;
                    this.jumpPower = this.originalJumpPower;
                    this.hasJumpBooster = false;
                    console.log("🚀 Jump booster expired (timer)");
                }
            }
        },
        
        rechargeJumpBooster: function(amount = 1) {
            const oldCharges = this.jumpBoosterChargesThisLife;
            this.jumpBoosterChargesThisLife = Math.min(
                this.jumpBoosterChargesThisLife + amount, 
                this.jumpBoosterMaxCharges
            );
            this.jumpBoosterCharges = this.jumpBoosterChargesThisLife;
            
            if (this.jumpBoosterChargesThisLife > oldCharges) {
                console.log(`🚀 Jump booster recharged! Charges this life: ${this.jumpBoosterChargesThisLife}/${this.jumpBoosterMaxCharges}`);
                return true;
            }
            return false;
        },
        
        // ===== DAMAGE COOLDOWN =====
        lastPlatformDamage: 0,
        
        // ===== ATTACK SYSTEM =====
        attackCooldown: 0,
        attackCooldownTime: 0.3,
        canAttack: true,
        comboCount: 0,
        lastAttackTime: 0,
        comboWindow: 0.8,
        isAttacking: false,
        attackDuration: 0.2,
        attackTimer: 0,
        
        attackTypes: {
            basic: {
                damage: 1,
                type: 'physical',
                cooldown: 0.3,
                knockback: 50,
                color: '#FFD700'
            },
            combo1: {
                damage: 2,
                type: 'physical',
                cooldown: 0.25,
                knockback: 70,
                color: '#FF8C00'
            },
            combo2: {
                damage: 3,
                type: 'crush',
                cooldown: 0.2,
                knockback: 100,
                color: '#FF4500'
            },
            jumpAttack: {
                damage: 2,
                type: 'crush',
                cooldown: 0.5,
                knockback: 150,
                color: '#FFD700'
            },
            boomerang: {
                damage: 2,
                type: 'pierce',
                cooldown: 1.0,
                knockback: 30,
                color: '#4169E1'
            }
        },
        
        currentAttackType: 'basic',
        hasElementalAttack: false,
        elementalType: null,
        attackElement: null,
        elementalDamageBonus: 0,
        
        // ===== STATUS EFFECTS =====
        statusEffects: [],
        isPoisoned: false,
        poisonTimer: 0,
        isSlowed: false,
        slowTimer: 0,
        isBurning: false,
        burnTimer: 0
    };
    
    // ========== GAME OBJECTS ==========
    let platforms = [];
    let enemies = [];
    let items = [];
    let projectiles = [];
    let enemyProjectiles = [];
    let particles = [];
    let backgroundElements = [];
    
    // Flag
    const flag = {
        x: 0,
        y: 0,
        width: 30,
        height: 40,
        collected: false
    };
    
    // ========== LEVEL CONFIGURATIONS ==========
    const levelConfigs = {
        1: {
            name: "Hutan Pemula",
            time: 180,
            theme: "day",
            enemyTypes: ['robot_basic'],
            enemyCount: 2,
            platformStyle: "basic",
            difficulty: "easy",
            backgroundType: "forest_light"
        },
        2: {
            name: "Hutan Berbahaya",
            time: 170,
            theme: "day",
            enemyTypes: ['robot_basic', 'snake'],
            enemyCount: 3,
            platformStyle: "basic",
            difficulty: "easy",
            backgroundType: "forest_medium"
        },
        3: {
            name: "Hutan Lebat",
            time: 160,
            theme: "day",
            enemyTypes: ['robot_basic', 'snake', 'spider'],
            enemyCount: 4,
            platformStyle: "elevated",
            difficulty: "medium",
            backgroundType: "forest_dense"
        },
        4: {
            name: "Hutan Malam",
            time: 150,
            theme: "night",
            enemyTypes: ['robot_fast', 'snake_venom', 'bat'],
            enemyCount: 4,
            platformStyle: "moving",
            difficulty: "medium",
            backgroundType: "forest_night"
        },
        5: {
            name: "Hutan Berkabut",
            time: 140,
            theme: "fog",
            enemyTypes: ['robot_shooter', 'spider_web', 'ghost'],
            enemyCount: 5,
            platformStyle: "disappearing",
            difficulty: "hard",
            backgroundType: "forest_fog"
        },
        6: {
            name: "Hutan Beracun",
            time: 130,
            theme: "toxic",
            enemyTypes: ['robot_toxic', 'snake_venom', 'slime'],
            enemyCount: 5,
            platformStyle: "toxic",
            difficulty: "hard",
            backgroundType: "forest_toxic"
        },
        7: {
            name: "Hutan Gunung",
            time: 120,
            theme: "mountain",
            enemyTypes: ['robot_strong', 'eagle', 'yeti'],
            enemyCount: 6,
            platformStyle: "mountain",
            difficulty: "very_hard",
            backgroundType: "forest_mountain"
        },
        8: {
            name: "Hutan Magis",
            time: 110,
            theme: "magic",
            enemyTypes: ['wizard', 'golem', 'fairy_hostile'],
            enemyCount: 6,
            platformStyle: "floating",
            difficulty: "very_hard",
            backgroundType: "forest_magic"
        },
        9: {
            name: "Hutan Api",
            time: 100,
            theme: "fire",
            enemyTypes: ['fire_dragon', 'lava_slime', 'phoenix'],
            enemyCount: 7,
            platformStyle: "lava",
            difficulty: "extreme",
            backgroundType: "forest_fire"
        },
        10: {
            name: "Pertempuran Akhir",
            time: 180,
            theme: "boss",
            enemyTypes: ['boss_dragon', 'boss_robot', 'boss_wizard'],
            enemyCount: 3,
            platformStyle: "boss_arena",
            difficulty: "impossible",
            backgroundType: "forest_boss"
        }
    };
    
    // ========== KEY STATES ==========
    const keys = {};
    
    // ========== MOBILE CONTROL STATE ==========
    const mobileControlState = {
        active: false,
        mode: 'analog',
        analogX: 0,
        analogY: 0,
        analogPower: 0,
        isDragging: false,
        touchId: null
    };
    
    // ========== HELPER FUNCTIONS ==========
    function drawPixelCircle(x, y, radius, pixelSize, color) {
        ctx.fillStyle = color;
        for (let i = -radius; i <= radius; i += pixelSize) {
            for (let j = -radius; j <= radius; j += pixelSize) {
                if (i*i + j*j <= radius*radius) {
                    ctx.fillRect(x + i, y + j, pixelSize, pixelSize);
                }
            }
        }
    }

    function drawPixelLeaf(x, y, width, height, color) {
        ctx.fillStyle = color;
        const leafSize = 3;
        for (let i = 0; i < width/leafSize; i++) {
            for (let j = 0; j < height/leafSize; j++) {
                const distance = Math.sqrt(
                    Math.pow((i/(width/leafSize)) - 0.5, 2) + 
                    Math.pow((j/(height/leafSize)) - 0.5, 2)
                );
                if (distance < 0.4) {
                    ctx.fillRect(x + i*leafSize, y + j*leafSize, leafSize, leafSize);
                }
            }
        }
    }
    
    function drawGrassTexture(x, y, width, height) {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x, y, width, height);
        
        ctx.fillStyle = '#32CD32';
        const grassSize = 4;
        
        for (let i = 0; i < width/grassSize; i++) {
            for (let j = 0; j < 3; j++) {
                if ((i + j) % 3 === 0) {
                    ctx.fillRect(x + i*grassSize, y - j*grassSize, grassSize, grassSize);
                }
            }
        }
    }
    
    function drawPlatformTexture(x, y, width, height, baseColor) {
        const darkColor = '#2F4F4F';
        const lightColor = '#8FBC8F';
        
        const pixelSize = 4;
        
        for (let i = 0; i < width/pixelSize; i++) {
            for (let j = 0; j < height/pixelSize; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillStyle = darkColor;
                } else {
                    ctx.fillStyle = lightColor;
                }
                ctx.fillRect(x + i*pixelSize, y + j*pixelSize, pixelSize, pixelSize);
            }
        }
    }
    
    function drawPixelTree(x, y, width, height) {
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < Math.floor(height/3); j++) {
                ctx.fillRect(x + i*3, y + height - (j*3), 3, 3);
            }
        }
        
        ctx.fillStyle = '#228B22';
        const leafSize = 4;
        const leavesWidth = Math.floor(width * 1.5);
        const leavesHeight = Math.floor(height * 0.7);
        
        for (let i = 0; i < leavesWidth/leafSize; i++) {
            for (let j = 0; j < leavesHeight/leafSize; j++) {
                if ((i + j) % 3 !== 0) {
                    const px = x - (leavesWidth - width)/2 + i*leafSize;
                    const py = y + j*leafSize;
                    ctx.fillRect(px, py, leafSize, leafSize);
                }
            }
        }
    }
    
    function drawPixelBush(x, y, width, height) {
        ctx.fillStyle = '#32CD32';
        const bushSize = 3;
        
        for (let i = 0; i < width/bushSize; i++) {
            for (let j = 0; j < height/bushSize; j++) {
                if ((i * 2 + j) % 4 !== 0) {
                    ctx.fillRect(x + i*bushSize, y - j*bushSize, bushSize, bushSize);
                }
            }
        }
    }
    
    function drawPixelLog(x, y, width, height) {
        ctx.fillStyle = '#8B4513';
        const logSize = 4;
        
        for (let i = 0; i < width/logSize; i++) {
            for (let j = 0; j < height/logSize; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(x + i*logSize, y - j*logSize, logSize, logSize);
                }
            }
        }
    }
    
    function drawPixelCloud(x, y, width, height) {
        ctx.fillStyle = '#FFFFFF';
        const cloudSize = 4;
        
        const cloudPattern = [
            [0,0,1,1,1,0,0],
            [0,1,1,1,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0]
        ];
        
        for (let i = 0; i < cloudPattern.length; i++) {
            for (let j = 0; j < cloudPattern[i].length; j++) {
                if (cloudPattern[i][j]) {
                    ctx.fillRect(x + j*cloudSize, y + i*cloudSize, cloudSize, cloudSize);
                }
            }
        }
    }

    function isFlagVisible() {
        return flag.x >= gameState.camera.x && 
               flag.x <= gameState.camera.x + gameState.camera.width &&
               flag.y >= gameState.camera.y && 
               flag.y <= gameState.camera.y + gameState.camera.height;
    }
    
    function drawPixelMountain(x, y, width, height, color) {
        ctx.fillStyle = color;
        const pixelSize = 4;
        
        for (let i = 0; i < width/pixelSize; i++) {
            const slope = Math.floor((i / (width/pixelSize)) * (height/pixelSize));
            for (let j = 0; j < slope; j++) {
                ctx.fillRect(x + i*pixelSize, y - j*pixelSize, pixelSize, pixelSize);
            }
        }
    }
    
    // ========== LEVEL TRANSITION SYSTEM DENGAN TOMBOL ==========
    function showLevelTransition(message) {
        gameState.showLevelTransition = true;
        gameState.transitionTimer = 4;
        gameState.transitionMessage = message;
        gameState.running = false;
        gameState.paused = true;
        
        console.log(`🎬 Level Transition: ${message}`);
        
        gameState.progressBarWidth = 0;
        gameState.progressBarTargetWidth = 300;
        gameState.countdownValue = 3;
    }
    
    function updateLevelTransition(deltaTime) {
        if (gameState.showLevelTransition) {
            // Tidak perlu update timer karena menggunakan tombol manual
            // Hanya update jika auto-progress ON (tapi kita ingin tombol manual)
            if (gameState.autoProgress) {
                gameState.transitionTimer -= deltaTime;
                
                const newCountdownValue = Math.ceil(gameState.transitionTimer - 1);
                if (newCountdownValue !== gameState.countdownValue && newCountdownValue >= 0) {
                    gameState.countdownValue = newCountdownValue;
                    console.log(`⏱️ Countdown: ${gameState.countdownValue}`);
                }
                
                if (gameState.countdownValue > 0) {
                    const progress = (3 - gameState.countdownValue) / 3;
                    gameState.progressBarWidth = 300 * progress;
                } else {
                    gameState.progressBarWidth = 300;
                    
                    if (gameState.autoProgress) {
                        if (gameState.currentLevel < gameState.maxLevel) {
                            autoProgressToNextLevel();
                        } else {
                            showGameCompleteScreen();
                        }
                        gameState.showLevelTransition = false;
                    }
                }
                
                if (gameState.transitionTimer <= 0) {
                    gameState.showLevelTransition = false;
                    gameState.progressBarWidth = 0;
                    gameState.countdownValue = 3;
                }
            }
        }
    }
    
    function drawLevelTransition() {
        if (!gameState.showLevelTransition) return;
        
        ctx.save();
        
        // Overlay gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(26, 71, 42, 0.95)');
        gradient.addColorStop(1, 'rgba(42, 98, 61, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Container utama
        const containerWidth = 500;
        const containerHeight = 350;
        const containerX = canvas.width / 2 - containerWidth / 2;
        const containerY = canvas.height / 2 - containerHeight / 2;
        
        // Background container
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 20);
        } else {
            ctx.rect(containerX, containerY, containerWidth, containerHeight);
        }
        ctx.fill();
        ctx.stroke();
        
        // Efek glow
        ctx.shadowColor = '#4CAF50';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(containerX - 10, containerY - 10, containerWidth + 20, containerHeight + 20, 25);
        } else {
            ctx.rect(containerX - 10, containerY - 10, containerWidth + 20, containerHeight + 20);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===== TITLE =====
        // Ikon trophy
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', canvas.width / 2, containerY + 80);
        
        // Title utama
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('LEVEL SELESAI!', canvas.width / 2, containerY + 130);
        
        // ===== LEVEL INFO =====
        // Level yang selesai
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`Level ${gameState.currentLevel} Telah Diselesaikan!`, canvas.width / 2, containerY + 180);
        
        // Informasi level berikutnya
        if (gameState.currentLevel < gameState.maxLevel) {
            ctx.fillStyle = '#00FFFF';
            ctx.font = '24px Arial';
            ctx.fillText(`Siap melanjutkan ke Level ${gameState.currentLevel + 1}`, canvas.width / 2, containerY + 220);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.font = '24px Arial';
            ctx.fillText('🎮 SEMUA LEVEL TELAH DISELESAIKAN!', canvas.width / 2, containerY + 220);
        }
        
        // ===== TOMBOL LANJUT =====
        // Tombol "Lanjutkan ke Level Berikutnya"
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = containerY + 270;
        
        // Background tombol
        const buttonGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
        buttonGradient.addColorStop(0, '#4CAF50');
        buttonGradient.addColorStop(1, '#2E7D32');
        
        ctx.fillStyle = buttonGradient;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
            ctx.fill();
        } else {
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        }
        
        // Border tombol
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
            ctx.stroke();
        } else {
            ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        }
        
        // Efek hover (animasi)
        const time = Date.now() / 1000;
        const glow = Math.sin(time * 3) * 0.2 + 0.8;
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 10 * glow;
        
        // Border glow
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(buttonX - 2, buttonY - 2, buttonWidth + 4, buttonHeight + 4, 12);
            ctx.stroke();
        } else {
            ctx.strokeRect(buttonX - 2, buttonY - 2, buttonWidth + 4, buttonHeight + 4);
        }
        ctx.shadowBlur = 0;
        
        // Teks tombol
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (gameState.currentLevel < gameState.maxLevel) {
            ctx.fillText(`Lanjutkan ke Level ${gameState.currentLevel + 1}`, canvas.width / 2, buttonY + buttonHeight / 2);
        } else {
            ctx.fillText('Tampilkan Hasil Akhir', canvas.width / 2, buttonY + buttonHeight / 2);
        }
        
        // ===== JUMP BOOSTER INFO =====
        ctx.fillStyle = '#00FFFF';
        ctx.font = '16px Arial';
        ctx.fillText(`Jump Booster: ${player.jumpBoosterChargesThisLife} charges dibawa ke level berikutnya`, canvas.width / 2, buttonY + buttonHeight + 30);
        
        // ===== PETUNJUK KLIK =====
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px Arial';
        ctx.fillText('Klik tombol di atas untuk melanjutkan', canvas.width / 2, buttonY + buttonHeight + 60);
        
        ctx.restore();
    }
    
    // ========== GAME COMPLETE SCREEN ==========
    function showGameCompleteScreen() {
        gameState.running = false;
        gameState.paused = true;
        gameState.win = true;
        
        // Buat confetti effect
        createConfettiEffect();
        
        // Tampilkan screen akhir
        setTimeout(() => {
            drawGameCompleteScreen();
        }, 100);
    }

    function drawGameCompleteScreen() {
        ctx.save();
        
        // Overlay gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 50, 0.95)');
        gradient.addColorStop(1, 'rgba(0, 50, 100, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Container utama
        const containerWidth = 600;
        const containerHeight = 400;
        const containerX = canvas.width / 2 - containerWidth / 2;
        const containerY = canvas.height / 2 - containerHeight / 2;
        
        // Background container
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 20);
        } else {
            ctx.rect(containerX, containerY, containerWidth, containerHeight);
        }
        ctx.fill();
        ctx.stroke();
        
        // ===== JUDUL UTAMA =====
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎉 SELAMAT! 🎉', canvas.width / 2, containerY + 80);
        
        // ===== SUB JUDUL =====
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('Anda telah menyelesaikan', canvas.width / 2, containerY + 130);
        ctx.fillText('semua 10 level!', canvas.width / 2, containerY + 170);
        
        // ===== STATISTIK =====
        ctx.fillStyle = '#00FFFF';
        ctx.font = '24px Arial';
        ctx.fillText(`Skor Akhir: ${gameState.score}`, canvas.width / 2, containerY + 220);
        
        // ===== TOMBOL =====
        // Tombol "Main Lagi"
        const buttonWidth = 250;
        const buttonHeight = 50;
        const buttonX = canvas.width / 2 - buttonWidth - 20;
        const buttonY = containerY + 280;
        
        // Background tombol Main Lagi
        const buttonGradient1 = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
        buttonGradient1.addColorStop(0, '#4CAF50');
        buttonGradient1.addColorStop(1, '#2E7D32');
        
        ctx.fillStyle = buttonGradient1;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
            ctx.fill();
        } else {
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        }
        
        // Teks tombol Main Lagi
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Main Lagi', buttonX + buttonWidth/2, buttonY + buttonHeight/2);
        
        // Tombol "Menu Utama"
        const buttonX2 = canvas.width / 2 + 20;
        
        // Background tombol Menu Utama
        const buttonGradient2 = ctx.createLinearGradient(buttonX2, buttonY, buttonX2, buttonY + buttonHeight);
        buttonGradient2.addColorStop(0, '#2196F3');
        buttonGradient2.addColorStop(1, '#1976D2');
        
        ctx.fillStyle = buttonGradient2;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(buttonX2, buttonY, buttonWidth, buttonHeight, 10);
            ctx.fill();
        } else {
            ctx.fillRect(buttonX2, buttonY, buttonWidth, buttonHeight);
        }
        
        // Teks tombol Menu Utama
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Menu Utama', buttonX2 + buttonWidth/2, buttonY + buttonHeight/2);
        
        // ===== PETUNJUK KLIK =====
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px Arial';
        ctx.fillText('Klik tombol untuk memilih aksi', canvas.width / 2, buttonY + buttonHeight + 30);
        
        ctx.restore();
    }

    function createConfettiEffect() {
        // Hapus confetti yang ada
        const existingConfetti = document.querySelectorAll('.confetti');
        existingConfetti.forEach(confetti => confetti.remove());
        
        // Buat confetti baru
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: fixed;
                width: ${10 + Math.random() * 10}px;
                height: ${10 + Math.random() * 10}px;
                background: ${['#FFD700', '#4CAF50', '#2196F3', '#FF5252', '#9C27B0'][Math.floor(Math.random() * 5)]};
                top: -50px;
                left: ${Math.random() * 100}vw;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                z-index: 10001;
                pointer-events: none;
                animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
            `;
            document.body.appendChild(confetti);
            
            // Hapus setelah animasi selesai
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    function showGameCompletePopup() {
        // Total score calculation
        const totalScore = gameState.score;
        const levelsCompleted = gameState.maxLevel;
        const averageScore = Math.floor(totalScore / levelsCompleted);
        
        // Rating bintang berdasarkan skor
        let stars = 0;
        if (totalScore > 20000) stars = 5;
        else if (totalScore > 15000) stars = 4;
        else if (totalScore > 10000) stars = 3;
        else if (totalScore > 5000) stars = 2;
        else stars = 1;
        
        // Buat popup game complete
        let popup = document.querySelector('.game-complete-popup');
        let overlay = document.querySelector('.overlay');
        
        if (!popup) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
            
            popup = document.createElement('div');
            popup.className = 'game-complete-popup';
            document.body.appendChild(popup);
        }
        
        popup.innerHTML = `
            <h1><i class="fas fa-crown"></i> SELAMAT!</h1>
            <h2>Anda telah menyelesaikan semua 10 level!</h2>
            
            <div class="star-rating">
                ${'<i class="fas fa-star"></i>'.repeat(stars)}
            </div>
            
            <div class="final-stats">
                <div>Total Skor: <span>${totalScore}</span></div>
                <div>Level Diselesaikan: <span>10/10</span></div>
                <div>Rata-rata Skor per Level: <span>${averageScore}</span></div>
                <div>Jump Booster Tersisa: <span>${player.jumpBoosterChargesThisLife}</span></div>
            </div>
            
            <div class="popup-buttons">
                <button id="playAgainBtn" class="popup-btn play-again">
                    <i class="fas fa-redo"></i> Main Lagi
                </button>
                <button id="mainMenuBtn" class="popup-btn main-menu">
                    <i class="fas fa-home"></i> Menu Utama
                </button>
            </div>
        `;
        
        // Tambahkan styles inline untuk popup
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10002;
            background: linear-gradient(135deg, #1a472a, #2a623d);
            padding: 40px;
            border-radius: 25px;
            border: 5px solid #FFD700;
            box-shadow: 0 0 50px rgba(255, 215, 0, 0.7);
            min-width: 500px;
            max-width: 600px;
            text-align: center;
            animation: popupScale 0.5s ease-out;
        `;
        
        popup.querySelector('h1').style.cssText = `
            color: #FFD700;
            margin-bottom: 20px;
            font-size: 2.8rem;
            animation: celebrate 2s infinite;
        `;
        
        popup.querySelector('h2').style.cssText = `
            color: #FFFFFF;
            margin-bottom: 30px;
            font-size: 1.8rem;
        `;
        
        popup.querySelector('.final-stats').style.cssText = `
            background: rgba(30, 58, 42, 0.9);
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            border: 2px solid #4CAF50;
            text-align: left;
        `;
        
        popup.querySelectorAll('.final-stats div').forEach(div => {
            div.style.cssText = `
                display: flex;
                justify-content: space-between;
                margin: 15px 0;
                color: #a5d6a7;
                font-size: 1.2rem;
                padding: 8px 0;
                border-bottom: 1px solid rgba(76, 175, 80, 0.3);
            `;
            
            const span = div.querySelector('span');
            if (span) {
                span.style.cssText = `
                    color: white;
                    font-weight: bold;
                    font-size: 1.3rem;
                `;
            }
        });
        
        popup.querySelector('.star-rating').style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
        `;
        
        popup.querySelectorAll('.star-rating i').forEach(star => {
            star.style.cssText = `
                color: #FFD700;
                font-size: 2.5rem;
                animation: starTwinkle 1.5s infinite;
            `;
        });
        
        popup.querySelector('.popup-buttons').style.cssText = `
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-top: 30px;
            flex-wrap: wrap;
        `;
        
        const playAgainBtn = popup.querySelector('#playAgainBtn');
        const mainMenuBtn = popup.querySelector('#mainMenuBtn');
        
        if (playAgainBtn) {
            playAgainBtn.style.cssText = `
                padding: 18px 35px;
                background: linear-gradient(135deg, #4CAF50, #2E7D32);
                color: white;
                border: none;
                border-radius: 50px;
                font-weight: bold;
                cursor: pointer;
                font-size: 1.3rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                min-width: 200px;
                box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                transition: all 0.3s;
            `;
            
            playAgainBtn.addEventListener('click', function() {
                overlay.classList.remove('show');
                popup.classList.remove('show');
                
                // Reset game untuk dimainkan lagi dari awal
                gameState.currentLevel = 1;
                gameState.score = 0;
                gameState.lives = 5;
                gameState.unlockedLevel = 1;
                
                player.resetJumpBoosterForGameOver();
                
                setupLevel(1);
                startGame();
                
                // Hapus confetti
                document.querySelectorAll('.confetti').forEach(c => c.remove());
            });
        }
        
        if (mainMenuBtn) {
            mainMenuBtn.style.cssText = `
                padding: 18px 35px;
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
                border: none;
                border-radius: 50px;
                font-weight: bold;
                cursor: pointer;
                font-size: 1.3rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                min-width: 200px;
                box-shadow: 0 6px 15px rgba(0,0,0,0.3);
                transition: all 0.3s;
            `;
            
            mainMenuBtn.addEventListener('click', function() {
                overlay.classList.remove('show');
                popup.classList.remove('show');
                
                returnToMainMenu();
                
                // Hapus confetti
                document.querySelectorAll('.confetti').forEach(c => c.remove());
            });
        }
        
        // Tampilkan overlay dan popup
        overlay.classList.add('show');
        popup.classList.add('show');
    }
    
    // ========== MODIFIED AUTO PROGRESS TO NEXT LEVEL ==========
    function autoProgressToNextLevel() {
        if (gameState.currentLevel < gameState.maxLevel) {
            console.log(`➡️ Auto-progress dari Level ${gameState.currentLevel} ke Level ${gameState.currentLevel + 1}`);
            
            const currentBoosterCharges = player.jumpBoosterChargesThisLife;
            
            gameState.currentLevel++;
            
            if (gameState.currentLevel > gameState.unlockedLevel) {
                gameState.unlockedLevel = gameState.currentLevel;
            }
            
            setupLevel(gameState.currentLevel);
            
            player.jumpBoosterChargesThisLife = currentBoosterCharges;
            player.jumpBoosterCharges = currentBoosterCharges;
            
            console.log(`🚀 Jump booster charges dibawa ke Level ${gameState.currentLevel}: ${player.jumpBoosterChargesThisLife}`);
            
            // Update tombol level berikutnya
            setupNextLevelButton();
            
            setTimeout(() => {
                startGame();
                showJumpBoosterNotification(`Level ${gameState.currentLevel} dimulai! (${player.jumpBoosterChargesThisLife} booster charges tersedia)`);
                
                createParticles(canvas.width / 2, canvas.height / 2, 50, '#4CAF50');
                createParticles(canvas.width / 2, canvas.height / 2, 30, '#00FFFF');
            }, 300);
            
            return true;
        } else {
            // Level 10 selesai
            showGameCompleteScreen();
            return false;
        }
    }
    
    // ========== FUNGSI TOMBOL LEVEL BERIKUTNYA ==========
    function setupNextLevelButton() {
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            // Hapus event listener lama
            nextLevelBtn.replaceWith(nextLevelBtn.cloneNode(true));
            
            const newNextLevelBtn = document.getElementById('nextLevelBtn');
            
            newNextLevelBtn.addEventListener('click', function() {
                console.log(`➡️ Tombol "Level Berikutnya" diklik untuk level ${gameState.currentLevel + 1}`);
                
                // Simpan jump booster charges
                const currentBoosterCharges = player.jumpBoosterChargesThisLife;
                
                // Pindah ke level berikutnya
                if (gameState.currentLevel < gameState.maxLevel) {
                    setupLevel(gameState.currentLevel + 1);
                    
                    // Kembalikan jump booster charges
                    player.jumpBoosterChargesThisLife = currentBoosterCharges;
                    player.jumpBoosterCharges = currentBoosterCharges;
                    
                    console.log(`🚀 Jump booster charges dibawa ke Level ${gameState.currentLevel}: ${player.jumpBoosterChargesThisLife}`);
                    
                    // Mulai game
                    startGame();
                    hideNextLevelButton();
                    
                    // Tampilkan notifikasi
                    showJumpBoosterNotification(`Level ${gameState.currentLevel} dimulai! (${player.jumpBoosterChargesThisLife} booster charges)`);
                } else {
                    // Level 10 selesai, tampilkan screen akhir
                    showGameCompleteScreen();
                }
            });
            
            // Update teks tombol
            if (gameState.currentLevel < gameState.maxLevel) {
                newNextLevelBtn.innerHTML = `<i class="fas fa-forward"></i> Lanjut ke Level ${gameState.currentLevel + 1}`;
            } else {
                newNextLevelBtn.innerHTML = `<i class="fas fa-crown"></i> Game Selesai`;
                newNextLevelBtn.disabled = true;
            }
        }
    }
    
    // ========== MODIFIED winLevel FUNCTION ==========
    function winLevel() {
        if (gameState.win) return;
        
        gameState.win = true;
        gameState.running = false;
        
        const timeBonus = Math.floor(gameState.timeLeft * 10);
        const livesBonus = gameState.lives * 100;
        const levelBonus = gameState.currentLevel * 500;
        
        gameState.score += timeBonus + livesBonus + levelBonus;
        
        if (gameState.currentLevel < gameState.maxLevel) {
            if (gameState.currentLevel + 1 > gameState.unlockedLevel) {
                gameState.unlockedLevel = gameState.currentLevel + 1;
            }
        }
        
        // JUMP BOOSTER: TIDAK reset saat menang level
        console.log(`🏆 Level ${gameState.currentLevel} completed! Jump booster charges carried over: ${player.jumpBoosterChargesThisLife}`);
        
        updateGameStats();
        updateLevelButtons();
        
        // Tampilkan transisi dengan tombol "Lanjutkan ke Level Berikutnya"
        showLevelTransition(`Level ${gameState.currentLevel} Selesai!`);
    }
    
    // ========== CHEAT FUNCTIONS ==========
    function skipToNextLevel() {
        if (gameState.currentLevel < gameState.maxLevel) {
            console.log(`🚀 CHEAT: Skipping from Level ${gameState.currentLevel} to ${gameState.currentLevel + 1}`);
            setupLevel(gameState.currentLevel + 1);
            startGame();
        }
    }
    
    function toggleGodMode() {
        player.hasShield = !player.hasShield;
        player.shieldTime = 999;
        gameState.lives = 999;
        player.hasElementalAttack = true;
        player.elementalType = 'all';
        console.log(`🛡️ GOD MODE: ${player.hasShield ? 'ON' : 'OFF'}`);
    }
    
    function unlockAllLevels() {
        gameState.unlockedLevel = gameState.maxLevel;
        updateLevelButtons();
        console.log(`🔓 CHEAT: All ${gameState.maxLevel} levels unlocked!`);
    }
    
    function addCheatScore() {
        gameState.score += 10000;
        updateGameStats();
        console.log(`💰 CHEAT: Added 10,000 points! Total: ${gameState.score}`);
    }
    
    function activateSpeedBoost() {
        player.speed = 300;
        player.jumpPower = 700;
        setTimeout(() => {
            player.speed = 180;
            player.jumpPower = player.originalJumpPower;
        }, 10000);
        console.log(`⚡ SPEED BOOST: Activated for 10 seconds!`);
    }
    
    // ========== CHEAT JUMP BOOSTER ==========
    function cheatActivateJumpBooster() {
        const success = player.useJumpBooster();
        
        if (success) {
            console.log(`🚀 CHEAT: Jump Booster Activated!`);
            
            createParticles(player.x + player.width/2, player.y + player.height/2, 
                           30, '#00FFFF');
            createParticles(player.x + player.width/2, player.y + player.height/2, 
                           20, '#FF00FF');
        }
    }
    
    function cheatRefillJumpBooster() {
        player.jumpBoosterCharges = player.jumpBoosterMaxCharges;
        console.log(`🚀 CHEAT: Jump Booster refilled! Charges: ${player.jumpBoosterCharges}`);
    }
    
    function debugPlatformCollisions() {
        if (gameState.currentLevel !== 4) return;
        
        console.log("🔍 Platform Collision Debug:");
        console.log("📍 Player:", {x: player.x, y: player.y, isJumping: player.isJumping, onGround: player.onGround});
        console.log("📏 Platform Count:", platforms.length);
        
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            
            const isColliding = (
                player.x + player.width > p.x &&
                player.x < p.x + p.width &&
                player.y + player.height > p.y &&
                player.y + player.height < p.y + p.height + 10
            );
            
            console.log(`Platform ${i} (${p.type}):`, {
                x: p.x, y: p.y, width: p.width,
                isColliding: isColliding,
                visible: p.type !== 'disappearing' || p.visible
            });
        }
    }
    
    // ========== JUMP BOOSTER NOTIFICATION ==========
    function showJumpBoosterNotification(message, isError = false) {
        const existingNotification = document.querySelector('.jump-booster-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = 'jump-booster-notification';
        notification.innerHTML = `
            <i class="fas fa-rocket"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${isError ? '#FF5252' : '#4CAF50'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }


    // ========== FULLSCREEN GAME FUNCTIONS ==========
function initializeFullscreenGame() {
    console.log("🎮 Menginisialisasi game fullscreen...");
    
    // Simpan state asli
    originalGameState = {
        running: gameState.running,
        paused: gameState.paused,
        gameStarted: gameState.gameStarted
    };
    
    // Set game untuk fullscreen mode
    fullscreenGameActive = true;
    
    // Setup controls untuk fullscreen
    setupFullscreenControls();
    
    // Pastikan mobile controls terlihat
    const mobileControls = document.querySelector('.mobile-controls');
    if (mobileControls) {
        mobileControls.style.display = 'flex';
        mobileControls.classList.add('fullscreen-visible');
    }
    
    console.log("✅ Game fullscreen siap!");
}

function exitFullscreenGame() {
    console.log("🚪 Keluar dari game fullscreen...");
    
    fullscreenGameActive = false;
    
    // Restore original state jika ada
    if (originalGameState) {
        gameState.running = originalGameState.running;
        gameState.paused = originalGameState.paused;
        gameState.gameStarted = originalGameState.gameStarted;
    }
    
    // Sembunyikan mobile controls
    const mobileControls = document.querySelector('.mobile-controls');
    if (mobileControls) {
        if (window.innerWidth >= 769) {
            mobileControls.style.display = 'none';
        }
        mobileControls.classList.remove('fullscreen-visible');
    }
    
    console.log("✅ Kembali ke mode normal");
}

function setupFullscreenControls() {
    console.log("🔧 Setup kontrol untuk fullscreen...");
    
    // Setup keyboard controls untuk WASD
    document.addEventListener('keydown', function(e) {
        if (!fullscreenGameActive) return;
        
        // WASD Controls
        if (e.key === 'w' || e.key === 'W') {
            keys['ArrowUp'] = true;
            keys[' '] = true;
            keys['x'] = true;
            keys['X'] = true;
            player.jumpRequested = true;
            player.jumpBuffer = player.jumpBufferTime;
            e.preventDefault();
        }
        if (e.key === 'a' || e.key === 'A') {
            keys['ArrowLeft'] = true;
            keys['a'] = true;
            keys['A'] = true;
            player.facingRight = false;
            e.preventDefault();
        }
        if (e.key === 's' || e.key === 'S') {
            keys['ArrowDown'] = true;
            e.preventDefault();
        }
        if (e.key === 'd' || e.key === 'D') {
            keys['ArrowRight'] = true;
            keys['d'] = true;
            keys['D'] = true;
            player.facingRight = true;
            e.preventDefault();
        }
        
        // Attack dengan 'z' atau 'Z'
        if (e.key === 'z' || e.key === 'Z') {
            if (player.hasBoomerang) {
                throwBoomerang();
            } else {
                performMeleeAttack();
            }
            e.preventDefault();
        }
        
        // Jump booster dengan 'b' atau 'B'
        if (e.key === 'b' || e.key === 'B') {
            player.useJumpBooster();
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (!fullscreenGameActive) return;
        
        if (e.key === 'w' || e.key === 'W') {
            keys['ArrowUp'] = false;
            keys[' '] = false;
            keys['x'] = false;
            keys['X'] = false;
            player.jumpRequested = false;
        }
        if (e.key === 'a' || e.key === 'A') {
            keys['ArrowLeft'] = false;
            keys['a'] = false;
            keys['A'] = false;
        }
        if (e.key === 's' || e.key === 'S') {
            keys['ArrowDown'] = false;
        }
        if (e.key === 'd' || e.key === 'D') {
            keys['ArrowRight'] = false;
            keys['d'] = false;
            keys['D'] = false;
        }
    });
}
    
    // ========== INITIALIZE GAME ==========
    function init() {
        console.log("🚀 Inisialisasi game dengan sistem damage...");
        
        setupLevel(1);
        drawStartScreen();
        setupEventListeners();
        updateGameStats();
        updateLevelButtons();
        setupFullscreenToggle();
        setupFullscreenControls();
        
        // Tambahkan polyfill untuk roundRect jika belum ada
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this.beginPath();
                this.moveTo(x + r, y);
                this.arcTo(x + w, y, x + w, y + h, r);
                this.arcTo(x + w, y + h, x, y + h, r);
                this.arcTo(x, y + h, x, y, r);
                this.arcTo(x, y, x + w, y, r);
                this.closePath();
                return this;
            }
        }
        
        // Event listener untuk klik tombol di canvas
        canvas.addEventListener('click', handleCanvasClick);
        
        requestAnimationFrame(animate);
        
        console.log("✅ Game siap dimainkan!");
    }
    
    // ========== HANDLE CANVAS CLICK (UNTUK TOMBOL LANJUT) ==========
    function handleCanvasClick(e) {
        if (gameState.showLevelTransition) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Cek apakah klik berada di area tombol "Lanjutkan ke Level Berikutnya"
            const containerWidth = 500;
            const containerHeight = 350;
            const containerX = canvas.width / 2 - containerWidth / 2;
            const containerY = canvas.height / 2 - containerHeight / 2;
            
            const buttonWidth = 300;
            const buttonHeight = 50;
            const buttonX = canvas.width / 2 - buttonWidth / 2;
            const buttonY = containerY + 270;
            
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                
                console.log(`➡️ Tombol "Lanjutkan ke Level Berikutnya" diklik!`);
                
                // Tutup transisi screen
                gameState.showLevelTransition = false;
                
                if (gameState.currentLevel < gameState.maxLevel) {
                    // Simpan jump booster charges
                    const currentBoosterCharges = player.jumpBoosterChargesThisLife;
                    
                    // Pindah ke level berikutnya
                    gameState.currentLevel++;
                    
                    if (gameState.currentLevel > gameState.unlockedLevel) {
                        gameState.unlockedLevel = gameState.currentLevel;
                    }
                    
                    setupLevel(gameState.currentLevel);
                    
                    // Kembalikan jump booster charges
                    player.jumpBoosterChargesThisLife = currentBoosterCharges;
                    player.jumpBoosterCharges = currentBoosterCharges;
                    
                    console.log(`🚀 Melanjutkan ke Level ${gameState.currentLevel}! Jump booster charges: ${player.jumpBoosterChargesThisLife}`);
                    
                    // Mulai game
                    startGame();
                    
                    // Tampilkan notifikasi
                    showJumpBoosterNotification(`Level ${gameState.currentLevel} dimulai! (${player.jumpBoosterChargesThisLife} booster charges)`);
                    
                    // Efek partikel
                    createParticles(canvas.width / 2, canvas.height / 2, 50, '#4CAF50');
                    createParticles(canvas.width / 2, canvas.height / 2, 30, '#00FFFF');
                } else {
                    // Level 10 selesai, tampilkan screen akhir
                    showGameCompleteScreen();
                }
            }
            
            // Cek apakah klik tombol di screen akhir
            if (gameState.win && !gameState.showLevelTransition) {
                const buttonWidth = 250;
                const buttonHeight = 50;
                const containerWidth = 600;
                const containerHeight = 400;
                const containerX = canvas.width / 2 - containerWidth / 2;
                const containerY = canvas.height / 2 - containerHeight / 2;
                
                const buttonX = canvas.width / 2 - buttonWidth - 20;
                const buttonY = containerY + 280;
                const buttonX2 = canvas.width / 2 + 20;
                
                // Tombol "Main Lagi"
                if (x >= buttonX && x <= buttonX + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight) {
                    
                    console.log("🔄 Tombol 'Main Lagi' diklik di screen akhir");
                    
                    // Reset game
                    gameState.currentLevel = 1;
                    gameState.score = 0;
                    gameState.lives = 5;
                    gameState.unlockedLevel = 1;
                    gameState.win = false;
                    
                    player.resetJumpBoosterForGameOver();
                    
                    setupLevel(1);
                    startGame();
                }
                
                // Tombol "Menu Utama"
                if (x >= buttonX2 && x <= buttonX2 + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight) {
                    
                    console.log("🏠 Tombol 'Menu Utama' diklik di screen akhir");
                    
                    returnToMainMenu();
                }
            }
        }
    }
    
    // ========== SETUP LEVEL ==========
    function setupLevel(level) {
        console.log(`🔄 Setup Level ${level}: ${levelConfigs[level].name}`);
        
        const config = levelConfigs[level];
        gameState.currentLevel = level;
        gameState.scoreBeforeLevel = gameState.score; // <-- PERBAIKAN: Simpan skor sebelum level dimulai
        gameState.timeLeft = config.time;
        gameState.lives = Math.min(5 + Math.floor(level/2), 10);
        gameState.win = false;
        gameState.gameOver = false;
        gameState.running = false;
        gameState.showLevelTransition = false;
        flag.collected = false;
        
        platforms = [];
        enemies = [];
        items = [];
        projectiles = [];
        enemyProjectiles = [];
        particles = [];
        backgroundElements = [];
        
        setupPlatforms(level);
        setupEnemies(level);
        setupItems(level);
        setupBackground(level);
        setupFlag(level);
        resetPlayer();
        
        if (!player.jumpBoosterChargesThisLife) {
            player.jumpBoosterChargesThisLife = player.jumpBoosterMaxCharges;
        }
        player.jumpBoosterCharges = player.jumpBoosterChargesThisLife;
        
        console.log(`🚀 Level ${level}: Jump Booster charges carried over: ${player.jumpBoosterChargesThisLife}`);
        
        updateGameStats();
        updateLevelButtons();
        hideNextLevelButton();
        
        // Setup tombol level berikutnya
        setupNextLevelButton();
        
        console.log(`✅ Level ${level} setup selesai!`);
    }
    
    function setupPlatforms(level) {
        const width = canvas.width * (1 + (level * 0.2));
        
        platforms.push({
            x: 0, 
            y: canvas.height - 40, 
            width: width, 
            height: 40, 
            type: 'ground',
            color: '#228B22',
            texture: 'grass'
        });
        
        switch(level) {
            case 1:
                platforms.push(
                    {x: 100, y: canvas.height - 150, width: 150, height: 20, type: 'platform'},
                    {x: 300, y: canvas.height - 200, width: 120, height: 20, type: 'platform'},
                    {x: 500, y: canvas.height - 250, width: 100, height: 20, type: 'platform'},
                    {x: 700, y: canvas.height - 150, width: 150, height: 20, type: 'platform'}
                );
                break;
                
            case 2:
                platforms.push(
                    {x: 80, y: canvas.height - 180, width: 120, height: 20, type: 'platform'},
                    {x: 250, y: canvas.height - 220, width: 100, height: 20, type: 'platform'},
                    {x: 400, y: canvas.height - 280, width: 150, height: 20, type: 'platform'},
                    {x: 600, y: canvas.height - 200, width: 120, height: 20, type: 'platform'},
                    {x: 800, y: canvas.height - 150, width: 150, height: 20, type: 'platform'}
                );
                break;
                
            case 3:
                platforms.push(
                    {x: 100, y: canvas.height - 150, width: 150, height: 20, type: 'platform'},
                    {x: 300, y: canvas.height - 250, width: 120, height: 20, type: 'platform'},
                    {x: 500, y: canvas.height - 350, width: 100, height: 20, type: 'platform'},
                    {x: 700, y: canvas.height - 200, width: 150, height: 20, type: 'platform'},
                    {x: 900, y: canvas.height - 300, width: 120, height: 20, type: 'platform'}
                );
                break;
                
            case 4:
                platforms.push({
                    x: 0, 
                    y: canvas.height - 40, 
                    width: 1600,
                    height: 40, 
                    type: 'ground'
                });
                
                platforms.push({
                    x: 100, 
                    y: canvas.height - 180, 
                    width: 160, 
                    height: 25, 
                    type: 'platform',
                    color: '#4CAF50'
                });
                
                platforms.push({
                    x: 320, 
                    y: canvas.height - 220, 
                    width: 140, 
                    height: 25, 
                    type: 'platform',
                    color: '#4CAF50'
                });
                
                platforms.push({
                    x: 520, 
                    y: canvas.height - 260, 
                    width: 120, 
                    height: 25, 
                    type: 'platform',
                    color: '#4CAF50'
                });
                
                platforms.push({
                    x: 700, 
                    y: canvas.height - 200, 
                    width: 160, 
                    height: 25, 
                    type: 'platform',
                    color: '#4CAF50'
                });
                
                platforms.push({
                    x: 900, 
                    y: canvas.height - 160, 
                    width: 200, 
                    height: 25, 
                    type: 'platform',
                    color: '#4CAF50'
                });
                
                platforms.push({
                    x: 1150, 
                    y: canvas.height - 180, 
                    width: 180, 
                    height: 30, 
                    type: 'platform',
                    color: '#2196F3'
                });
                break;
                
            case 5:
                platforms.push(
                    {x: 100, y: canvas.height - 150, width: 150, height: 20, type: 'disappearing', timer: 0, visible: true},
                    {x: 300, y: canvas.height - 250, width: 120, height: 20, type: 'disappearing', timer: 0, visible: true},
                    {x: 500, y: canvas.height - 350, width: 100, height: 20, type: 'disappearing', timer: 0, visible: true},
                    {x: 700, y: canvas.height - 200, width: 150, height: 20, type: 'platform'},
                    {x: 900, y: canvas.height - 300, width: 120, height: 20, type: 'disappearing', timer: 0, visible: true},
                    {x: 1100, y: canvas.height - 180, width: 150, height: 20, type: 'platform'}
                );
                break;
                
            case 6:
                platforms.push(
                    {x: 100, y: canvas.height - 150, width: 150, height: 20, type: 'toxic', damage: 1},
                    {x: 300, y: canvas.height - 250, width: 120, height: 20, type: 'platform'},
                    {x: 500, y: canvas.height - 350, width: 100, height: 20, type: 'toxic', damage: 1},
                    {x: 700, y: canvas.height - 200, width: 150, height: 20, type: 'platform'},
                    {x: 900, y: canvas.height - 300, width: 120, height: 20, type: 'toxic', damage: 1},
                    {x: 1100, y: canvas.height - 180, width: 150, height: 20, type: 'platform'},
                    {x: 1300, y: canvas.height - 250, width: 120, height: 20, type: 'toxic', damage: 1}
                );
                break;
                
            case 7:
                platforms.push(
                    {x: 50, y: canvas.height - 100, width: 200, height: 20, type: 'platform'},
                    {x: 300, y: canvas.height - 200, width: 200, height: 20, type: 'platform'},
                    {x: 550, y: canvas.height - 300, width: 200, height: 20, type: 'platform'},
                    {x: 800, y: canvas.height - 400, width: 200, height: 20, type: 'platform'},
                    {x: 1050, y: canvas.height - 300, width: 200, height: 20, type: 'platform'},
                    {x: 1300, y: canvas.height - 200, width: 200, height: 20, type: 'platform'},
                    {x: 1550, y: canvas.height - 100, width: 200, height: 20, type: 'platform'}
                );
                break;
                
            case 8:
                platforms.push(
                    {x: 100, y: canvas.height - 150, width: 150, height: 20, type: 'floating', floatSpeed: 0.5},
                    {x: 350, y: canvas.height - 250, width: 120, height: 20, type: 'floating', floatSpeed: 0.8},
                    {x: 600, y: canvas.height - 350, width: 100, height: 20, type: 'floating', floatSpeed: 0.6},
                    {x: 850, y: canvas.height - 200, width: 150, height: 20, type: 'floating', floatSpeed: 0.7},
                    {x: 1100, y: canvas.height - 280, width: 120, height: 20, type: 'floating', floatSpeed: 0.9},
                    {x: 1350, y: canvas.height - 350, width: 150, height: 20, type: 'floating', floatSpeed: 0.5},
                    {x: 1600, y: canvas.height - 200, width: 120, height: 20, type: 'platform'}
                );
                break;
                
            case 9:
                platforms.push(
                    {x: 0, y: canvas.height - 100, width: 200, height: 20, type: 'lava', damage: 2},
                    {x: 300, y: canvas.height - 200, width: 200, height: 20, type: 'platform'},
                    {x: 600, y: canvas.height - 100, width: 200, height: 20, type: 'lava', damage: 2},
                    {x: 900, y: canvas.height - 300, width: 200, height: 20, type: 'platform'},
                    {x: 1200, y: canvas.height - 200, width: 200, height: 20, type: 'lava', damage: 2},
                    {x: 1500, y: canvas.height - 100, width: 200, height: 20, type: 'platform'},
                    {x: 1800, y: canvas.height - 300, width: 200, height: 20, type: 'lava', damage: 2}
                );
                break;
                
            case 10:
                platforms.push(
                    {x: 0, y: canvas.height - 100, width: 400, height: 20, type: 'platform'},
                    {x: 500, y: canvas.height - 250, width: 200, height: 20, type: 'platform'},
                    {x: 800, y: canvas.height - 100, width: 400, height: 20, type: 'platform'},
                    {x: 1300, y: canvas.height - 250, width: 200, height: 20, type: 'platform'},
                    {x: 1600, y: canvas.height - 100, width: 400, height: 20, type: 'platform'}
                );
                break;
        }
    }
    
    function setupEnemies(level) {
        const config = levelConfigs[level];
        
        for (let i = 0; i < config.enemyCount; i++) {
            const type = config.enemyTypes[Math.floor(Math.random() * config.enemyTypes.length)];
            let enemy;
            
            const baseSpeed = 60 + (level * 10);
            const baseHealth = 1 + Math.floor(level / 3);
            
            switch(type) {
                case 'robot_basic':
                    enemy = createRobot(level, baseSpeed, baseHealth, 'basic');
                    break;
                case 'robot_fast':
                    enemy = createRobot(level, baseSpeed * 1.5, baseHealth, 'fast');
                    break;
                case 'robot_shooter':
                    enemy = createRobot(level, baseSpeed, baseHealth * 2, 'shooter');
                    break;
                case 'robot_strong':
                    enemy = createRobot(level, baseSpeed * 0.8, baseHealth * 3, 'strong');
                    break;
                case 'robot_toxic':
                    enemy = createRobot(level, baseSpeed, baseHealth, 'toxic');
                    break;
                case 'snake':
                    enemy = createSnake(level, baseSpeed * 0.8, baseHealth, 'basic');
                    break;
                case 'snake_venom':
                    enemy = createSnake(level, baseSpeed, baseHealth * 2, 'venom');
                    break;
                case 'spider':
                    enemy = createSpider(level, baseSpeed * 1.2, baseHealth, 'basic');
                    break;
                case 'spider_web':
                    enemy = createSpider(level, baseSpeed, baseHealth, 'web');
                    break;
                case 'bat':
                    enemy = createBat(level, baseSpeed * 1.3, baseHealth);
                    break;
                case 'ghost':
                    enemy = createGhost(level, baseSpeed, baseHealth * 2);
                    break;
                case 'slime':
                    enemy = createSlime(level, baseSpeed * 0.7, baseHealth * 3);
                    break;
                case 'eagle':
                    enemy = createEagle(level, baseSpeed * 1.4, baseHealth);
                    break;
                case 'yeti':
                    enemy = createYeti(level, baseSpeed * 0.6, baseHealth * 4);
                    break;
                case 'wizard':
                    enemy = createWizard(level, baseSpeed * 0.5, baseHealth * 2);
                    break;
                case 'golem':
                    enemy = createGolem(level, baseSpeed * 0.4, baseHealth * 5);
                    break;
                case 'fairy_hostile':
                    enemy = createFairy(level, baseSpeed * 1.5, baseHealth);
                    break;
                case 'fire_dragon':
                    enemy = createDragon(level, baseSpeed * 0.8, baseHealth * 3, 'fire');
                    break;
                case 'lava_slime':
                    enemy = createSlime(level, baseSpeed * 0.5, baseHealth * 4);
                    break;
                case 'phoenix':
                    enemy = createPhoenix(level, baseSpeed * 1.2, baseHealth * 2);
                    break;
                case 'boss_dragon':
                    enemy = createBossDragon(level);
                    break;
                case 'boss_robot':
                    enemy = createBossRobot(level);
                    break;
                case 'boss_wizard':
                    enemy = createBossWizard(level);
                    break;
            }
            
            if (enemy) {
                if (platforms.length > 1) {
                    const platformIndex = Math.floor(Math.random() * (platforms.length - 1)) + 1;
                    const platform = platforms[platformIndex];
                    enemy.x = platform.x + Math.random() * (platform.width - enemy.width);
                    enemy.y = platform.y - enemy.height;
                    enemy.startX = enemy.x;
                }
                
                enemies.push(enemy);
            }
        }
    }
    
    function setupItems(level) {
        items = [];
        
        const itemCount = 4 + Math.floor(level / 2);
        
        for (let i = 0; i < itemCount; i++) {
            let itemType;
            const rand = Math.random();
            
            if (rand < 0.3) itemType = 'coin';
            else if (rand < 0.6) itemType = 'leaf';
            else if (rand < 0.8) itemType = 'boomerang';
            else if (rand < 0.9) itemType = 'shield';
            else itemType = 'star';
            
            if (platforms.length > 1) {
                const platformIndex = Math.floor(Math.random() * (platforms.length - 1)) + 1;
                const platform = platforms[platformIndex];
                
                items.push({
                    x: platform.x + Math.random() * (platform.width - 30),
                    y: platform.y - 40,
                    width: itemType === 'boomerang' ? 30 : 25,
                    height: itemType === 'boomerang' ? 15 : 25,
                    type: itemType,
                    floatOffset: Math.random() * Math.PI * 2,
                    rare: itemType === 'star'
                });
            }
        }
    }
    
    function setupBackground(level) {
        backgroundElements = [];
        const config = levelConfigs[level];
        
        const treeCount = 15 + level * 3;
        for (let i = 0; i < treeCount; i++) {
            const x = (i / treeCount) * platforms[0].width;
            const height = 60 + Math.random() * 80;
            const type = Math.random() > 0.7 ? 'big' : 'small';
            
            backgroundElements.push({
                type: 'tree',
                x: x,
                y: canvas.height - 40,
                width: type === 'big' ? 40 : 25,
                height: height,
                layer: Math.random() > 0.5 ? 'back' : 'front',
                color: config.theme === 'night' ? '#2F4F4F' : 
                       config.theme === 'toxic' ? '#556B2F' : '#228B22'
            });
        }
        
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * platforms[0].width;
            backgroundElements.push({
                type: 'bush',
                x: x,
                y: canvas.height - 40,
                width: 30 + Math.random() * 25,
                height: 15 + Math.random() * 20,
                layer: 'front'
            });
        }
        
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * platforms[0].width;
            backgroundElements.push({
                type: 'log',
                x: x,
                y: canvas.height - 40,
                width: 20 + Math.random() * 15,
                height: 40 + Math.random() * 60,
                layer: 'front'
            });
        }
        
        if (config.theme === 'day' || config.theme === 'mountain') {
            for (let i = 0; i < 5; i++) {
                backgroundElements.push({
                    type: 'cloud',
                    x: Math.random() * platforms[0].width,
                    y: 50 + Math.random() * 100,
                    width: 80 + Math.random() * 60,
                    height: 30 + Math.random() * 20,
                    layer: 'back',
                    speed: 0.1 + Math.random() * 0.2
                });
            }
        }
        
        if (config.theme === 'night' || config.theme === 'magic') {
            for (let i = 0; i < 30; i++) {
                backgroundElements.push({
                    type: 'star',
                    x: Math.random() * platforms[0].width,
                    y: Math.random() * 200,
                    size: 1 + Math.random() * 3,
                    layer: 'back',
                    twinkle: Math.random()
                });
            }
        }
        
        if (config.theme === 'mountain') {
            for (let i = 0; i < 3; i++) {
                backgroundElements.push({
                    type: 'mountain',
                    x: (i / 3) * platforms[0].width,
                    y: canvas.height - 100,
                    width: 300,
                    height: 150 + Math.random() * 100,
                    layer: 'back',
                    color: '#696969'
                });
            }
        }
    }
    
    function setupFlag(level) {
        let flagPlatform;
        
        if (level === 4) {
            for (let i = platforms.length - 1; i >= 0; i--) {
                const platform = platforms[i];
                if (platform.type !== 'moving' && 
                    platform.type !== 'ground' && 
                    platform.width >= 120) {
                    flagPlatform = platform;
                    break;
                }
            }
            
            if (!flagPlatform) {
                flagPlatform = platforms[platforms.length - 1];
            }
            
            flag.x = flagPlatform.x + flagPlatform.width/2 - 15;
            flag.y = flagPlatform.y - 60;
        } else {
            const lastPlatform = platforms[platforms.length - 1];
            flag.x = lastPlatform.x + lastPlatform.width - 50;
            flag.y = lastPlatform.y - 50;
        }
        
        flag.collected = false;
    }
    
    function resetPlayer() {
        player.x = 50;
        player.y = canvas.height - 100;
        player.velocityX = 0;
        player.velocityY = 0;
        player.isJumping = false;
        player.onGround = false;
        player.justLanded = false;
        player.hasBoomerang = false;
        player.hasShield = false;
        player.invincible = false;
        player.invincibleTimer = 0;
        player.doubleJumpUsed = false;
        player.jumpBuffer = 0;
        player.coyoteTime = player.coyoteTimeMax;
        player.jumpRequested = false;
        player.attackCooldown = 0;
        player.canAttack = true;
        player.comboCount = 0;
        player.lastAttackTime = 0;
        player.isAttacking = false;
        player.attackTimer = 0;
        player.currentAttackType = 'basic';
        player.attackElement = null;
        player.isPoisoned = false;
        player.poisonTimer = 0;
        player.isSlowed = false;
        player.slowTimer = 0;
        player.isBurning = false;
        player.burnTimer = 0;
        player.lastPlatformDamage = 0;
        
        player.jumpBoosterActive = false;
        player.jumpBoosterTimer = 0;
        player.jumpPower = player.originalJumpPower;
        player.hasJumpBooster = false;
        
        console.log(`🚀 Player reset. Jump booster charges this life: ${player.jumpBoosterChargesThisLife}/${player.jumpBoosterMaxCharges}`);
    }
    
    // ========== ENEMY CREATION FUNCTIONS ==========
    function createRobot(level, speed, health, type) {
        return {
            x: 0, y: 0,
            width: 40, height: 40,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'robot',
            subtype: type,
            health: health,
            maxHealth: health,
            attackRange: 150 + (level * 10),
            attackCooldown: 0,
            lastAttack: 0,
            chasing: false,
            patrolRange: 200,
            color: type === 'toxic' ? '#32CD32' : 
                   type === 'shooter' ? '#4169E1' : '#8B0000',
            armorType: 'metal',
            damageMultiplier: 1.0,
            weakAgainst: 'electric',
            resistantTo: 'physical',
            baseDamage: 1,
            attackType: 'melee',
            experienceValue: 100
        };
    }
    
    function createSnake(level, speed, health, type) {
        return {
            x: 0, y: 0,
            width: 40, height: 20,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'snake',
            subtype: type,
            health: health,
            maxHealth: health,
            attackRange: 100,
            attackCooldown: 0,
            lastAttack: 0,
            chasing: false,
            venomous: type === 'venom',
            color: type === 'venom' ? '#006400' : '#228B22',
            armorType: 'leather',
            damageMultiplier: 1.2,
            weakAgainst: 'fire',
            resistantTo: 'poison',
            baseDamage: type === 'venom' ? 2 : 1,
            attackType: 'poison',
            experienceValue: 80
        };
    }
    
    function createSpider(level, speed, health, type) {
        return {
            x: 0, y: 0,
            width: 30, height: 30,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'spider',
            subtype: type,
            health: health,
            maxHealth: health,
            attackRange: 120,
            attackCooldown: 0,
            lastAttack: 0,
            chasing: false,
            webShooter: type === 'web',
            color: type === 'web' ? '#4B0082' : '#8B0000',
            armorType: 'exoskeleton',
            damageMultiplier: 0.8,
            weakAgainst: 'crush',
            resistantTo: 'pierce',
            baseDamage: 1,
            webSlowEffect: type === 'web',
            experienceValue: 90
        };
    }
    
    function createBat(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 30, height: 20,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'bat',
            health: health,
            maxHealth: health,
            attackRange: 100,
            attackCooldown: 0,
            lastAttack: 0,
            flying: true,
            amplitude: 50 + (level * 5),
            frequency: 2,
            startY: 0,
            color: '#4B0082',
            armorType: 'flesh',
            damageMultiplier: 1.5,
            weakAgainst: 'fire',
            resistantTo: 'none',
            baseDamage: 1,
            canDrainLife: true,
            experienceValue: 60
        };
    }
    
    function createGhost(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 35, height: 50,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'ghost',
            health: health,
            maxHealth: health,
            attackRange: 130,
            attackCooldown: 0,
            lastAttack: 0,
            phaseThrough: true,
            transparency: 0.7,
            color: '#E6E6FA',
            armorType: 'ethereal',
            damageMultiplier: 0.5,
            weakAgainst: 'holy',
            resistantTo: 'physical',
            baseDamage: 1,
            canPassThroughWalls: true,
            experienceValue: 120
        };
    }
    
    function createSlime(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 45, height: 30,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'slime',
            health: health,
            maxHealth: health,
            attackRange: 80,
            attackCooldown: 0,
            lastAttack: 0,
            splits: true,
            jumpTimer: 0,
            color: level >= 9 ? '#FF4500' : '#32CD32',
            armorType: 'gel',
            damageMultiplier: 0.7,
            weakAgainst: 'ice',
            resistantTo: 'poison',
            baseDamage: level >= 9 ? 2 : 1,
            canSplit: true,
            splitHealth: Math.floor(health / 2),
            experienceValue: 80
        };
    }
    
    function createEagle(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 50, height: 40,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'eagle',
            health: health,
            maxHealth: health,
            attackRange: 200,
            attackCooldown: 0,
            lastAttack: 0,
            flying: true,
            diveAttack: true,
            color: '#8B4513',
            armorType: 'feather',
            damageMultiplier: 1.3,
            weakAgainst: 'pierce',
            resistantTo: 'none',
            baseDamage: 2,
            diveDamage: 3,
            experienceValue: 110
        };
    }
    
    function createYeti(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 60, height: 80,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'yeti',
            health: health,
            maxHealth: health,
            attackRange: 120,
            attackCooldown: 0,
            lastAttack: 0,
            throwSnowball: true,
            color: '#F0F8FF',
            armorType: 'fur',
            damageMultiplier: 0.6,
            weakAgainst: 'fire',
            resistantTo: 'ice',
            baseDamage: 2,
            snowballSlowEffect: true,
            experienceValue: 200
        };
    }
    
    function createWizard(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 35, height: 60,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'wizard',
            health: health,
            maxHealth: health,
            attackRange: 250,
            attackCooldown: 0,
            lastAttack: 0,
            spellCaster: true,
            spellTypes: ['fire', 'ice', 'lightning'],
            color: '#9370DB',
            armorType: 'cloth',
            damageMultiplier: 1.4,
            weakAgainst: 'physical',
            resistantTo: 'magic',
            baseDamage: 1,
            spellDamage: 2,
            experienceValue: 150
        };
    }
    
    function createGolem(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 70, height: 90,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'golem',
            health: health,
            maxHealth: health,
            attackRange: 100,
            attackCooldown: 0,
            lastAttack: 0,
            throwsRocks: true,
            color: '#696969',
            armorType: 'stone',
            damageMultiplier: 0.4,
            weakAgainst: 'magic',
            resistantTo: 'physical',
            baseDamage: 3,
            rockDamage: 2,
            experienceValue: 180
        };
    }
    
    function createFairy(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 25, height: 25,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'fairy',
            health: health,
            maxHealth: health,
            attackRange: 150,
            attackCooldown: 0,
            lastAttack: 0,
            flying: true,
            magicDust: true,
            color: '#FF69B4',
            armorType: 'magic',
            damageMultiplier: 1.6,
            weakAgainst: 'iron',
            resistantTo: 'magic',
            baseDamage: 1,
            magicDustEffect: true,
            experienceValue: 90
        };
    }
    
    function createDragon(level, speed, health, element) {
        return {
            x: 0, y: 0,
            width: 80, height: 60,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'dragon',
            element: element,
            health: health,
            maxHealth: health,
            attackRange: 200,
            attackCooldown: 0,
            lastAttack: 0,
            flying: true,
            breathAttack: true,
            color: element === 'fire' ? '#FF4500' : '#1E90FF',
            armorType: 'scale',
            damageMultiplier: 0.3,
            weakAgainst: element === 'fire' ? 'ice' : 'fire',
            resistantTo: element,
            baseDamage: 3,
            breathDamage: 4,
            experienceValue: 250
        };
    }
    
    function createPhoenix(level, speed, health) {
        return {
            x: 0, y: 0,
            width: 60, height: 50,
            speed: speed,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: 'phoenix',
            health: health,
            maxHealth: health,
            attackRange: 180,
            attackCooldown: 0,
            lastAttack: 0,
            flying: true,
            rebirth: true,
            color: '#FF8C00',
            armorType: 'fire',
            damageMultiplier: 0.8,
            weakAgainst: 'ice',
            resistantTo: 'fire',
            baseDamage: 2,
            rebirthHealth: Math.floor(health / 2),
            experienceValue: 200
        };
    }
    
    function createBossDragon(level) {
        return {
            x: canvas.width / 2 - 100,
            y: 100,
            width: 150,
            height: 120,
            speed: 100,
            direction: 1,
            type: 'boss_dragon',
            health: 50,
            maxHealth: 50,
            attackRange: 300,
            attackCooldown: 0,
            phase: 1,
            attacks: ['fire_breath', 'wing_slam', 'tail_whip'],
            color: '#8B0000',
            isBoss: true,
            armorType: 'dragon_scale',
            damageMultiplier: 0.2,
            weakAgainst: 'ice',
            resistantTo: ['fire', 'physical'],
            baseDamage: 5,
            phaseDamage: [3, 4, 5],
            elementalWeakness: 'ice',
            experienceValue: 1000
        };
    }
    
    function createBossRobot(level) {
        return {
            x: canvas.width / 2 - 75,
            y: canvas.height - 200,
            width: 120,
            height: 120,
            speed: 80,
            direction: 1,
            type: 'boss_robot',
            health: 60,
            maxHealth: 60,
            attackRange: 250,
            attackCooldown: 0,
            phase: 1,
            attacks: ['laser_beam', 'missile_barrage', 'shockwave'],
            color: '#2F4F4F',
            isBoss: true,
            armorType: 'titanium',
            damageMultiplier: 0.25,
            weakAgainst: 'electric',
            resistantTo: ['physical', 'poison'],
            baseDamage: 4,
            phaseDamage: [3, 4, 5],
            specialWeakness: 'circuit_break',
            experienceValue: 1200
        };
    }
    
    function createBossWizard(level) {
        return {
            x: canvas.width / 2 - 50,
            y: 150,
            width: 80,
            height: 100,
            speed: 60,
            direction: 1,
            type: 'boss_wizard',
            health: 40,
            maxHealth: 40,
            attackRange: 280,
            attackCooldown: 0,
            phase: 1,
            attacks: ['meteor_shower', 'lightning_storm', 'summon_minions'],
            color: '#4B0082',
            isBoss: true,
            armorType: 'arcane',
            damageMultiplier: 0.3,
            weakAgainst: 'silence',
            resistantTo: ['magic', 'fire', 'ice'],
            baseDamage: 3,
            phaseDamage: [2, 3, 4],
            magicBarrier: true,
            experienceValue: 800
        };
    }
    
    // ========== DAMAGE CALCULATION SYSTEM ==========
    function calculateDamageToEnemy(baseDamage, enemy, attackType = 'physical', attackElement = null) {
        let finalDamage = baseDamage;
        
        finalDamage *= enemy.damageMultiplier || 1.0;
        
        if (attackElement && enemy.weakAgainst) {
            if (Array.isArray(enemy.weakAgainst)) {
                if (enemy.weakAgainst.includes(attackElement)) {
                    finalDamage *= 2.0;
                    console.log(`⚡ CRITICAL! ${attackElement} is super effective against ${enemy.type}!`);
                }
            } else if (enemy.weakAgainst === attackElement) {
                finalDamage *= 2.0;
                console.log(`⚡ CRITICAL! ${attackElement} is super effective against ${enemy.type}!`);
            }
        }
        
        if (attackElement && enemy.resistantTo) {
            if (Array.isArray(enemy.resistantTo)) {
                if (enemy.resistantTo.includes(attackElement)) {
                    finalDamage *= 0.5;
                    console.log(`🛡️ RESISTED! ${enemy.type} resists ${attackElement} damage!`);
                }
            } else if (enemy.resistantTo === attackElement) {
                finalDamage *= 0.5;
                console.log(`🛡️ RESISTED! ${enemy.type} resists ${attackElement} damage!`);
            }
        }
        
        switch(enemy.type) {
            case 'ghost':
                if (attackType === 'physical') {
                    finalDamage *= 0.3;
                }
                if (attackType === 'holy' || attackElement === 'holy') {
                    finalDamage *= 3.0;
                }
                break;
                
            case 'golem':
                if (attackType === 'physical') {
                    finalDamage *= 0.4;
                }
                if (attackType === 'magic' || attackElement === 'magic') {
                    finalDamage *= 1.5;
                }
                break;
                
            case 'slime':
                if (attackElement === 'ice') {
                    finalDamage *= 2.5;
                    enemy.speed *= 0.5;
                }
                break;
                
            case 'robot':
                if (attackElement === 'electric') {
                    finalDamage *= 2.0;
                    enemy.speed *= 0.7;
                }
                break;
                
            case 'boss_dragon':
                if (enemy.phase === 1) {
                    finalDamage *= 1.0;
                } else if (enemy.phase === 2) {
                    finalDamage *= 0.7;
                } else if (enemy.phase === 3) {
                    finalDamage *= 0.5;
                }
                break;
        }
        
        if (player.comboCount >= 3) {
            finalDamage *= 1.5;
        }
        
        finalDamage = Math.max(1, Math.round(finalDamage));
        
        return finalDamage;
    }
    
    function calculateDamageToPlayer(enemy) {
        let damage = enemy.baseDamage || 1;
        
        if (player.hasShield) {
            damage *= 0.5;
        }
        
        if (player.invincible) {
            damage = 0;
        }
        
        switch(enemy.type) {
            case 'snake':
                if (enemy.venomous) {
                    damage += 1;
                }
                break;
                
            case 'spider':
                if (enemy.webShooter) {
                    player.isSlowed = true;
                    player.slowTimer = 3;
                }
                break;
                
            case 'bat':
                if (enemy.canDrainLife) {
                    enemy.health = Math.min(enemy.maxHealth, enemy.health + 1);
                }
                break;
                
            case 'boss_dragon':
                if (enemy.phase === 1) damage = 2;
                else if (enemy.phase === 2) damage = 3;
                else damage = 4;
                break;
        }
        
        damage += Math.floor(gameState.currentLevel / 3);
        
        return Math.max(1, damage);
    }
    
    // ========== ATTACK FUNCTIONS ==========
    function performMeleeAttack() {
        if (!gameState.running || gameState.paused) return;
        if (!player.canAttack) return;
        
        console.log("👊 Melee attack performed!");
        
        let attackType = 'basic';
        if (player.comboCount === 2) attackType = 'combo1';
        if (player.comboCount >= 3) attackType = 'combo2';
        
        player.currentAttackType = attackType;
        
        player.isAttacking = true;
        player.attackTimer = player.attackDuration;
        player.canAttack = false;
        player.attackCooldown = player.attackCooldownTime;
        player.lastAttackTime = Date.now() / 1000;
        
        player.comboCount++;
        if (player.comboCount > 3) player.comboCount = 3;
        
        const attackInfo = player.attackTypes[attackType];
        let baseDamage = attackInfo.damage;
        
        let attackElement = player.attackElement;
        
        let particleColor = attackInfo.color;
        if (attackElement === 'fire') particleColor = '#FF0000';
        if (attackElement === 'ice') particleColor = '#00FFFF';
        if (attackElement === 'electric') particleColor = '#FFFF00';
        
        createParticles(
            player.x + (player.facingRight ? player.width : 0), 
            player.y + player.height/2, 
            15 + player.comboCount * 5, 
            particleColor
        );
        
        const attackRange = 50 + player.comboCount * 10;
        const attackWidth = 40 + player.comboCount * 5;
        const attackHeight = 30;
        
        const attackX = player.facingRight ? 
            player.x + player.width : 
            player.x - attackWidth;
        const attackY = player.y + player.height/2 - attackHeight/2;
        
        let hitCount = 0;
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            if (attackX < enemy.x + enemy.width &&
                attackX + attackWidth > enemy.x &&
                attackY < enemy.y + enemy.height &&
                attackY + attackHeight > enemy.y) {
                
                hitCount++;
                
                const finalDamage = calculateDamageToEnemy(
                    baseDamage, 
                    enemy, 
                    attackInfo.type, 
                    attackElement
                );
                
                console.log(`💥 Hit ${enemy.type}! Base: ${baseDamage}, Final: ${finalDamage}, Combo: ${player.comboCount}`);
                
                enemy.health -= finalDamage;
                
                let hitColor = '#FF0000';
                if (finalDamage > baseDamage * 1.5) {
                    hitColor = '#FFFF00';
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, '#FFFF00');
                } else if (finalDamage < baseDamage * 0.7) {
                    hitColor = '#888888';
                }
                
                createParticles(
                    enemy.x + enemy.width/2, 
                    enemy.y + enemy.height/2, 
                    8 + Math.floor(finalDamage), 
                    hitColor
                );
                
                const scoreMultiplier = player.comboCount;
                const damageScore = finalDamage * 10 * scoreMultiplier;
                gameState.score += damageScore;
                
                applyEnemyHitEffects(enemy, attackInfo.type, attackElement);
                
                if (enemy.health <= 0) {
                    const defeatScore = calculateDefeatScore(enemy, player.comboCount);
                    gameState.score += defeatScore;
                    
                    applyEnemyDefeatEffects(enemy);
                    
                    enemies.splice(i, 1);
                    
                    createParticles(
                        enemy.x + enemy.width/2, 
                        enemy.y + enemy.height/2, 
                        20 + player.comboCount * 5, 
                        '#FF4500'
                    );
                    
                    dropItemFromEnemy(enemy);
                    
                    console.log(`🎯 ${enemy.type} defeated! Score: +${defeatScore}`);
                } else {
                    const knockbackPower = attackInfo.knockback;
                    const knockbackDirection = player.facingRight ? 1 : -1;
                    enemy.x += knockbackDirection * knockbackPower;
                    
                    createParticles(
                        enemy.x + enemy.width/2, 
                        enemy.y + enemy.height/2, 
                        5, 
                        '#FF6347'
                    );
                }
                
                updateGameStats();
            }
        }
        
        if (hitCount === 0 && player.comboCount > 1) {
            setTimeout(() => {
                if (Date.now() / 1000 - player.lastAttackTime > 1) {
                    player.comboCount = 0;
                    console.log("🔄 Combo reset (no hits)");
                }
            }, 1000);
        }
        
        if (player.comboCount > 1) {
            setTimeout(() => {
                createParticles(
                    player.x + player.width/2,
                    player.y - 30,
                    5,
                    '#FFFFFF'
                );
            }, 100);
        }
    }
    
    function applyEnemyHitEffects(enemy, attackType, attackElement) {
        switch(enemy.type) {
            case 'slime':
                if (attackElement === 'ice') {
                    enemy.speed *= 0.5;
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 10, '#00FFFF');
                }
                break;
                
            case 'robot':
                if (attackElement === 'electric') {
                    enemy.speed = 0;
                    enemy.attackCooldown = 2.0;
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 15, '#FFFF00');
                }
                break;
                
            case 'ghost':
                if (attackElement === 'holy') {
                    enemy.transparency = 1.0;
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, '#FFFFFF');
                }
                break;
                
            case 'spider':
                if (attackType === 'crush') {
                    enemy.damageMultiplier *= 1.5;
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 12, '#8B0000');
                }
                break;
        }
    }
    
    function applyEnemyDefeatEffects(enemy) {
        switch(enemy.type) {
            case 'slime':
                if (enemy.canSplit && enemy.health > 0) {
                    const newHealth = enemy.splitHealth || Math.floor(enemy.maxHealth / 2);
                    if (newHealth > 0) {
                        for (let i = 0; i < 2; i++) {
                            const babySlime = createSlime(gameState.currentLevel, 
                                enemy.speed * 1.2, newHealth);
                            babySlime.x = enemy.x + (i * 20);
                            babySlime.y = enemy.y;
                            babySlime.width = enemy.width * 0.7;
                            babySlime.height = enemy.height * 0.7;
                            babySlime.canSplit = false;
                            enemies.push(babySlime);
                        }
                        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 30, '#32CD32');
                    }
                }
                break;
                
            case 'phoenix':
                if (enemy.rebirth) {
                    setTimeout(() => {
                        const rebornPhoenix = createPhoenix(gameState.currentLevel,
                            enemy.speed, enemy.rebirthHealth || Math.floor(enemy.maxHealth / 2));
                        rebornPhoenix.x = enemy.x;
                        rebornPhoenix.y = enemy.y;
                        rebornPhoenix.rebirth = false;
                        enemies.push(rebornPhoenix);
                        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 40, '#FF8C00');
                    }, 1000);
                }
                break;
                
            case 'boss_dragon':
                if (enemy.phase < 3) {
                    enemy.phase++;
                    enemy.health = enemy.maxHealth * 0.5;
                    enemy.speed *= 1.2;
                    enemy.baseDamage += 1;
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 50, '#FF0000');
                    console.log(`🔥 BOSS PHASE ${enemy.phase} ACTIVATED!`);
                }
                break;
        }
    }
    
    function calculateDefeatScore(enemy, combo) {
        let baseScore = enemy.experienceValue || 100;
        
        const comboMultiplier = 1 + (combo * 0.5);
        
        const levelMultiplier = 1 + (gameState.currentLevel * 0.1);
        
        return Math.floor(baseScore * comboMultiplier * levelMultiplier);
    }
    
    function dropItemFromEnemy(enemy) {
        const dropChance = Math.random();
        
        if (dropChance < 0.3) {
            let itemType = 'coin';
            
            switch(enemy.type) {
                case 'wizard':
                case 'fairy':
                    itemType = Math.random() < 0.5 ? 'star' : 'boomerang';
                    break;
                    
                case 'golem':
                case 'yeti':
                    itemType = Math.random() < 0.7 ? 'shield' : 'coin';
                    break;
                    
                case 'boss_dragon':
                case 'boss_robot':
                case 'boss_wizard':
                    itemType = 'star';
                    break;
                    
                case 'ghost':
                    itemType = Math.random() < 0.4 ? 'boomerang' : 'coin';
                    break;
                    
                default:
                    itemType = Math.random() < 0.2 ? 'leaf' : 'coin';
            }
            
            items.push({
                x: enemy.x,
                y: enemy.y,
                width: 25,
                height: 25,
                type: itemType,
                floatOffset: Math.random() * Math.PI * 2
            });
            
            console.log(`🎁 ${enemy.type} dropped ${itemType}!`);
        }
    }
    
    function throwBoomerang() {
        if (!player.hasBoomerang || !player.canAttack) return;
        
        player.hasBoomerang = false;
        player.canAttack = false;
        player.attackCooldown = player.attackCooldownTime;
        
        projectiles.push({
            x: player.x + (player.facingRight ? player.width : -20),
            y: player.y + player.height/2,
            width: 30,
            height: 15,
            velocityX: player.facingRight ? 400 : -400,
            velocityY: 0,
            color: '#4169E1',
            type: 'boomerang',
            lifeTime: 2,
            damage: 2,
            attackType: 'pierce',
            attackElement: player.attackElement
        });
    }
    
    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        console.log("🔧 Setting up event listeners...");

        setupMobileControls();
        
        document.addEventListener('keydown', function(e) {
            console.log("⌨️ Key pressed:", e.key);
            
            if (e.key === 'Control') {
                keys['Control'] = true;
            }
            
            // ========== JUMP BOOSTER: Ctrl + B ==========
            if (keys['Control'] && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                if (gameState.running && !gameState.paused) {
                    console.log("🚀 JUMP BOOSTER: Attempting to activate...");
                    const success = player.useJumpBooster();
                    
                    if (success) {
                        console.log("🚀 JUMP BOOSTER: Activated via Ctrl+B!");
                        
                        createParticles(player.x + player.width/2, player.y + player.height/2, 
                                       30, '#00FFFF');
                        createParticles(player.x + player.width/2, player.y + player.height/2, 
                                       20, '#FF00FF');
                        
                        if (player.onGround) {
                            player.velocityY = -player.jumpBoosterPower;
                            player.isJumping = true;
                            player.onGround = false;
                            player.doubleJumpUsed = false;
                            
                            createParticles(player.x + player.width/2, player.y + player.height/2, 
                                           40, '#00FFFF');
                            console.log("🚀 SUPER JUMP BOOSTER ACTIVATED!");
                        }
                    } else {
                        console.log("⚠️ JUMP BOOSTER: Cannot activate (no charges or already active)");
                    }
                }
                return;
            }
            
            // ========== JUMP BOOSTER: Single B key ==========
            if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                if (gameState.running && !gameState.paused) {
                    console.log("🚀 JUMP BOOSTER (B key): Attempting to activate...");
                    const success = player.useJumpBooster();
                    
                    if (success) {
                        console.log("🚀 JUMP BOOSTER: Activated via B key!");
                        
                        createParticles(player.x + player.width/2, player.y + player.height/2, 
                                       25, '#00FFFF');
                        
                        showJumpBoosterNotification(`Jump Booster Activated! (${player.jumpBoosterChargesThisLife} left for this life)`);
                    } else {
                        console.log("⚠️ JUMP BOOSTER: No charges available or already active");
                        showJumpBoosterNotification("No boosters left for this life!", true);
                    }
                }
                return;
            }
            
            if (keys['Control'] && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                console.log("🚀 CHEAT ACTIVATED: Skip to next level!");
                skipToNextLevel();
                return;
            }
            
            if (keys['Control'] && (e.key === 'g' || e.key === 'G')) {
                e.preventDefault();
                toggleGodMode();
                return;
            }
            
            if (keys['Control'] && (e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
                unlockAllLevels();
                return;
            }
            
            if (keys['Control'] && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                addCheatScore();
                return;
            }
            
            if (keys['Control'] && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                activateSpeedBoost();
                return;
            }
            
            if (keys['Control'] && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                debugPlatformCollisions();
                return;
            }
            
            const gameKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'x', 'X', 'z', 'Z'];
            if (gameKeys.includes(e.key)) {
                e.preventDefault();
            }
            
            keys[e.key] = true;
            
            if (e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'ArrowUp') {
                if (gameState.running && !gameState.paused) {
                    console.log("🦘 Jump key pressed (Space/ArrowUp/X)");
                    player.jumpRequested = true;
                    player.jumpBuffer = player.jumpBufferTime;
                    
                    if (player.onGround) {
                        const currentJumpPower = player.jumpBoosterActive ? player.jumpBoosterPower : player.jumpPower;
                        player.velocityY = -currentJumpPower;
                        player.isJumping = true;
                        player.onGround = false;
                        player.doubleJumpUsed = false;
                        
                        if (player.jumpBoosterActive) {
                            createParticles(player.x + player.width/2, player.y + player.height/2, 
                                           25, '#00FFFF');
                            console.log("🚀 Jump with booster!");
                        } else {
                            console.log("🦘 Normal jump!");
                        }
                    }
                }
            }
            
            if (e.key === 'z' || e.key === 'Z') {
                if (gameState.running && !gameState.paused) {
                    console.log("👊 Attack key pressed (Z)");
                    if (player.hasBoomerang) {
                        throwBoomerang();
                        console.log("🌀 Boomerang thrown!");
                    } else {
                        performMeleeAttack();
                        console.log("👊 Melee attack!");
                    }
                }
            }
            
            if (keys['Control'] && (e.key === '1')) {
                player.attackElement = 'fire';
                player.hasElementalAttack = true;
                console.log("🔥 Fire attack enabled!");
            }
            if (keys['Control'] && (e.key === '2')) {
                player.attackElement = 'ice';
                player.hasElementalAttack = true;
                console.log("❄️ Ice attack enabled!");
            }
            if (keys['Control'] && (e.key === '3')) {
                player.attackElement = 'electric';
                player.hasElementalAttack = true;
                console.log("⚡ Electric attack enabled!");
            }
            
            if (e.key === 'Escape') {
                togglePause();
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', function(e) {
            if (e.key === 'Control') {
                keys['Control'] = false;
            }
            
            keys[e.key] = false;
            
            if (e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'ArrowUp') {
                player.jumpRequested = false;
                if (player.velocityY < -100) {
                    player.velocityY *= player.jumpCutMultiplier;
                }
            }
        });
        
        const startBtn = document.getElementById('startBtn');
        console.log("🔧 Start button element:", startBtn);
        
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                console.log("🖱️ ===== START BUTTON CLICKED =====");
                
                if (!gameState.gameStarted) {
                    console.log("🚀 Starting NEW game");
                    startGame();
                } else if (gameState.gameOver || gameState.win) {
                    console.log("🔄 RESTARTING game");
                    restartGame();
                } else if (!gameState.running) {
                    console.log("▶️ RESUMING game");
                    resumeGame();
                } else {
                    console.log("⚠️ Button clicked but no action taken");
                }
            });
        } else {
            console.error("❌ CRITICAL ERROR: Start button not found!");
            alert("Error: Tombol 'Mulai Game' tidak ditemukan!");
        }
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', togglePause);
        }
        
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', restartGame);
        }
        
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', toggleSound);
        }
        
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', function() {
                console.log("➡️ Next level button clicked");
                if (gameState.currentLevel < gameState.maxLevel && 
                    gameState.currentLevel + 1 <= gameState.unlockedLevel) {
                    
                    const currentBoosterCharges = player.jumpBoosterChargesThisLife;
                    console.log(`🚀 Carrying over ${currentBoosterCharges} jump booster charges to next level`);
                    
                    setupLevel(gameState.currentLevel + 1);
                    
                    player.jumpBoosterChargesThisLife = currentBoosterCharges;
                    player.jumpBoosterCharges = currentBoosterCharges;
                    
                    startGame();
                    hideNextLevelButton();
                    
                    console.log(`🚀 Jump booster after level change: ${player.jumpBoosterChargesThisLife} charges`);
                }
            });
        }
        
        // Tombol Menu Utama
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', function() {
                console.log("🏠 Menu Utama button clicked");
                returnToMainMenu();
            });
        }
        
        // Tombol Booster Desktop
        const useBoosterBtn = document.getElementById('useBoosterBtn');
        if (useBoosterBtn) {
            useBoosterBtn.addEventListener('click', function() {
                if (gameState.running && !gameState.paused) {
                    console.log("🚀 Desktop: Jump Booster button clicked");
                    const success = player.useJumpBooster();
                    
                    if (success) {
                        console.log("🚀 Desktop: Jump Booster activated!");
                        showJumpBoosterNotification(`Jump Booster! (${player.jumpBoosterChargesThisLife} left for this life)`);
                        
                        if (player.onGround) {
                            player.velocityY = -player.jumpBoosterPower;
                            player.isJumping = true;
                            player.onGround = false;
                            player.doubleJumpUsed = false;
                            
                            createParticles(player.x + player.width/2, player.y + player.height/2, 
                                           35, '#00FFFF');
                            console.log("🚀 SUPER JUMP BOOSTER ACTIVATED!");
                        }
                    } else {
                        console.log("⚠️ Desktop: Cannot activate jump booster");
                        showJumpBoosterNotification("No boosters left for this life!", true);
                    }
                }
            });
        }
        
        // Tombol Fullscreen
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        
        // Tombol toggle auto-progress
        const toggleAutoProgressBtn = document.getElementById('toggleAutoProgressBtn');
        if (toggleAutoProgressBtn) {
            toggleAutoProgressBtn.addEventListener('click', function() {
                gameState.autoProgress = !gameState.autoProgress;
                this.innerHTML = gameState.autoProgress ? 
                    '<i class="fas fa-forward"></i> Auto Progress: ON' : 
                    '<i class="fas fa-pause"></i> Auto Progress: OFF';
                console.log(`➡️ Auto Progress: ${gameState.autoProgress ? 'ON' : 'OFF'}`);
                showJumpBoosterNotification(`Auto Progress ${gameState.autoProgress ? 'diaktifkan' : 'dimatikan'}`);
            });
        }
        
        updateLevelButtons();
        
        window.addEventListener('blur', function() {
            if (gameState.running && !gameState.paused) {
                gameState.paused = true;
                const pauseBtn = document.getElementById('pauseBtn');
                if (pauseBtn) {
                    pauseBtn.innerHTML = '<i class="fas fa-play"></i> Lanjut';
                }
            }
        });
        
        window.addEventListener('focus', function() {
            if (gameState.paused) {
                const pauseBtn = document.getElementById('pauseBtn');
                if (pauseBtn) {
                    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda';
                }
            }
        });
        
        // Fullscreen change listener
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        console.log("✅ Event listeners setup complete!");
    }
    
    // ========== MOBILE CONTROLS SETUP ==========
    function setupMobileControls() {
        console.log("📱 Setting up mobile controls...");
        
        const modeAnalogBtn = document.getElementById('modeAnalog');
        const modeDPadBtn = document.getElementById('modeDPad');
        const analogControls = document.getElementById('analogControls');
        const dpadControls = document.getElementById('dpadControls');
        
        if (modeAnalogBtn && modeDPadBtn) {
            modeAnalogBtn.addEventListener('click', function(e) {
                e.preventDefault();
                mobileControlState.mode = 'analog';
                modeAnalogBtn.classList.add('active');
                modeDPadBtn.classList.remove('active');
                analogControls.style.display = 'flex';
                dpadControls.style.display = 'none';
                resetMobileInputs();
                console.log("🕹️ Switched to Analog mode");
            });
            
            modeDPadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                mobileControlState.mode = 'dpad';
                modeDPadBtn.classList.add('active');
                modeAnalogBtn.classList.remove('active');
                analogControls.style.display = 'none';
                dpadControls.style.display = 'flex';
                resetMobileInputs();
                console.log("🎮 Switched to D-Pad mode");
            });
        }
        
        setupAnalogStick();
        
        setupDPadButtons();
        
        setupActionButtons();
        
        console.log("✅ Mobile controls setup complete!");
    }
    
    function setupAnalogStick() {
        const analogKnob = document.getElementById('analogKnob');
        const analogBase = document.querySelector('.analog-base');
        
        if (!analogKnob || !analogBase) {
            console.error("❌ Analog stick elements not found!");
            return;
        }
        
        analogKnob.addEventListener('touchstart', function(e) {
            e.preventDefault();
            mobileControlState.isDragging = true;
            mobileControlState.touchId = e.touches[0].identifier;
            analogKnob.classList.add('active');
        });
        
        document.addEventListener('touchmove', function(e) {
            if (!mobileControlState.isDragging || mobileControlState.mode !== 'analog') return;
            
            e.preventDefault();
            
            let touch = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === mobileControlState.touchId) {
                    touch = e.touches[i];
                    break;
                }
            }
            if (!touch) return;
            
            const rect = analogBase.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const maxDistance = rect.width / 2 - 30;
            
            let deltaX = touch.clientX - centerX;
            let deltaY = touch.clientY - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }
            
            analogKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            mobileControlState.analogX = deltaX / maxDistance;
            mobileControlState.analogY = deltaY / maxDistance;
            mobileControlState.analogPower = Math.min(1, distance / maxDistance);
            
            updateMovementFromAnalog();
        }, { passive: false });
        
        document.addEventListener('touchend', function(e) {
            if (!mobileControlState.isDragging) return;
            
            e.preventDefault();
            mobileControlState.isDragging = false;
            mobileControlState.touchId = null;
            analogKnob.classList.remove('active');
            analogKnob.style.transform = 'translate(0px, 0px)';
            
            mobileControlState.analogX = 0;
            mobileControlState.analogY = 0;
            mobileControlState.analogPower = 0;
            
            resetMobileInputs();
        });
        
        analogKnob.addEventListener('mousedown', function(e) {
            e.preventDefault();
            mobileControlState.isDragging = true;
            analogKnob.classList.add('active');
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!mobileControlState.isDragging || mobileControlState.mode !== 'analog') return;
            
            e.preventDefault();
            
            const rect = analogBase.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const maxDistance = rect.width / 2 - 30;
            
            let deltaX = e.clientX - centerX;
            let deltaY = e.clientY - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }
            
            analogKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            mobileControlState.analogX = deltaX / maxDistance;
            mobileControlState.analogY = deltaY / maxDistance;
            mobileControlState.analogPower = Math.min(1, distance / maxDistance);
            
            updateMovementFromAnalog();
        });
        
        document.addEventListener('mouseup', function(e) {
            if (!mobileControlState.isDragging) return;
            
            e.preventDefault();
            mobileControlState.isDragging = false;
            analogKnob.classList.remove('active');
            analogKnob.style.transform = 'translate(0px, 0px)';
            
            mobileControlState.analogX = 0;
            mobileControlState.analogY = 0;
            mobileControlState.analogPower = 0;
            
            resetMobileInputs();
        });
    }
    
    function updateMovementFromAnalog() {
        const threshold = 0.3;
        
        if (mobileControlState.analogX < -threshold) {
            keys['ArrowLeft'] = true;
            keys['ArrowRight'] = false;
            player.facingRight = false;
        } else if (mobileControlState.analogX > threshold) {
            keys['ArrowLeft'] = false;
            keys['ArrowRight'] = true;
            player.facingRight = true;
        } else {
            keys['ArrowLeft'] = false;
            keys['ArrowRight'] = false;
        }
        
        if (mobileControlState.analogY < -threshold * 1.5) {
            if (!player.isJumping && player.onGround) {
                keys['ArrowUp'] = true;
                keys[' '] = true;
                player.jumpRequested = true;
                player.jumpBuffer = player.jumpBufferTime;
            }
        } else {
            keys['ArrowUp'] = false;
            keys[' '] = false;
            player.jumpRequested = false;
        }
        
        if (mobileControlState.analogY > threshold * 1.5) {
            keys['ArrowDown'] = true;
        } else {
            keys['ArrowDown'] = false;
        }
        
        mobileControlState.active = true;
    }
    
    function setupDPadButtons() {
        const dpadButtons = ['leftBtnV2', 'rightBtnV2', 'upBtnV2', 'downBtnV2'];
        
        dpadButtons.forEach(btnId => {
            const button = document.getElementById(btnId);
            if (!button) return;
            
            button.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (mobileControlState.mode === 'dpad') {
                    handleDPadPress(btnId, true);
                    this.classList.add('active');
                }
            });
            
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                handleDPadPress(btnId, false);
                this.classList.remove('active');
            });
            
            button.addEventListener('mousedown', function(e) {
                e.preventDefault();
                if (mobileControlState.mode === 'dpad') {
                    handleDPadPress(btnId, true);
                    this.classList.add('active');
                }
            });
            
            button.addEventListener('mouseup', function(e) {
                e.preventDefault();
                handleDPadPress(btnId, false);
                this.classList.remove('active');
            });
            
            button.addEventListener('mouseleave', function(e) {
                if (this.classList.contains('active')) {
                    handleDPadPress(btnId, false);
                    this.classList.remove('active');
                }
            });
        });
    }
    
    function handleDPadPress(buttonId, pressed) {
        switch(buttonId) {
            case 'leftBtnV2':
                keys['ArrowLeft'] = pressed;
                if (pressed) player.facingRight = false;
                break;
            case 'rightBtnV2':
                keys['ArrowRight'] = pressed;
                if (pressed) player.facingRight = true;
                break;
            case 'upBtnV2':
                keys['ArrowUp'] = pressed;
                keys[' '] = pressed;
                keys['x'] = pressed;
                keys['X'] = pressed;
                if (pressed) {
                    player.jumpRequested = true;
                    player.jumpBuffer = player.jumpBufferTime;
                } else {
                    player.jumpRequested = false;
                }
                break;
            case 'downBtnV2':
                keys['ArrowDown'] = pressed;
                break;
        }
        
        mobileControlState.active = true;
    }
    
    function setupActionButtons() {
        // Jump button
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (gameState.running && !gameState.paused) {
                    keys['ArrowUp'] = true;
                    keys[' '] = true;
                    keys['x'] = true;
                    keys['X'] = true;
                    player.jumpRequested = true;
                    player.jumpBuffer = player.jumpBufferTime;
                    this.classList.add('active');
                    console.log("🦘 Mobile jump pressed");
                }
            });
            
            jumpBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys['ArrowUp'] = false;
                keys[' '] = false;
                keys['x'] = false;
                keys['X'] = false;
                player.jumpRequested = false;
                this.classList.remove('active');
            });
        }
        
        // Attack button
        const attackBtn = document.getElementById('attackBtnV2');
        if (attackBtn) {
            attackBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (gameState.running && !gameState.paused) {
                    keys['z'] = true;
                    keys['Z'] = true;
                    this.classList.add('active');
                    
                    if (player.hasBoomerang) {
                        throwBoomerang();
                        console.log("🌀 Mobile boomerang thrown");
                    } else {
                        performMeleeAttack();
                        console.log("👊 Mobile attack performed");
                    }
                }
            });
            
            attackBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys['z'] = false;
                keys['Z'] = false;
                this.classList.remove('active');
            });
        }
        
        // Boomerang button
        const boomerangBtn = document.getElementById('boomerangBtnV2');
        if (boomerangBtn) {
            boomerangBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (gameState.running && !gameState.paused && player.hasBoomerang) {
                    keys['z'] = true;
                    keys['Z'] = true;
                    this.classList.add('active');
                    throwBoomerang();
                    console.log("🌀 Mobile boomerang button pressed");
                }
            });
            
            boomerangBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys['z'] = false;
                keys['Z'] = false;
                this.classList.remove('active');
            });
        }
        
        // JUMP BOOSTER BUTTON FOR MOBILE
        const jumpBoosterBtn = document.getElementById('jumpBoosterBtn');
        if (jumpBoosterBtn) {
            jumpBoosterBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (gameState.running && !gameState.paused) {
                    const success = player.useJumpBooster();
                    
                    if (success) {
                        console.log("🚀 Mobile: Jump Booster activated!");
                        this.classList.add('active');
                        
                        const boosterCount = this.querySelector('.booster-count');
                        if (boosterCount) {
                            boosterCount.textContent = player.jumpBoosterChargesThisLife;
                        }
                        
                        createParticles(player.x + player.width/2, player.y + player.height/2, 
                                       25, '#00FFFF');
                        showJumpBoosterNotification(`Jump Booster! (${player.jumpBoosterChargesThisLife} left for this life)`);
                        
                        if (player.onGround) {
                            player.velocityY = -player.jumpBoosterPower;
                            player.isJumping = true;
                            player.onGround = false;
                            player.doubleJumpUsed = false;
                            
                            createParticles(player.x + player.width/2, player.y + player.height/2, 
                                           35, '#00FFFF');
                            console.log("🚀 SUPER JUMP BOOSTER ACTIVATED!");
                        }
                    } else {
                        console.log("⚠️ Mobile: Cannot activate jump booster");
                        showJumpBoosterNotification("No boosters left for this life!", true);
                    }
                }
            });
            
            jumpBoosterBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.classList.remove('active');
            });
        }
    }
    
    function resetMobileInputs() {
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
        keys['ArrowUp'] = false;
        keys['ArrowDown'] = false;
        keys[' '] = false;
        keys['x'] = false;
        keys['X'] = false;
        keys['z'] = false;
        keys['Z'] = false;
        
        document.querySelectorAll('.dir-btn-v2, .action-btn-v2, .analog-knob').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    // ========== FULLSCREEN FUNCTIONS ==========
    function setupFullscreenToggle() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        
        const mobileFullscreenBtn = document.getElementById('mobileFullscreenBtn');
        if (mobileFullscreenBtn) {
            mobileFullscreenBtn.addEventListener('click', toggleFullscreen);
        }
    }
    
    function toggleFullscreen() {
    // Fungsi ini tidak digunakan lagi karena tombol fullscreen dihapus
    console.log("⚠️ Tombol fullscreen dihapus, gunakan tombol 'Mulai Game'");
}
    
    function handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement;
        
        gameState.isFullscreen = !!isFullscreen;
        
        const gameContainer = document.getElementById('gameContainer');
        const mobileControls = document.getElementById('mobileControls');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        if (isFullscreen) {
            if (gameContainer) {
                gameContainer.classList.add('fullscreen-active');
            }
            if (mobileControls) {
                mobileControls.classList.add('fullscreen-visible');
                mobileControls.style.display = 'flex';
            }
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                fullscreenBtn.title = "Keluar Fullscreen";
            }
            console.log("🖥️ Fullscreen mode active");
        } else {
            if (gameContainer) {
                gameContainer.classList.remove('fullscreen-active');
            }
            if (mobileControls) {
                mobileControls.classList.remove('fullscreen-visible');
                if (window.innerWidth >= 769) {
                    mobileControls.style.display = 'none';
                }
            }
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                fullscreenBtn.title = "Fullscreen";
            }
            console.log("📱 Fullscreen mode exited");
        }
    }
    
    function setupFullscreenControls() {
        const gameContainer = document.getElementById('gameContainer');
        const mobileControls = document.getElementById('mobileControls');
        const hudControls = document.querySelector('.hud-controls');
        
        if (!gameContainer || !mobileControls) return;
        
        mobileControls.style.position = 'fixed';
        mobileControls.style.bottom = '20px';
        mobileControls.style.left = '0';
        mobileControls.style.right = '0';
        mobileControls.style.zIndex = '1000';
        
        if (hudControls) {
            hudControls.style.position = 'fixed';
            hudControls.style.top = '20px';
            hudControls.style.right = '20px';
            hudControls.style.zIndex = '1000';
        }
        
        const autoProgressBtn = document.createElement('button');
        autoProgressBtn.id = 'toggleAutoProgressBtn';
        autoProgressBtn.className = 'control-btn';
        autoProgressBtn.innerHTML = '<i class="fas fa-forward"></i> Auto Progress: OFF';
        autoProgressBtn.title = "Toggle Auto Progress ke Level Berikutnya";
        
        if (hudControls) {
            hudControls.appendChild(autoProgressBtn);
        }
        
        console.log("✅ Fullscreen controls setup complete");
    }
    
    // ========== GAME CONTROLS ==========
    function startGame() {
    console.log("🚀 ===== START GAME FUNCTION CALLED =====");
    
    gameState.running = true;
    gameState.gameStarted = true;
    gameState.gameOver = false;
    gameState.win = false;
    gameState.paused = false;
    gameState.showLevelTransition = false;
    gameState.lastTime = performance.now();
    
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (startBtn) {
        startBtn.innerHTML = '<i class="fas fa-redo"></i> Ulangi';
        console.log("🔄 Start button updated to 'Ulangi'");
    }
    
    if (pauseBtn) {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda';
        pauseBtn.disabled = false;
        console.log("⏸️ Pause button enabled");
    }
    
    // Jika dalam mode fullscreen, inisialisasi kontrol
    if (fullscreenGameActive) {
        initializeFullscreenGame();
    }
    
    hideNextLevelButton();
    updateGameStats();
    
    console.log("✅ Game successfully started!");
}
    
    function resumeGame() {
        console.log("▶️ Resuming game...");
        gameState.paused = false;
        gameState.lastTime = performance.now();
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda';
        }
    }
    
    function restartGame() {
        console.log("🔄 [RESTART GAME] Memulai ulang permainan dari awal (Level 1)...");
        
        // 1. Hentikan loop game saat ini dan reset state fundamental
        gameState.running = false;
        gameState.paused = false;
        gameState.gameOver = false; // <-- Reset PENTING untuk mencegah blank screen
        gameState.win = false;
        gameState.showLevelTransition = false;
        
        // 2. Reset progres game
        gameState.score = 0;
        gameState.lives = 5;
        gameState.currentLevel = 1;
        gameState.unlockedLevel = 1;
        gameState.timeLeft = levelConfigs[1].time;
        
        // 3. Reset player dan booster
        player.resetJumpBoosterForGameOver();
        
        // 4. Muat ulang konfigurasi Level 1
        setupLevel(1);
        
        // 5. Hapus popup dari DOM untuk memastikan tidak ada yang tumpang tindih
        document.querySelectorAll('.overlay, .level-complete-popup, .game-over-popup').forEach(el => el.remove());
        
        // 6. Mulai game dengan state yang sudah bersih
        startGame();
        hideNextLevelButton();
        updateLevelButtons();
        
        console.log(`✅ Game restarted! Jump booster: ${player.jumpBoosterCharges} charges`);
    }
    
    function retryCurrentLevel() {
        console.log(`🔄 Mencoba lagi Level ${gameState.currentLevel}...`);
        
        // Kembalikan skor ke nilai sebelum level ini dimulai
        gameState.score = gameState.scoreBeforeLevel;
        
        // Reset nyawa dan status game
        gameState.lives = 5;
        gameState.timeLeft = levelConfigs[gameState.currentLevel].time;
        gameState.gameOver = false;
        gameState.win = false;
        gameState.running = true;
        gameState.gameStarted = true;
        
        player.resetJumpBoosterForGameOver();
        setupLevel(gameState.currentLevel); // Setup ulang level saat ini
        startGame();
    }
    
    function togglePause() {
        if (!gameState.running || gameState.gameOver || gameState.win) {
            console.log("⚠️ Cannot pause: game not running or finished");
            return;
        }
        
        gameState.paused = !gameState.paused;
        console.log("⏸️ Pause toggled:", gameState.paused);
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            if (gameState.paused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Lanjut';
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Jeda';
                gameState.lastTime = performance.now();
            }
        }
    }
    
    function toggleSound() {
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            if (soundBtn.innerHTML.includes('volume-up')) {
                soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Suara';
                console.log("🔇 Sound muted");
            } else {
                soundBtn.innerHTML = '<i class="fas fa-volume-up"></i> Suara';
                console.log("🔊 Sound unmuted");
            }
        }
    }
    
    function returnToMainMenu() {
        console.log("🏠 [MAIN MENU] Kembali ke menu utama...");
        
        // 1. Hentikan semua aktivitas game
        gameState.running = false;
        gameState.gameStarted = false; // <-- Kunci untuk menampilkan start screen
        gameState.gameOver = false; // <-- Reset PENTING untuk mencegah blank screen
        gameState.win = false;
        gameState.paused = false;
        gameState.showLevelTransition = false;
        
        // 2. Hapus semua popup dari DOM untuk mencegah tumpang tindih
        document.querySelectorAll('.overlay, .level-complete-popup, .game-over-popup').forEach(el => el.remove());
        
        // 3. Reset UI ke kondisi awal
        const startBtn = document.getElementById('startBtn');
        if (startBtn) startBtn.innerHTML = '<i class="fas fa-play"></i> Mulai Game';
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.disabled = true;
        hideNextLevelButton();
        
        // 4. Reset progres game ke nilai default
        gameState.score = 0;
        gameState.currentLevel = 1;
        gameState.unlockedLevel = 1;
        
        // 5. Update UI stats dan tombol level
        updateGameStats();
        updateLevelButtons();
        
        // 6. Karena gameStarted = false, game loop akan otomatis memanggil drawStartScreen().
        console.log("✅ Returned to main menu!");
    }
    
    // ========== GAME LOGIC ==========
    function animate(currentTime) {
        if (!gameState.lastTime) gameState.lastTime = currentTime;
        gameState.deltaTime = (currentTime - gameState.lastTime) / 1000;
        gameState.lastTime = currentTime;
        
        if (gameState.running && !gameState.paused) {
            update(gameState.deltaTime);
        }
        
        draw();
        requestAnimationFrame(animate);
    }
    
    function update(deltaTime) {
        if (gameState.showLevelTransition) {
            updateLevelTransition(deltaTime);
            return;
        }
        
        if (!gameState.running || gameState.paused || gameState.gameOver || gameState.win) {
            return;
        }
        
        updatePlayer(deltaTime);
        updatePlatforms(deltaTime);
        updateEnemies(deltaTime);
        updateItems(deltaTime);
        updateProjectiles(deltaTime);
        updateEnemyProjectiles(deltaTime);
        updateParticles(deltaTime);
        updatePlayerTimers(deltaTime);
        
        player.updateJumpBooster(deltaTime);
        
        updateGameTimer(deltaTime);
        checkCollisions();
        checkWinCondition();
        checkGameOver();
        updateCamera();
        updateStatusEffects(deltaTime);
    }
    
    function updatePlayer(deltaTime) {
        handleJumpInput(deltaTime);
        
        let targetVelocityX = 0;
        
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            targetVelocityX = -1;
            player.facingRight = false;
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            targetVelocityX = 1;
            player.facingRight = true;
        }

        if (mobileControlState.active) {
            if (mobileControlState.mode === 'analog' && mobileControlState.analogPower > 0.1) {
                targetVelocityX = mobileControlState.analogX;
                if (mobileControlState.analogX < 0) player.facingRight = false;
                if (mobileControlState.analogX > 0) player.facingRight = true;
            }
        }
        
        if (!player.isJumping || (player.isJumping && player.airControl > 0)) {
            let currentAcceleration = player.isJumping ? 
                player.acceleration * player.airControl : player.acceleration;
            
            if (targetVelocityX !== 0) {
                player.velocityX += targetVelocityX * currentAcceleration * deltaTime;
                player.velocityX = Math.max(-player.maxHorizontalSpeed, 
                                           Math.min(player.velocityX, player.maxHorizontalSpeed));
            } else {
                let currentDeceleration = player.isJumping ? 
                    player.deceleration * player.airControl : player.deceleration;
                
                if (player.velocityX > 0) {
                    player.velocityX = Math.max(0, player.velocityX - currentDeceleration * deltaTime);
                } else if (player.velocityX < 0) {
                    player.velocityX = Math.min(0, player.velocityX + currentDeceleration * deltaTime);
                }
            }
        }
        
        player.velocityY += player.gravity * deltaTime;
        player.velocityY = Math.min(player.velocityY, player.maxFallSpeed);
        
        player.x += player.velocityX * deltaTime;
        player.y += player.velocityY * deltaTime;
        
        if (player.isJumping) {
            const airSpeed = player.speed * player.airControl * player.jumpSpeedBoost;
            
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
                player.velocityX = Math.max(-airSpeed, player.velocityX - 80 * deltaTime);
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                player.velocityX = Math.min(airSpeed, player.velocityX + 80 * deltaTime);
            }
            
            if (keys['ArrowDown']) {
                player.velocityY += player.gravity * deltaTime * 0.5;
            }
        }
        
        if (player.attackCooldown > 0) {
            player.attackCooldown -= deltaTime;
        } else {
            player.canAttack = true;
        }
        
        if (player.isAttacking) {
            player.attackTimer -= deltaTime;
            if (player.attackTimer <= 0) {
                player.isAttacking = false;
            }
        }
        
        const currentTime = Date.now() / 1000;
        if (currentTime - player.lastAttackTime > player.comboWindow) {
            player.comboCount = 0;
        }
        
        if (player.x < 0) {
            player.x = 0;
            if (player.velocityX < 0) player.velocityX = 0;
        }
        
        const maxX = platforms[0].width - player.width;
        if (player.x > maxX) {
            player.x = maxX;
            if (player.velocityX > 0) player.velocityX = 0;
        }
        
        let wasOnGround = player.onGround;
        player.onGround = false;
        player.justLanded = false;
        
        for (let platform of platforms) {
            if (platform.type === 'disappearing' && !platform.visible) continue;
            
            if (player.x + player.width > platform.x &&
                player.x < platform.x + platform.width &&
                player.y + player.height >= platform.y - 1 &&
                player.y + player.height <= platform.y + platform.height + 10 &&
                player.velocityY >= 0) {
                
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
                
                player.coyoteTime = player.coyoteTimeMax;
                
                if (!wasOnGround) {
                    player.justLanded = true;
                    player.isJumping = false;
                    player.doubleJumpUsed = false;
                    
                    console.log("👣 Landed on platform!");
                    createParticles(player.x + player.width/2, player.y + player.height, 8, '#32CD32');
                }
                
                if (platform.type === 'toxic' || platform.type === 'lava') {
                    const now = Date.now();
                    
                    if (!player.lastPlatformDamage || now - player.lastPlatformDamage > 1500) {
                        takeDamage(platform.damage || 1, platform.type === 'lava' ? 'fire' : 'poison');
                        player.lastPlatformDamage = now;
                        createParticles(player.x + player.width/2, player.y + player.height, 10, '#FF4500');
                    }
                }
                
                break;
            }
        }
        
        if (!player.onGround && !player.isJumping) {
            player.isJumping = true;
        }
        
        if (player.y > canvas.height + 100) {
            takeDamage(2);
            resetPlayer();
        }
        
        if (player.onGround) {
            player.velocityX *= player.groundFriction;
            if (Math.abs(player.velocityX) < 1) player.velocityX = 0;
        } else {
            player.velocityX *= player.airFriction;
        }
        
        if (gameState.currentLevel === 4) {
            player.jumpPower = 600;
            player.airControl = 0.9;
            player.jumpSpeedBoost = 2.0;
            
            if (player.jumpRequested && 
                player.isJumping && 
                !player.doubleJumpUsed &&
                player.velocityY > -player.jumpPower * 0.7) {
                
                const doubleJumpPower = player.jumpBoosterActive ? 
                    player.jumpBoosterPower * 0.7 : player.jumpPower * 0.95;
                player.velocityY = -doubleJumpPower;
                player.doubleJumpUsed = true;
                player.jumpBuffer = 0;
                
                console.log("🦅 Double jump (Level 4 boost)!");
                createParticles(player.x + player.width/2, player.y + player.height/2, 12, '#00FFFF');
            }
        }
    }
    
    function handleJumpInput(deltaTime) {
        if (player.onGround) {
            player.coyoteTime = player.coyoteTimeMax;
        } else {
            player.coyoteTime -= deltaTime;
        }
        
        if (player.jumpBuffer > 0) {
            player.jumpBuffer -= deltaTime;
        }
        
        const canJumpFromBuffer = player.jumpBuffer > 0;
        const canJumpFromGround = player.onGround;
        const canJumpFromCoyote = !player.onGround && player.coyoteTime > 0 && !player.isJumping;
        const canDoubleJump = !player.doubleJumpUsed && player.canDoubleJump && player.isJumping;
        
        if (player.jumpRequested || canJumpFromBuffer) {
            if (canJumpFromGround || canJumpFromCoyote) {
                const currentJumpPower = player.jumpBoosterActive ? player.jumpBoosterPower : player.jumpPower;
                
                player.velocityY = -currentJumpPower;
                player.isJumping = true;
                player.onGround = false;
                player.coyoteTime = 0;
                player.jumpBuffer = 0;
                player.doubleJumpUsed = false;
                
                console.log("🦘 Jump!" + (player.jumpBoosterActive ? " (with booster)" : ""));
                
                const particleCount = player.jumpBoosterActive ? 25 : 10;
                const particleColor = player.jumpBoosterActive ? '#00FFFF' : '#4CAF50';
                createParticles(player.x + player.width/2, player.y + player.height/2, 
                               particleCount, particleColor);
            } else if (canDoubleJump) {
                const doubleJumpPower = player.jumpBoosterActive ? 
                    player.jumpBoosterPower * 0.8 : player.jumpPower * 0.8;
                player.velocityY = -doubleJumpPower;
                player.doubleJumpUsed = true;
                player.jumpBuffer = 0;
                
                console.log("✨ Double jump!" + (player.jumpBoosterActive ? " (with booster)" : ""));
                
                const particleCount = player.jumpBoosterActive ? 18 : 12;
                const particleColor = player.jumpBoosterActive ? '#00FFFF' : '#00FFFF';
                createParticles(player.x + player.width/2, player.y + player.height/2, 
                               particleCount, particleColor);
            }
            
            player.jumpRequested = false;
        }
    }
    
    function updateStatusEffects(deltaTime) {
        if (player.isPoisoned) {
            player.poisonTimer -= deltaTime;
            if (player.poisonTimer <= 0) {
                player.isPoisoned = false;
                takeDamage(1, 'poison');
                player.poisonTimer = 2;
                createParticles(player.x + player.width/2, player.y + player.height/2, 5, '#00FF00');
            }
        }
        
        if (player.isSlowed) {
            player.slowTimer -= deltaTime;
            if (player.slowTimer <= 0) {
                player.isSlowed = false;
                player.speed = 180;
                player.jumpPower = player.originalJumpPower;
            }
        }
        
        if (player.isBurning) {
            player.burnTimer -= deltaTime;
            if (player.burnTimer <= 0) {
                player.isBurning = false;
                takeDamage(1, 'fire');
                player.burnTimer = 1;
                createParticles(player.x + player.width/2, player.y + player.height/2, 5, '#FF4500');
            }
        }
    }
    
    function updateCamera() {
        const targetX = player.x - gameState.camera.width / 2 + player.width / 2;
        const targetY = player.y - gameState.camera.height / 2 + player.height / 2;
        
        gameState.camera.x += (targetX - gameState.camera.x) * gameState.camera.followSpeed;
        gameState.camera.y += (targetY - gameState.camera.y) * gameState.camera.followSpeed;
        
        const levelWidth = platforms[0].width;
        
        if (gameState.currentLevel === 4) {
            let maxX = levelWidth - gameState.camera.width;
            
            const flagAtEdge = flag.x > maxX - 100;
            
            if (flagAtEdge) {
                maxX = Math.min(flag.x + 50, levelWidth - gameState.camera.width * 0.3);
                if (maxX < 0) maxX = 0;
            }
            
            gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, maxX));
        } else {
            gameState.camera.x = Math.max(0, 
                Math.min(gameState.camera.x, levelWidth - gameState.camera.width));
        }
        
        const levelHeight = canvas.height;
        gameState.camera.y = Math.max(0, 
            Math.min(gameState.camera.y, levelHeight - gameState.camera.height));
    }
    
    function updatePlatforms(deltaTime) {
        for (let platform of platforms) {
            if (platform.type === 'moving') {
                platform.x += platform.speed * platform.direction * deltaTime * 60;
                
                if (platform.x < 50) {
                    platform.direction = 1;
                    platform.x = 50;
                }
                if (platform.x + platform.width > canvas.width - 50) {
                    platform.direction = -1;
                    platform.x = canvas.width - 50 - platform.width;
                }
            }
            
            if (platform.type === 'disappearing' && platform.visible) {
                platform.timer += deltaTime;
                
                if (platform.timer > 2) {
                    platform.visible = false;
                    platform.reappearTimer = 3;
                }
            }
            
            if (platform.type === 'disappearing' && !platform.visible && platform.reappearTimer) {
                platform.reappearTimer -= deltaTime;
                
                if (platform.reappearTimer <= 0) {
                    platform.visible = true;
                    platform.timer = 0;
                    platform.reappearTimer = 0;
                }
            }
            
            if (platform.type === 'floating') {
                if (!platform.startY) {
                    platform.startY = platform.y;
                }
                
                const floatHeight = platform.floatHeight || 20;
                const floatSpeed = platform.floatSpeed || 0.5;
                
                platform.y = platform.startY + Math.sin(Date.now() / 1000 * floatSpeed) * floatHeight;
            }
        }
    }
    
    function updateEnemies(deltaTime) {
        const activeRange = 600;
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            const distanceToCameraX = Math.abs(enemy.x - gameState.camera.x - gameState.camera.width/2);
            const distanceToCameraY = Math.abs(enemy.y - gameState.camera.y - gameState.camera.height/2);
            const distanceToPlayer = Math.sqrt(
                Math.pow(enemy.x - player.x, 2) + 
                Math.pow(enemy.y - player.y, 2)
            );
            
            const isActive = distanceToCameraX < activeRange && 
                            distanceToCameraY < activeRange &&
                            distanceToPlayer < 800;
            
            if (!isActive && !enemy.isBoss) {
                continue;
            }
            
            enemy.x += enemy.speed * enemy.direction * deltaTime;
            
            if (enemy.flying) {
                if (!enemy.startY) enemy.startY = enemy.y;
                enemy.y = enemy.startY + Math.sin(Date.now() / 1000 * enemy.frequency) * enemy.amplitude;
            }
            
            if (enemy.attackCooldown > 0) {
                enemy.attackCooldown -= deltaTime;
            }
        }
    }
    
    function updateItems(deltaTime) {
        for (let item of items) {
            item.floatOffset += deltaTime * 2;
            item.y += Math.sin(item.floatOffset) * 0.5;
        }
    }
    
    function updateProjectiles(deltaTime) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            
            proj.x += proj.velocityX * deltaTime;
            proj.y += proj.velocityY * deltaTime;
            
            if (proj.type === 'boomerang') {
                proj.lifeTime -= deltaTime;
                
                const dx = player.x - proj.x;
                const dy = (player.y + player.height/2) - proj.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (proj.lifeTime < 0.5 || distance < 30) {
                    proj.velocityX += dx * 5 * deltaTime;
                    proj.velocityY += dy * 5 * deltaTime;
                    
                    if (distance < 30) {
                        projectiles.splice(i, 1);
                        player.hasBoomerang = true;
                        createParticles(player.x + player.width/2, player.y + player.height/2, 10, '#4CAF50');
                    }
                }
                
                if (proj.lifeTime < -1) {
                    projectiles.splice(i, 1);
                    player.hasBoomerang = true;
                }
                
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    
                    if (proj.x < enemy.x + enemy.width &&
                        proj.x + proj.width > enemy.x &&
                        proj.y < enemy.y + enemy.height &&
                        proj.y + proj.height > enemy.y) {
                        
                        const finalDamage = calculateDamageToEnemy(
                            proj.damage, 
                            enemy, 
                            proj.attackType, 
                            proj.attackElement
                        );
                        
                        enemy.health -= finalDamage;
                        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 12, '#4169E1');
                        
                        if (enemy.health <= 0) {
                            gameState.score += 150;
                            enemies.splice(j, 1);
                            createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, '#FF4500');
                            
                            dropItemFromEnemy(enemy);
                        }
                        
                        updateGameStats();
                    }
                }
            }
            
            if (proj.x < -100 || proj.x > canvas.width + 100 || 
                proj.y < -100 || proj.y > canvas.height + 100) {
                projectiles.splice(i, 1);
                if (proj.type === 'boomerang') {
                    player.hasBoomerang = true;
                }
            }
        }
    }
    
    function updateEnemyProjectiles(deltaTime) {
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            const proj = enemyProjectiles[i];
            
            proj.x += proj.velocityX * deltaTime;
            proj.y += proj.velocityY * deltaTime;
            
            if (proj.lifeTime) {
                proj.lifeTime -= deltaTime;
                if (proj.lifeTime <= 0) {
                    enemyProjectiles.splice(i, 1);
                    continue;
                }
            }
            
            if (proj.x < -100 || proj.x > canvas.width + 100 || 
                proj.y < -100 || proj.y > canvas.height + 100) {
                enemyProjectiles.splice(i, 1);
            }
        }
    }
    
    function updateParticles(deltaTime) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            particle.x += particle.velocityX * deltaTime;
            particle.y += particle.velocityY * deltaTime;
            particle.velocityY += 400 * deltaTime;
            particle.lifeTime -= deltaTime;
            particle.alpha = particle.lifeTime / particle.maxLifeTime;
            
            if (particle.lifeTime <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    
    function updatePlayerTimers(deltaTime) {
        if (player.hasShield) {
            player.shieldTime -= deltaTime;
            if (player.shieldTime <= 0) {
                player.hasShield = false;
            }
        }
        
        if (player.invincible) {
            player.invincibleTimer -= deltaTime;
            if (player.invincibleTimer <= 0) {
                player.invincible = false;
            }
        }
    }
    
    function updateGameTimer(deltaTime) {
        if (gameState.running && !gameState.paused) {
            gameState.timeLeft -= deltaTime;
            
            if (gameState.timeLeft <= 0) {
                gameState.timeLeft = 0;
                gameState.gameOver = true;
                gameState.running = false;
            }
            
            if (Math.floor(gameState.timeLeft) != Math.floor(gameState.timeLeft + deltaTime)) {
                updateGameStats();
            }
        }
    }
    
    // ========== COLLISION DETECTION ==========
    function checkCollisions() {
        const collisionRangeX = 300;
        const collisionRangeY = 200;
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            const distanceX = Math.abs(player.x - enemy.x);
            const distanceY = Math.abs(player.y - enemy.y);
            
            if (distanceX > collisionRangeX && distanceY > collisionRangeY && !isInViewport(enemy)) {
                continue;
            }
            
            if (player.invincible) continue;
            
            const dx = (player.x + player.width/2) - (enemy.x + enemy.width/2);
            const dy = (player.y + player.height/2) - (enemy.y + enemy.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = player.width/2 + Math.min(enemy.width, enemy.height)/2;
            
            if (distance < minDistance) {
                
                if (player.velocityY > 0 && dy > 0) {
                    const stompDamage = player.attackTypes.jumpAttack.damage;
                    const finalDamage = calculateDamageToEnemy(stompDamage, enemy, 'crush', null);
                    
                    enemy.health -= finalDamage;
                    
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 
                                  15 + finalDamage, '#FFD700');
                    
                    const bouncePower = player.jumpBoosterActive ? 
                        player.jumpBoosterPower * 0.7 : player.jumpPower * 0.7;
                    player.velocityY = -bouncePower;
                    
                    gameState.score += 30 + (finalDamage * 5);
                    
                    if (enemy.health <= 0) {
                        const defeatScore = calculateDefeatScore(enemy, 1);
                        gameState.score += defeatScore;
                        enemies.splice(i, 1);
                        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 25, '#FF4500');
                        
                        dropItemFromEnemy(enemy);
                    }
                } else {
                    const enemyDamage = calculateDamageToPlayer(enemy);
                    let damageType = 'physical';
                    
                    if (enemy.type.includes('dragon') && enemy.element === 'fire') {
                        damageType = 'fire';
                        player.isBurning = true;
                        player.burnTimer = 3;
                    } else if (enemy.venomous) {
                        damageType = 'poison';
                        player.isPoisoned = true;
                        player.poisonTimer = 3;
                    } else if (enemy.type === 'yeti') {
                        damageType = 'ice';
                    }
                    
                    takeDamage(enemyDamage, damageType, enemy.type);
                    
                    player.velocityX = dx > 0 ? 200 : -200;
                    player.velocityY = -150;
                    player.invincible = true;
                    player.invincibleTimer = 1.5;
                    
                    applyEnemyAttackEffects(enemy);
                }
            }
        }
        
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            
            const distanceX = Math.abs(player.x - item.x);
            const distanceY = Math.abs(player.y - item.y);
            
            if (distanceX > collisionRangeX || distanceY > collisionRangeY) {
                continue;
            }
            
            const dx = (player.x + player.width/2) - (item.x + item.width/2);
            const dy = (player.y + player.height/2) - (item.y + item.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = player.width/2 + Math.min(item.width, item.height)/2;
            
            if (distance < minDistance) {
                collectItem(item);
                items.splice(i, 1);
            }
        }
        
        if (!flag.collected) {
            const distanceX = Math.abs(player.x - flag.x);
            const distanceY = Math.abs(player.y - flag.y);
            
            if (distanceX < 500 && distanceY < 500) {
                const dx = (player.x + player.width/2) - (flag.x + flag.width/2);
                const dy = (player.y + player.height/2) - (flag.y + flag.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = player.width/2 + Math.min(flag.width, flag.height)/2;
                
                if (distance < minDistance) {
                    flag.collected = true;
                    gameState.score += 500 * gameState.currentLevel;
                    createParticles(flag.x + flag.width/2, flag.y + flag.height/2, 30, '#FFFF00');
                    
                    winLevel();
                }
            }
        }
    }
    
    function applyEnemyAttackEffects(enemy) {
        switch(enemy.type) {
            case 'snake':
                if (enemy.venomous) {
                    console.log("🐍 Poisoned by snake!");
                    createParticles(player.x + player.width/2, player.y + player.height/2, 8, '#00FF00');
                }
                break;
                
            case 'spider':
                if (enemy.webShooter) {
                    player.speed *= 0.7;
                    player.jumpPower *= 0.8;
                    setTimeout(() => {
                        player.speed = 180;
                        player.jumpPower = player.originalJumpPower;
                    }, 3000);
                    console.log("🕸️ Slowed by spider web!");
                    createParticles(player.x + player.width/2, player.y + player.height/2, 10, '#FFFFFF');
                }
                break;
                
            case 'yeti':
                if (enemy.throwSnowball) {
                    player.speed *= 0.6;
                    setTimeout(() => {
                        player.speed = 180;
                    }, 2000);
                    console.log("❄️ Slowed by yeti's cold!");
                    createParticles(player.x + player.width/2, player.y + player.height/2, 12, '#F0F8FF');
                }
                break;
                
            case 'boss_dragon':
                if (enemy.phase === 2) {
                    console.log("🔥 Burning from dragon fire!");
                    createParticles(player.x + player.width/2, player.y + player.height/2, 15, '#FF0000');
                }
                break;
        }
    }
    
    // ========== GAME STATE FUNCTIONS ==========
    function takeDamage(damage, damageType = 'physical', source = null) {
        if (player.hasShield) {
            player.hasShield = false;
            player.shieldTime = 0;
            createParticles(player.x + player.width/2, player.y + player.height/2, 15, '#4169E1');
            console.log("🛡️ Shield blocked damage!");
            return;
        }
        
        if (player.invincible) {
            console.log("✨ Invincible, damage ignored");
            return;
        }
        
        let finalDamage = damage;
        
        if (player.hasElementalAttack && player.elementalType === 'ice' && damageType === 'fire') {
            finalDamage *= 0.7;
        }
        
        gameState.lives -= finalDamage;
        if (gameState.lives < 0) gameState.lives = 0;
        
        player.invincible = true;
        player.invincibleTimer = 1.5;
        
        player.comboCount = 0;
        
        if (finalDamage > 0 && gameState.lives > 0) {
            player.resetJumpBoosterForNewLife();
            console.log(`💀 Damage taken! Reset jump booster for new life. Charges: ${player.jumpBoosterChargesThisLife}`);
        }
        
        let damageColor = '#FF0000';
        if (damageType === 'poison') damageColor = '#00FF00';
        if (damageType === 'fire') damageColor = '#FF4500';
        if (damageType === 'ice') damageColor = '#00FFFF';
        
        updateGameStats();
        createParticles(player.x + player.width/2, player.y + player.height/2, 
                       10 + Math.floor(finalDamage * 3), damageColor);
        
        console.log(`💥 Damage taken! Type: ${damageType}, Amount: ${finalDamage}, Source: ${source}, Lives left: ${gameState.lives}`);
        
        if (gameState.lives <= 0) {
            gameOver();
        }
    }
    
    function collectItem(item) {
        switch(item.type) {
            case 'coin':
                gameState.score += 100;
                createParticles(item.x + item.width/2, item.y + item.height/2, 5, '#FFD700');
                break;
                
            case 'leaf':
                gameState.score += 50;
                createParticles(item.x + item.width/2, item.y + item.height/2, 8, '#32CD32');
                break;
                
            case 'boomerang':
                player.hasBoomerang = true;
                gameState.score += 200;
                createParticles(item.x + item.width/2, item.y + item.height/2, 15, '#4169E1');
                break;
                
            case 'shield':
                player.hasShield = true;
                player.shieldTime = 10;
                gameState.score += 150;
                createParticles(item.x + item.width/2, item.y + item.height/2, 12, '#0000FF');
                break;
                
            case 'star':
                gameState.score += 500;
                gameState.lives = Math.min(gameState.lives + 2, 10);
                
                const recharged = player.rechargeJumpBooster();
                if (recharged) {
                    console.log(`✨ Jump booster recharged from star! Charges: ${player.jumpBoosterChargesThisLife}`);
                    createParticles(item.x + item.width/2, item.y + item.height/2, 15, '#00FFFF');
                }
                
                if (!player.hasElementalAttack) {
                    player.hasElementalAttack = true;
                    const elements = ['fire', 'ice', 'electric'];
                    player.elementalType = elements[Math.floor(Math.random() * elements.length)];
                    player.attackElement = player.elementalType;
                    console.log(`✨ Gained ${player.elementalType} elemental power!`);
                }
                createParticles(item.x + item.width/2, item.y + item.height/2, 20, '#FF4500');
                break;
        }
        
        updateGameStats();
    }
    
    function checkWinCondition() {
        if (flag.collected && !gameState.win) {
            winLevel();
        }
    }
    
    function checkGameOver() {
        if (gameState.lives <= 0 && !gameState.gameOver) {
            gameOver();
        }
    }
    
    function gameOver() {
        gameState.gameOver = true;
        gameState.running = false;
        
        console.log(`💀 GAME OVER! Skor: ${gameState.score}, Level: ${gameState.currentLevel}`);
        player.resetJumpBoosterForGameOver(); // Reset booster untuk game baru
        
        // Tampilkan popup game over alih-alih alert
        showGameOverPopup();
    }
    
    // ========== FUNGSI POPUP GAME OVER ==========
    function showGameOverPopup() {
        let popup = document.querySelector('.game-over-popup');
        let overlay = document.querySelector('.overlay');

        if (!popup) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'overlay';
                document.body.appendChild(overlay);
            }

            popup = document.createElement('div');
            popup.className = 'level-complete-popup game-over-popup'; // Re-use a lot of the styles
            document.body.appendChild(popup);
        }

        popup.innerHTML = `
            <h2 class="game-over-title"><i class="fas fa-skull-crossbones"></i> WADUH, ANDA GAGAL!</h2>
            <p class="game-over-subtitle">Petualangan Koko harus terhenti di sini...</p>
            <div class="stats">
                <div>Level Tercapai: <span>${gameState.currentLevel}</span></div>
                <div>Skor Akhir: <span>${gameState.score}</span></div>
            </div>
            <div class="popup-buttons">
                <button class="popup-btn retry">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
                <button class="popup-btn menu">
                    <i class="fas fa-home"></i> Menu Utama
                </button>
            </div>
        `;

        // Tampilkan overlay dan popup
        overlay.classList.add('show');
        popup.classList.add('show');

        // Event listeners untuk tombol
        popup.querySelector('.popup-btn.retry').addEventListener('click', () => {
            overlay.classList.remove('show');
            popup.classList.remove('show');
            // Panggil restartGame() untuk memulai ulang permainan dari awal (Level 1).
            restartGame();
        });

        popup.querySelector('.popup-btn.menu').addEventListener('click', () => {
            overlay.classList.remove('show');
            popup.classList.remove('show');
            returnToMainMenu();
        });
    }


    // ========== UI FUNCTIONS ==========
    function updateGameStats() {
        const livesEl = document.getElementById('lives');
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const timerEl = document.getElementById('timer');
        const unlockedLevelEl = document.getElementById('unlockedLevel');
        const boosterCounterEl = document.getElementById('boosterCounter');
        
        if (livesEl) livesEl.textContent = gameState.lives;
        if (scoreEl) scoreEl.textContent = gameState.score;
        if (levelEl) levelEl.textContent = `Level ${gameState.currentLevel}/10`;
        if (timerEl) timerEl.textContent = Math.floor(gameState.timeLeft);
        if (unlockedLevelEl) unlockedLevelEl.textContent = gameState.unlockedLevel;
        if (boosterCounterEl) boosterCounterEl.textContent = player.jumpBoosterChargesThisLife;
        
        const boosterCount = document.querySelector('.booster-count');
        if (boosterCount) {
            boosterCount.textContent = player.jumpBoosterChargesThisLife;
        }
        
        const jumpBoosterBtn = document.getElementById('jumpBoosterBtn');
        if (jumpBoosterBtn) {
            jumpBoosterBtn.disabled = player.jumpBoosterChargesThisLife <= 0 || player.jumpBoosterActive;
            
            if (player.jumpBoosterChargesThisLife <= 0) {
                jumpBoosterBtn.title = "No boosters left for this life!";
            } else if (player.jumpBoosterActive) {
                jumpBoosterBtn.title = "Booster already active!";
            } else {
                jumpBoosterBtn.title = `Jump Booster (${player.jumpBoosterChargesThisLife} left for this life)`;
            }
        }
        
        const useBoosterBtn = document.getElementById('useBoosterBtn');
        if (useBoosterBtn) {
            useBoosterBtn.disabled = player.jumpBoosterChargesThisLife <= 0 || player.jumpBoosterActive;
        }
    }
    
    function updateLevelButtons() {
        const levelButtonsContainer = document.querySelector('.level-buttons');
        if (!levelButtonsContainer) return;
        
        levelButtonsContainer.innerHTML = '';
        
        for (let i = 1; i <= gameState.maxLevel; i++) {
            const btn = document.createElement('button');
            btn.className = `level-btn ${i > gameState.unlockedLevel ? 'locked' : ''} ${i === gameState.currentLevel ? 'active' : ''}`;
            btn.setAttribute('data-level', i);
            btn.innerHTML = `
                <div class="level-number">${i}</div>
                <div class="level-difficulty">${levelConfigs[i].difficulty}</div>
            `;
            
            btn.addEventListener('click', function() {
                const level = parseInt(this.getAttribute('data-level'));
                console.log(`🎯 Level ${level} selected`);
                if (level <= gameState.unlockedLevel) {
                    setupLevel(level);
                    if (!gameState.running) {
                        startGame();
                    }
                } else {
                    alert(`Level ${level} terkunci! Selesaikan level ${level-1} terlebih dahulu.`);
                }
            });
            
            levelButtonsContainer.appendChild(btn);
        }
    }
    
    function showNextLevelButton() {
        if (gameState.currentLevel < gameState.maxLevel) {
            const nextLevelBtn = document.getElementById('nextLevelBtn');
            if (nextLevelBtn) {
                nextLevelBtn.style.display = 'flex';
                nextLevelBtn.classList.add('pulse');
            }
        }
    }
    
    function hideNextLevelButton() {
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            nextLevelBtn.style.display = 'none';
            nextLevelBtn.classList.remove('pulse');
        }
    }
    
    function showLevelCompletePopup(timeBonus, livesBonus, levelBonus) {
        // Gunakan popup baru jika tersedia
        if (window.showLevelCompletePopupNew) {
            showLevelCompletePopupNew(timeBonus, livesBonus, levelBonus);
            return;
        }
        
        // Fallback ke popup lama
        let popup = document.querySelector('.level-complete-popup');
        let overlay = document.querySelector('.overlay');
        
        if (!popup) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
            
            popup = document.createElement('div');
            popup.className = 'level-complete-popup';
            popup.innerHTML = `
                <h2><i class="fas fa-trophy"></i> Level ${gameState.currentLevel} Selesai!</h2>
                <div class="stats">
                    <div>Bonus Waktu: <span>${timeBonus}</span></div>
                    <div>Bonus Nyawa: <span>${livesBonus}</span></div>
                    <div>Bonus Level: <span>${levelBonus}</span></div>
                    <div style="border-top: 2px solid #4CAF50; margin-top: 10px; padding-top: 10px;">
                        Total Skor: <span>${gameState.score}</span>
                    </div>
                    <div style="margin-top: 10px; padding: 5px; background: #00FFFF20; border-radius: 5px;">
                        <i class="fas fa-rocket"></i> Jump Booster: <span>${player.jumpBoosterChargesThisLife} charges</span> dibawa ke level berikutnya
                    </div>
                </div>
                <div class="popup-buttons">
                    ${gameState.currentLevel < gameState.maxLevel ? 
                        `<button class="popup-btn next">Lanjut ke Level ${gameState.currentLevel + 1}</button>` : 
                        `<button class="popup-btn next" disabled>Game Selesai!</button>`
                    }
                    <button class="popup-btn retry">Ulangi Level</button>
                    <button class="popup-btn menu">Menu Utama</button>
                </div>
            `;
            document.body.appendChild(popup);
            
            // Setup event listeners
            const nextBtn = popup.querySelector('.popup-btn.next');
            const retryBtn = popup.querySelector('.popup-btn.retry');
            const menuBtn = popup.querySelector('.popup-btn.menu');
            
            if (nextBtn && !nextBtn.disabled) {
                nextBtn.addEventListener('click', function() {
                    if (gameState.currentLevel < gameState.maxLevel) {
                        const currentBoosterCharges = player.jumpBoosterChargesThisLife;
                        
                        setupLevel(gameState.currentLevel + 1);
                        
                        player.jumpBoosterChargesThisLife = currentBoosterCharges;
                        player.jumpBoosterCharges = currentBoosterCharges;
                        
                        startGame();
                    }
                    overlay.classList.remove('show');
                    popup.classList.remove('show');
                });
            }
            
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    player.resetJumpBoosterForNewLife();
                    restartGame();
                    overlay.classList.remove('show');
                    popup.classList.remove('show');
                });
            }
            
            if (menuBtn) {
                menuBtn.addEventListener('click', function() {
                    returnToMainMenu();
                    overlay.classList.remove('show');
                    popup.classList.remove('show');
                });
            }
        } else {
            // Update konten popup yang sudah ada
            popup.querySelector('h2').innerHTML = `<i class="fas fa-trophy"></i> Level ${gameState.currentLevel} Selesai!`;
            popup.querySelectorAll('.stats span')[0].textContent = timeBonus;
            popup.querySelectorAll('.stats span')[1].textContent = livesBonus;
            popup.querySelectorAll('.stats span')[2].textContent = levelBonus;
            popup.querySelectorAll('.stats span')[3].textContent = gameState.score;
            popup.querySelectorAll('.stats span')[4].textContent = player.jumpBoosterChargesThisLife;
            
            const nextBtn = popup.querySelector('.popup-btn.next');
            if (nextBtn) {
                if (gameState.currentLevel < gameState.maxLevel) {
                    nextBtn.textContent = `Lanjut ke Level ${gameState.currentLevel + 1}`;
                    nextBtn.disabled = false;
                } else {
                    nextBtn.textContent = 'Game Selesai!';
                    nextBtn.disabled = true;
                }
            }
        }
        
        overlay.classList.add('show');
        popup.classList.add('show');
    }
    
    // ========== VISUAL EFFECTS ==========
    function createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                size: 3 + Math.random() * 5,
                color: color,
                velocityX: -100 + Math.random() * 200,
                velocityY: -100 + Math.random() * 200,
                lifeTime: 0.5 + Math.random() * 0.5,
                maxLifeTime: 0.5 + Math.random() * 0.5,
                alpha: 1
            });
        }
    }
    
    // ========== DRAWING FUNCTIONS ==========
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (gameState.win && !gameState.showLevelTransition) {
            drawGameCompleteScreen();
            return;
        }
        
        if (gameState.showLevelTransition) {
            drawLevelTransition();
            return;
        }
        
        // Logika utama untuk menggambar:
        // Jika game belum dimulai, gambar layar awal.
        // Jika sudah, gambar elemen-elemen game.
        if (!gameState.gameStarted) {
            drawStartScreen();
            return;
        }
        
        // Jika gameOver, popup DOM akan muncul. Canvas tidak perlu menggambar apa-apa lagi
        if (gameState.gameOver) return;
        
        ctx.save();
        ctx.translate(-gameState.camera.x, -gameState.camera.y);
        
        drawBackground();
        drawPlatforms();
        drawItems();
        drawEnemies();
        drawProjectiles();
        drawEnemyProjectiles();
        drawParticles();
        drawPlayer();
        drawFlag();
        
        ctx.restore();
        
        drawUI();
        
        if (player.comboCount > 1 && gameState.running && !gameState.paused) {
            drawComboCounter();
        }
        
        if (player.attackElement && gameState.running && !gameState.paused) {
            drawElementalIndicator();
        }
        
        drawStatusEffects();
        
        drawJumpBoosterIndicator();
    }
    
    function drawJumpBoosterIndicator() {
        if (player.jumpBoosterActive && gameState.running && !gameState.paused) {
            const boostX = canvas.width - 150;
            const boostY = 80;
            
            const barWidth = 100;
            const barHeight = 15;
            const progress = player.jumpBoosterTimer / player.jumpBoosterDuration;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(boostX, boostY, barWidth, barHeight);
            
            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(boostX, boostY, barWidth * progress, barHeight);
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(boostX, boostY, barWidth, barHeight);
            
            ctx.fillStyle = '#00FFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚀', boostX + barWidth/2, boostY - 20);
            
            ctx.font = '14px Arial';
            ctx.fillText(`JUMP BOOSTER (${player.jumpBoosterChargesThisLife} left)`, boostX + barWidth/2, boostY + 30);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`${Math.ceil(player.jumpBoosterTimer)}s`, boostX + barWidth/2, boostY + barHeight/2);
        }
    }
    
    function drawStartScreen() {
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('KOKO ADVENTURE', canvas.width / 2, 100);
        
        // Subtitle
        ctx.fillStyle = '#4CAF50';
        ctx.font = '24px Arial';
        ctx.fillText('v4.0 - 10 Level Complete!', canvas.width / 2, 160);
        
        // Player sprite example
        drawPixelPlayer(canvas.width / 2 - 20, 220, 40, 40);
        
        // Features
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        
        const features = [
            '✨ Sistem Damage Komprehensif',
            '🚀 Jump Booster (3 charges per hidup)',
            '➡️ Progres Level Otomatis/Tombol Manual',
            '🖥️ Kontrol Fullscreen',
            '🎮 10 Level Menantang',
            '⚔️ Elemental & Armor Types',
            '🛡️ Combo System',
            '🏆 Animated Level Transition'
        ];
        
        for (let i = 0; i < features.length; i++) {
            ctx.fillText(features[i], canvas.width / 2 - 200, 300 + i * 30);
        }
        
        // Instructions
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Kontrol:', canvas.width / 2, 580);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.fillText('← → : Bergerak | Spasi/X : Lompat | Z : Serang', canvas.width / 2, 610);
        ctx.fillText('B : Jump Booster | ESC : Jeda', canvas.width / 2, 635);
        
        // Start prompt
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('Klik "Mulai Game" untuk memulai!', canvas.width / 2, 700);
    }
    
    function drawPixelPlayer(x, y, width, height) {
        ctx.fillStyle = '#FFD700'; // Body
        ctx.fillRect(x, y, width, height);
        
        ctx.fillStyle = '#000000'; // Eyes
        ctx.fillRect(x + width/4, y + height/4, 5, 5);
        ctx.fillRect(x + 3*width/4 - 5, y + height/4, 5, 5);
        
        ctx.fillStyle = '#FF4500'; // Mouth
        ctx.fillRect(x + width/3, y + 2*height/3, width/3, 5);
    }
    
    function drawBackground() {
        // Sky
        const config = levelConfigs[gameState.currentLevel];
        
        if (config.theme === 'night') {
            ctx.fillStyle = '#0a1929';
        } else if (config.theme === 'toxic') {
            ctx.fillStyle = '#556B2F';
        } else if (config.theme === 'fire') {
            ctx.fillStyle = '#8B0000';
        } else {
            ctx.fillStyle = '#87CEEB';
        }
        ctx.fillRect(gameState.camera.x, gameState.camera.y, 
                    gameState.camera.width, gameState.camera.height);
        
        // Draw background elements (far back)
        for (let element of backgroundElements) {
            if (element.layer !== 'back') continue;
            if (!isInViewport(element)) continue;
            
            switch(element.type) {
                case 'tree':
                    drawPixelTree(element.x, element.y - element.height, 
                                element.width, element.height);
                    break;
                case 'mountain':
                    drawPixelMountain(element.x, element.y - element.height,
                                    element.width, element.height, element.color);
                    break;
                case 'cloud':
                    drawPixelCloud(element.x, element.y, 
                                 element.width, element.height);
                    break;
                case 'star':
                    const alpha = 0.7 + Math.sin(Date.now()/1000 + element.twinkle * Math.PI) * 0.3;
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fillRect(element.x, element.y, element.size, element.size);
                    break;
            }
        }
        
        // Mid-ground
        for (let element of backgroundElements) {
            if (element.layer !== 'front') continue;
            if (!isInViewport(element)) continue;
            
            switch(element.type) {
                case 'bush':
                    drawPixelBush(element.x, element.y, 
                                element.width, element.height);
                    break;
                case 'log':
                    drawPixelLog(element.x, element.y - element.height,
                               element.width, element.height);
                    break;
            }
        }
    }
    
    function isInViewport(obj) {
        return obj.x < gameState.camera.x + gameState.camera.width + 100 &&
               obj.x + (obj.width || 0) > gameState.camera.x - 100 &&
               obj.y < gameState.camera.y + gameState.camera.height + 100 &&
               obj.y + (obj.height || 0) > gameState.camera.y - 100;
    }
    
    function drawPlatforms() {
        for (let platform of platforms) {
            if (!isInViewport(platform)) continue;
            
            if (platform.type === 'ground') {
                drawGrassTexture(platform.x, platform.y, platform.width, platform.height);
            } else if (platform.type === 'disappearing') {
                if (!platform.visible) continue;
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Blinking effect
                const blink = Math.sin(Date.now() / 200) > 0;
                if (blink) {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(platform.x + 5, platform.y + 5, 
                                platform.width - 10, platform.height - 10);
                }
            } else if (platform.type === 'toxic') {
                ctx.fillStyle = '#006400';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Toxic effect
                ctx.fillStyle = '#00FF00';
                for (let i = 0; i < platform.width/10; i++) {
                    if ((i + Math.floor(Date.now()/200)) % 3 === 0) {
                        ctx.fillRect(platform.x + i*10, platform.y, 5, 5);
                    }
                }
            } else if (platform.type === 'lava') {
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Lava effect
                ctx.fillStyle = '#FF4500';
                const lavaTime = Date.now() / 300;
                for (let i = 0; i < platform.width/15; i++) {
                    const wave = Math.sin(lavaTime + i * 0.5) * 0.5 + 0.5;
                    ctx.fillRect(platform.x + i*15, platform.y + wave * 10, 10, 5);
                }
            } else if (platform.type === 'floating') {
                ctx.fillStyle = '#9370DB';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Magic glow
                const glow = Math.sin(Date.now()/500) * 0.2 + 0.8;
                ctx.fillStyle = `rgba(147, 112, 219, ${glow})`;
                ctx.fillRect(platform.x - 2, platform.y - 2, 
                            platform.width + 4, platform.height + 4);
            } else {
                ctx.fillStyle = platform.color || '#8B4513';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                if (platform.type === 'moving') {
                    // Moving platform indicator
                    ctx.fillStyle = '#4169E1';
                    ctx.fillRect(platform.x + 5, platform.y + 5, 10, 10);
                }
            }
            
            // Platform texture
            drawPlatformTexture(platform.x, platform.y, platform.width, platform.height);
        }
    }
    
    function drawItems() {
        for (let item of items) {
            if (!isInViewport(item)) continue;
            
            switch(item.type) {
                case 'coin':
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(item.x, item.y, item.width, item.height);
                    ctx.fillStyle = '#FFA500';
                    ctx.fillRect(item.x + 5, item.y + 5, item.width - 10, item.height - 10);
                    break;
                    
                case 'leaf':
                    drawPixelLeaf(item.x, item.y, item.width, item.height, '#32CD32');
                    break;
                    
                case 'boomerang':
                    ctx.fillStyle = '#4169E1';
                    // Draw boomerang shape
                    ctx.beginPath();
                    ctx.moveTo(item.x, item.y + item.height/2);
                    ctx.lineTo(item.x + item.width, item.y);
                    ctx.lineTo(item.x + item.width, item.y + item.height);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case 'shield':
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(item.x, item.y, item.width, item.height);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(item.x + 5, item.y + 5, item.width - 10, item.height - 10);
                    break;
                    
                case 'star':
                    ctx.fillStyle = '#FFD700';
                    // Draw star shape
                    const centerX = item.x + item.width/2;
                    const centerY = item.y + item.height/2;
                    const spikes = 5;
                    const outerRadius = item.width/2;
                    const innerRadius = outerRadius/2;
                    
                    ctx.beginPath();
                    for (let i = 0; i < spikes * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = (i * Math.PI) / spikes;
                        const x = centerX + Math.cos(angle) * radius;
                        const y = centerY + Math.sin(angle) * radius;
                        
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        }
    }
    
    function drawEnemies() {
        for (let enemy of enemies) {
            if (!isInViewport(enemy)) continue;
            
            // Draw enemy based on type
            ctx.fillStyle = enemy.color;
            
            switch(enemy.type) {
                case 'robot':
                case 'robot_basic':
                case 'robot_fast':
                case 'robot_shooter':
                case 'robot_strong':
                case 'robot_toxic':
                    // Draw robot body
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    
                    // Draw robot eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(enemy.x + 10, enemy.y + 10, 5, 5);
                    ctx.fillRect(enemy.x + enemy.width - 15, enemy.y + 10, 5, 5);
                    
                    // Special effects based on type
                    if (enemy.subtype === 'toxic') {
                        ctx.fillStyle = '#00FF00';
                        ctx.fillRect(enemy.x + enemy.width/2 - 5, enemy.y + enemy.height - 10, 10, 5);
                    } else if (enemy.subtype === 'shooter') {
                        ctx.fillStyle = '#4169E1';
                        ctx.fillRect(enemy.x + enemy.width/2 - 3, enemy.y, 6, 10);
                    }
                    break;
                    
                case 'snake':
                case 'snake_venom':
                    // Draw snake body
                    ctx.fillRect(enemy.x, enemy.y + enemy.height/3, enemy.width, enemy.height/3);
                    
                    // Draw snake head
                    ctx.fillRect(enemy.x + enemy.width - 15, enemy.y, 15, enemy.height);
                    
                    if (enemy.venomous) {
                        ctx.fillStyle = '#00FF00';
                        ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + enemy.height/2 - 2, 5, 4);
                    }
                    break;
                    
                case 'spider':
                case 'spider_web':
                    // Draw spider body
                    ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
                    
                    // Draw spider legs
                    for (let i = 0; i < 4; i++) {
                        ctx.fillRect(enemy.x, enemy.y + 5 + i*5, 5, 2);
                        ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 5 + i*5, 5, 2);
                    }
                    break;
                    
                case 'bat':
                    // Draw bat wings
                    ctx.fillStyle = enemy.color;
                    ctx.beginPath();
                    ctx.ellipse(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 
                               enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw bat body
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(enemy.x + enemy.width/2 - 3, enemy.y + enemy.height/2 - 3, 6, 6);
                    break;
                    
                case 'ghost':
                    ctx.globalAlpha = enemy.transparency || 0.7;
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    
                    // Ghost eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(enemy.x + 10, enemy.y + 15, 5, 5);
                    ctx.fillRect(enemy.x + enemy.width - 15, enemy.y + 15, 5, 5);
                    
                    ctx.globalAlpha = 1.0;
                    break;
                    
                case 'slime':
                    // Draw slime body (rounded)
                    ctx.beginPath();
                    ctx.ellipse(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 
                               enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Slime eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(enemy.x + enemy.width/3, enemy.y + enemy.height/3, 3, 3);
                    ctx.fillRect(enemy.x + 2*enemy.width/3 - 3, enemy.y + enemy.height/3, 3, 3);
                    break;
                    
                case 'boss_dragon':
                    // Draw dragon body
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    
                    // Dragon wings
                    ctx.fillStyle = '#8B0000';
                    ctx.beginPath();
                    ctx.moveTo(enemy.x + enemy.width/2, enemy.y + 20);
                    ctx.lineTo(enemy.x, enemy.y - 30);
                    ctx.lineTo(enemy.x + enemy.width/2, enemy.y + 20);
                    ctx.lineTo(enemy.x + enemy.width, enemy.y - 30);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Dragon fire breath indicator
                    if (enemy.attackCooldown < 1) {
                        ctx.fillStyle = '#FF4500';
                        ctx.fillRect(enemy.x + enemy.width, enemy.y + 30, 20, 10);
                    }
                    break;
                    
                default:
                    // Default rectangle for other enemies
                    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    
                    // Draw eyes for default enemies
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(enemy.x + 5, enemy.y + 5, 3, 3);
                    ctx.fillRect(enemy.x + enemy.width - 8, enemy.y + 5, 3, 3);
                    break;
            }
            
            // Health bar for enemies with more than 1 health
            if (enemy.maxHealth > 1) {
                const healthPercent = enemy.health / enemy.maxHealth;
                const barWidth = enemy.width;
                const barHeight = 5;
                
                // Background
                ctx.fillStyle = '#000000';
                ctx.fillRect(enemy.x, enemy.y - 10, barWidth, barHeight);
                
                // Health
                if (healthPercent > 0.6) ctx.fillStyle = '#00FF00';
                else if (healthPercent > 0.3) ctx.fillStyle = '#FFFF00';
                else ctx.fillStyle = '#FF0000';
                
                ctx.fillRect(enemy.x, enemy.y - 10, barWidth * healthPercent, barHeight);
                
                // Boss indicator
                if (enemy.isBoss) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = '10px Arial';
                    ctx.fillText('BOSS', enemy.x + enemy.width/2 - 15, enemy.y - 15);
                }
            }
        }
    }
    
    function drawProjectiles() {
        for (let proj of projectiles) {
            if (!isInViewport(proj)) continue;
            
            ctx.fillStyle = proj.color;
            
            if (proj.type === 'boomerang') {
                // Rotating boomerang
                ctx.save();
                const centerX = proj.x + proj.width/2;
                const centerY = proj.y + proj.height/2;
                ctx.translate(centerX, centerY);
                ctx.rotate(Date.now() / 200);
                ctx.fillRect(-proj.width/2, -proj.height/2, proj.width, proj.height);
                ctx.restore();
            } else {
                ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            }
        }
    }
    
    function drawEnemyProjectiles() {
        for (let proj of enemyProjectiles) {
            if (!isInViewport(proj)) continue;
            
            ctx.fillStyle = proj.color;
            ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        }
    }
    
    function drawParticles() {
        for (let particle of particles) {
            if (!isInViewport(particle)) continue;
            
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            ctx.globalAlpha = 1.0;
        }
    }
    
    function drawPlayer() {
        if (player.invincible) {
            const blink = Math.floor(Date.now() / 100) % 2 === 0;
            if (!blink) return;
        }
        
        // Draw player body
        ctx.fillStyle = player.hasShield ? '#4169E1' : '#FFD700';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Draw player face
        ctx.fillStyle = '#000000';
        
        // Eyes
        const eyeY = player.y + player.height/3;
        if (player.facingRight) {
            ctx.fillRect(player.x + player.width/3, eyeY, 4, 4);
            ctx.fillRect(player.x + 2*player.width/3 - 4, eyeY, 4, 4);
        } else {
            ctx.fillRect(player.x + player.width/3 - 4, eyeY, 4, 4);
            ctx.fillRect(player.x + 2*player.width/3, eyeY, 4, 4);
        }
        
        // Mouth
        const mouthY = player.y + 2*player.height/3;
        if (player.isJumping) {
            // Surprised mouth when jumping
            ctx.fillRect(player.x + player.width/2 - 3, mouthY, 6, 2);
        } else {
            // Smile when on ground
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, mouthY, 5, 0, Math.PI, false);
            ctx.fill();
        }
        
        // Shield effect
        if (player.hasShield) {
            ctx.strokeStyle = '#4169E1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, 
                   player.width/2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Attack effect
        if (player.isAttacking) {
            const attackWidth = 40;
            const attackHeight = 30;
            const attackX = player.facingRight ? 
                player.x + player.width : 
                player.x - attackWidth;
            const attackY = player.y + player.height/2 - attackHeight/2;
            
            const attackInfo = player.attackTypes[player.currentAttackType];
            ctx.fillStyle = attackInfo.color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(attackX, attackY, attackWidth, attackHeight);
            ctx.globalAlpha = 1.0;
            
            // Elemental effect
            if (player.attackElement) {
                ctx.fillStyle = player.attackElement === 'fire' ? '#FF0000' :
                               player.attackElement === 'ice' ? '#00FFFF' :
                               player.attackElement === 'electric' ? '#FFFF00' : '#FFFFFF';
                ctx.globalAlpha = 0.5;
                ctx.fillRect(attackX, attackY, attackWidth, attackHeight);
                ctx.globalAlpha = 1.0;
            }
        }
        
        // Jump booster effect
        if (player.jumpBoosterActive) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, 
                   player.width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    function drawFlag() {
        if (flag.collected || !isInViewport(flag)) return;
        
        // Flag pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(flag.x, flag.y, 5, flag.height);
        
        // Flag
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(flag.x + 5, flag.y);
        ctx.lineTo(flag.x + flag.width, flag.y + flag.height/3);
        ctx.lineTo(flag.x + 5, flag.y + 2*flag.height/3);
        ctx.closePath();
        ctx.fill();
        
        // Flag animation
        const wave = Math.sin(Date.now() / 300) * 3;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(flag.x + flag.width/2 + wave, flag.y + flag.height/6, 3, 3);
    }
    
    function drawUI() {
        // Mini map
        drawMiniMap();
        
        // Status bars
        drawStatusBars();
        
        // Game info
        drawGameInfo();
        
        // Pause indicator
        if (gameState.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
            
            ctx.font = '24px Arial';
            ctx.fillText('Tekan ESC untuk melanjutkan', canvas.width / 2, canvas.height / 2 + 50);
        }
        
        // Game over screen
        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.fillText(`Skor Akhir: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
            ctx.fillText(`Level: ${gameState.currentLevel}`, canvas.width / 2, canvas.height / 2 + 40);
            ctx.fillText('Klik "Ulangi" untuk mencoba lagi', canvas.width / 2, canvas.height / 2 + 90);
        }
    }
    
    function drawMiniMap() {
        const mapWidth = 150;
        const mapHeight = 100;
        const mapX = 10;
        const mapY = 10;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
        
        // Level boundaries
        const levelWidth = platforms[0].width;
        const scale = mapWidth / levelWidth;
        
        // Platforms
        ctx.fillStyle = '#4CAF50';
        for (let platform of platforms) {
            const platformX = mapX + platform.x * scale;
            const platformWidth = platform.width * scale;
            const platformHeight = 3;
            const platformY = mapY + mapHeight - platformHeight;
            
            ctx.fillRect(platformX, platformY, platformWidth, platformHeight);
        }
        
        // Player position
        ctx.fillStyle = '#FFD700';
        const playerX = mapX + player.x * scale;
        const playerY = mapY + mapHeight - 10;
        ctx.fillRect(playerX - 2, playerY - 2, 4, 4);
        
        // Flag position
        if (!flag.collected) {
            ctx.fillStyle = '#FF0000';
            const flagX = mapX + flag.x * scale;
            const flagY = mapY + mapHeight - 10;
            ctx.fillRect(flagX - 2, flagY - 2, 4, 4);
        }
        
        // Camera view
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        const cameraX = mapX + gameState.camera.x * scale;
        const cameraWidth = gameState.camera.width * scale;
        const cameraHeight = mapHeight;
        ctx.strokeRect(cameraX, mapY, cameraWidth, cameraHeight);
    }
    
    function drawStatusBars() {
        const barX = canvas.width - 160;
        const barY = 10;
        const barWidth = 150;
        const barHeight = 15;
        
        // Time bar
        const timePercent = gameState.timeLeft / levelConfigs[gameState.currentLevel].time;
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = timePercent > 0.3 ? '#4CAF50' : '#FF5252';
        ctx.fillRect(barX, barY, barWidth * timePercent, barHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Time: ${Math.floor(gameState.timeLeft)}s`, barX + barWidth/2, barY + barHeight/2);
        
        // Lives indicator
        const livesX = barX;
        const livesY = barY + 30;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Lives: ${gameState.lives}`, livesX, livesY);
        
        // Draw hearts
        for (let i = 0; i < gameState.lives; i++) {
            ctx.fillStyle = '#FF5252';
            ctx.fillRect(livesX + 60 + i * 12, livesY - 10, 10, 10);
        }
    }
    
    function drawGameInfo() {
        const infoX = 10;
        const infoY = canvas.height - 80;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(infoX, infoY, 200, 70);
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(infoX, infoY, 200, 70);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        
        ctx.fillText(`Level: ${gameState.currentLevel}/${gameState.maxLevel}`, infoX + 10, infoY + 20);
        ctx.fillText(`Score: ${gameState.score}`, infoX + 10, infoY + 40);
        ctx.fillText(`Combo: ${player.comboCount}`, infoX + 10, infoY + 60);
        
        // Elemental attack indicator
        if (player.hasElementalAttack) {
            ctx.fillStyle = player.attackElement === 'fire' ? '#FF0000' :
                           player.attackElement === 'ice' ? '#00FFFF' :
                           player.attackElement === 'electric' ? '#FFFF00' : '#FFFFFF';
            ctx.fillRect(infoX + 180, infoY + 10, 10, 10);
        }
    }
    
    function drawComboCounter() {
        const comboX = canvas.width / 2;
        const comboY = 50;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(comboX - 50, comboY - 25, 100, 50);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(comboX - 50, comboY - 25, 100, 50);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`COMBO x${player.comboCount}`, comboX, comboY);
        
        // Combo timer indicator
        const timeSinceLastAttack = Date.now() / 1000 - player.lastAttackTime;
        const comboTimeLeft = player.comboWindow - timeSinceLastAttack;
        if (comboTimeLeft > 0) {
            const barWidth = 80;
            const barHeight = 5;
            const barX = comboX - barWidth/2;
            const barY = comboY + 20;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(barX, barY, barWidth * (comboTimeLeft / player.comboWindow), barHeight);
        }
    }
    
    function drawElementalIndicator() {
        const elementX = canvas.width - 50;
        const elementY = 50;
        const size = 30;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(elementX - size/2, elementY - size/2, size, size);
        
        ctx.fillStyle = player.attackElement === 'fire' ? '#FF0000' :
                       player.attackElement === 'ice' ? '#00FFFF' :
                       player.attackElement === 'electric' ? '#FFFF00' : '#FFFFFF';
        ctx.fillRect(elementX - size/2 + 5, elementY - size/2 + 5, size - 10, size - 10);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(player.attackElement.toUpperCase(), elementX, elementY + size/2 + 10);
    }
    
    function drawStatusEffects() {
        const effectsX = canvas.width - 50;
        const effectsY = 100;
        const effectSize = 20;
        
        let effectCount = 0;
        
        if (player.isPoisoned) {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(effectsX - effectSize/2, effectsY + effectCount * 25, effectSize, effectSize);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '8px Arial';
            ctx.fillText('P', effectsX, effectsY + effectCount * 25 + effectSize/2 + 3);
            effectCount++;
        }
        
        if (player.isSlowed) {
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(effectsX - effectSize/2, effectsY + effectCount * 25, effectSize, effectSize);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '8px Arial';
            ctx.fillText('S', effectsX, effectsY + effectCount * 25 + effectSize/2 + 3);
            effectCount++;
        }
        
        if (player.isBurning) {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(effectsX - effectSize/2, effectsY + effectCount * 25, effectSize, effectSize);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '8px Arial';
            ctx.fillText('B', effectsX, effectsY + effectCount * 25 + effectSize/2 + 3);
            effectCount++;
        }
    }
    
    // ========== START THE GAME ==========
    init();
});