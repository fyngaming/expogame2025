// =============================================
// KOKO ADVENTURE v4.0 - 10 LEVEL COMPLETE
// Sistem Damage Lengkap dengan Elemental & Armor Types
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Koko Adventure v4.0 - Sistem Damage Komprehensif!");
    console.log("✨ FITUR: Elemental Damage, Armor Types, Combo System");
    
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
        }
    };

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
        jumpPower: 450,
        jumpSpeedBoost: 1.8,
        isJumping: false,
        facingRight: true,
        hasBoomerang: false,
        hasShield: false,
        shieldTime: 0,
        invincible: false,
        invincibleTimer: 0,
        
        // ===== SISTEM LOMPATAN =====
        canDoubleJump: true,
        doubleJumpUsed: false,
        maxDoubleJumps: 1,
        airControl: 0.85,
        jumpBuffer: 0,
        jumpBufferTime: 0.15,
        coyoteTime: 0,
        coyoteTimeMax: 0.1,
        jumpRequested: false,
        
        // ===== FISIKA =====
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
        
        // ===== DAMAGE COOLDOWN =====
        lastPlatformDamage: 0,
        
        // ===== SISTEM SERANGAN =====
        attackCooldown: 0,
        attackCooldownTime: 0.3,
        canAttack: true,
        comboCount: 0,
        lastAttackTime: 0,
        comboWindow: 0.8,
        isAttacking: false,
        attackDuration: 0.2,
        attackTimer: 0,
        
        // ===== ATTACK TYPES & ELEMENTS =====
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
        player.jumpPower = 500;
        setTimeout(() => {
            player.speed = 180;
            player.jumpPower = 380;
        }, 10000);
        console.log(`⚡ SPEED BOOST: Activated for 10 seconds!`);
    }
    
    function debugPlatformCollisions() {
        if (gameState.currentLevel !== 4) return;
        
        console.log("🔍 Platform Collision Debug:");
        console.log("📍 Player:", {x: player.x, y: player.y, isJumping: player.isJumping, onGround: player.onGround});
        console.log("📏 Platform Count:", platforms.length);
        
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            
            // Cek collision secara manual
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
    
    // ========== ENEMY CREATION FUNCTIONS WITH DAMAGE SYSTEM ==========
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
            // ===== DAMAGE SYSTEM =====
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
    
    // ========== INITIALIZE GAME ==========
    function init() {
        console.log("🚀 Inisialisasi game dengan sistem damage...");
        
        setupLevel(1);
        drawStartScreen();
        setupEventListeners();
        updateGameStats();
        updateLevelButtons();
        
        requestAnimationFrame(animate);
        
        console.log("✅ Game siap dimainkan!");
    }
    
    // ========== SETUP LEVEL ==========
    function setupLevel(level) {
        console.log(`🔄 Setup Level ${level}: ${levelConfigs[level].name}`);
        
        const config = levelConfigs[level];
        gameState.currentLevel = level;
        gameState.timeLeft = config.time;
        gameState.lives = Math.min(5 + Math.floor(level/2), 10);
        gameState.win = false;
        gameState.gameOver = false;
        gameState.running = false;
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
        
        updateGameStats();
        updateLevelButtons();
        hideNextLevelButton();
        
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
    }

    // ========== DAMAGE CALCULATION SYSTEM ==========
    function calculateDamageToEnemy(baseDamage, enemy, attackType = 'physical', attackElement = null) {
        let finalDamage = baseDamage;
        
        // DAMAGE MULTIPLIER BASED ON ENEMY TYPE
        finalDamage *= enemy.damageMultiplier || 1.0;
        
        // ELEMENTAL WEAKNESS/RESISTANCE
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
        
        // SPECIAL CASES
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
        
        // COMBO BONUS
        if (player.comboCount >= 3) {
            finalDamage *= 1.5;
        }
        
        // Ensure minimum damage
        finalDamage = Math.max(1, Math.round(finalDamage));
        
        return finalDamage;
    }
    
    function calculateDamageToPlayer(enemy) {
        let damage = enemy.baseDamage || 1;
        
        // Player armor/defense calculations
        if (player.hasShield) {
            damage *= 0.5;
        }
        
        if (player.invincible) {
            damage = 0;
        }
        
        // SPECIAL ENEMY ATTACKS
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
        
        // LEVEL SCALING
        damage += Math.floor(gameState.currentLevel / 3);
        
        return Math.max(1, damage);
    }
    
    // ========== ATTACK FUNCTIONS ==========
    function performMeleeAttack() {
        if (!gameState.running || gameState.paused) return;
        if (!player.canAttack) return;
        
        console.log("👊 Melee attack performed!");
        
        // Determine attack type based on combo
        let attackType = 'basic';
        if (player.comboCount === 2) attackType = 'combo1';
        if (player.comboCount >= 3) attackType = 'combo2';
        
        player.currentAttackType = attackType;
        
        // Set attack state
        player.isAttacking = true;
        player.attackTimer = player.attackDuration;
        player.canAttack = false;
        player.attackCooldown = player.attackCooldownTime;
        player.lastAttackTime = Date.now() / 1000;
        
        // COMBO SYSTEM
        player.comboCount++;
        if (player.comboCount > 3) player.comboCount = 3;
        
        // Get base damage from attack type
        const attackInfo = player.attackTypes[attackType];
        let baseDamage = attackInfo.damage;
        
        // Apply elemental damage if player has elemental attack
        let attackElement = player.attackElement;
        
        // Visual effects based on combo and element
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
        
        // Define attack hitbox
        const attackRange = 50 + player.comboCount * 10;
        const attackWidth = 40 + player.comboCount * 5;
        const attackHeight = 30;
        
        const attackX = player.facingRight ? 
            player.x + player.width : 
            player.x - attackWidth;
        const attackY = player.y + player.height/2 - attackHeight/2;
        
        let hitCount = 0;
        
        // Check collision with enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            // Simple rectangle collision
            if (attackX < enemy.x + enemy.width &&
                attackX + attackWidth > enemy.x &&
                attackY < enemy.y + enemy.height &&
                attackY + attackHeight > enemy.y) {
                
                hitCount++;
                
                // Calculate final damage with enemy resistance/weakness
                const finalDamage = calculateDamageToEnemy(
                    baseDamage, 
                    enemy, 
                    attackInfo.type, 
                    attackElement
                );
                
                console.log(`💥 Hit ${enemy.type}! Base: ${baseDamage}, Final: ${finalDamage}, Combo: ${player.comboCount}`);
                
                // Apply damage
                enemy.health -= finalDamage;
                
                // Visual feedback based on damage type
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
                
                // Score based on damage and combo
                const scoreMultiplier = player.comboCount;
                const damageScore = finalDamage * 10 * scoreMultiplier;
                gameState.score += damageScore;
                
                // Special effects based on enemy type
                applyEnemyHitEffects(enemy, attackInfo.type, attackElement);
                
                // Check if enemy is defeated
                if (enemy.health <= 0) {
                    const defeatScore = calculateDefeatScore(enemy, player.comboCount);
                    gameState.score += defeatScore;
                    
                    // Special defeat effects
                    applyEnemyDefeatEffects(enemy);
                    
                    enemies.splice(i, 1);
                    
                    createParticles(
                        enemy.x + enemy.width/2, 
                        enemy.y + enemy.height/2, 
                        20 + player.comboCount * 5, 
                        '#FF4500'
                    );
                    
                    // Chance to drop item based on enemy type
                    dropItemFromEnemy(enemy);
                    
                    console.log(`🎯 ${enemy.type} defeated! Score: +${defeatScore}`);
                } else {
                    // Knockback effect only if not defeated
                    const knockbackPower = attackInfo.knockback;
                    const knockbackDirection = player.facingRight ? 1 : -1;
                    enemy.x += knockbackDirection * knockbackPower;
                    
                    // Visual feedback for hit but not defeated
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
        
        // If no enemies hit, reset combo after a while
        if (hitCount === 0 && player.comboCount > 1) {
            setTimeout(() => {
                if (Date.now() / 1000 - player.lastAttackTime > 1) {
                    player.comboCount = 0;
                    console.log("🔄 Combo reset (no hits)");
                }
            }, 1000);
        }
        
        // COMBO UI FEEDBACK
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
        
        // Combo multiplier
        const comboMultiplier = 1 + (combo * 0.5);
        
        // Level multiplier
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
        
        document.addEventListener('keydown', function(e) {
            console.log("⌨️ Key pressed:", e.key);
            
            // ==== CEK TOMBOL CONTROL DITEKAN ====
            if (e.key === 'Control') {
                keys['Control'] = true;
            }
            
            // ==== CHEAT: SKIP LEVEL (Ctrl + S) ====
            if (keys['Control'] && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                console.log("🚀 CHEAT ACTIVATED: Skip to next level!");
                skipToNextLevel();
                return;
            }
            
            // ==== CHEAT: GOD MODE (Ctrl + G) ====
            if (keys['Control'] && (e.key === 'g' || e.key === 'G')) {
                e.preventDefault();
                toggleGodMode();
                return;
            }
            
            // ==== CHEAT: UNLOCK ALL LEVELS (Ctrl + U) ====
            if (keys['Control'] && (e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
                unlockAllLevels();
                return;
            }
            
            // ==== CHEAT: ADD SCORE (Ctrl + D) ====
            if (keys['Control'] && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                addCheatScore();
                return;
            }
            
            // ==== CHEAT: SPEED BOOST (Ctrl + B) ====
            if (keys['Control'] && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                activateSpeedBoost();
                return;
            }
            
            // ==== CHEAT: DEBUG PLATFORM (Ctrl + P) ====
            if (keys['Control'] && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                debugPlatformCollisions();
                return;
            }
            
            // ==== MENCEGAH SCROLL UNTUK TOMBOL GAME ====
            const gameKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'x', 'X', 'z', 'Z'];
            if (gameKeys.includes(e.key)) {
                e.preventDefault();
            }
            
            keys[e.key] = true;
            
            // ==== LOMPATAN ====
            if (e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'ArrowUp') {
                // Lompatan ditangani di handleJumpInput
            }
            
            // ==== SUPER JUMP (Ctrl + Space) ====
            if (keys['Control'] && (e.key === ' ' || e.key === 'x' || e.key === 'X')) {
                if (!player.isJumping && gameState.running && !gameState.paused) {
                    player.velocityY = -player.jumpPower * 2;
                    player.isJumping = true;
                    player.onGround = false;
                    player.doubleJumpUsed = false;
                    console.log("🚀 SUPER JUMP!");
                    createParticles(player.x + player.width/2, player.y + player.height/2, 20, '#FF00FF');
                }
            }
            
            // ==== SERANGAN / BOOMERANG ====
            if (e.key === 'z' || e.key === 'Z') {
                if (gameState.running && !gameState.paused) {
                    if (player.hasBoomerang) {
                        throwBoomerang();
                        console.log("🌀 Boomerang thrown!");
                    } else {
                        performMeleeAttack();
                        console.log("👊 Melee attack!");
                    }
                }
            }
            
            // ==== ELEMENTAL ATTACKS (CHEAT) ====
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
            
            // ==== PAUSE GAME ====
            if (e.key === 'Escape') {
                togglePause();
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', function(e) {
            // ==== RESET TOMBOL CONTROL ====
            if (e.key === 'Control') {
                keys['Control'] = false;
            }
            
            keys[e.key] = false;
            
            // Reset jump request
            if (e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'ArrowUp') {
                player.jumpRequested = false;
            }
        });
        
        // ==== TOMBOL START ====
        const startBtn = document.getElementById('startBtn');
        console.log("🔧 Start button element:", startBtn);
        
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                console.log("🖱️ ===== START BUTTON CLICKED =====");
                console.log("📊 Current game state:", {
                    gameStarted: gameState.gameStarted,
                    gameOver: gameState.gameOver,
                    win: gameState.win,
                    running: gameState.running,
                    paused: gameState.paused
                });
                
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
        
        // ==== TOMBOL PAUSE ====
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', togglePause);
        }
        
        // ==== TOMBOL RESET ====
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', restartGame);
        }
        
        // ==== TOMBOL SOUND ====
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', toggleSound);
        }
        
        // ==== TOMBOL NEXT LEVEL ====
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', function() {
                console.log("➡️ Next level button clicked");
                if (gameState.currentLevel < gameState.maxLevel && 
                    gameState.currentLevel + 1 <= gameState.unlockedLevel) {
                    setupLevel(gameState.currentLevel + 1);
                    startGame();
                    hideNextLevelButton();
                }
            });
        }
        
        // ==== TOMBOL LEVEL SELECTION ====
        const levelButtons = document.querySelectorAll('.level-btn');
        console.log("🔧 Level buttons found:", levelButtons.length);
        
        levelButtons.forEach(btn => {
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
        });
        
        // ==== MOBILE CONTROLS ====
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const upBtn = document.getElementById('upBtn');
        const attackBtn = document.getElementById('attackBtn');
        const boomerangBtn = document.getElementById('boomerangBtn');
        
        console.log("🔧 Mobile controls:", {
            leftBtn: !!leftBtn,
            rightBtn: !!rightBtn,
            upBtn: !!upBtn,
            attackBtn: !!attackBtn,
            boomerangBtn: !!boomerangBtn
        });
        
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                keys['ArrowLeft'] = true;
            });
            leftBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys['ArrowLeft'] = false;
            });
        }
        
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                keys['ArrowRight'] = true;
            });
            rightBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys['ArrowRight'] = false;
            });
        }
        
        if (upBtn) {
            upBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                keys['ArrowUp'] = true;
                player.jumpRequested = true;
            });
            upBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys['ArrowUp'] = false;
                player.jumpRequested = false;
            });
        }
        
        if (attackBtn) {
            attackBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                console.log("📱 Attack button (mobile) pressed");
                if (gameState.running && !gameState.paused) {
                    if (player.hasBoomerang) {
                        throwBoomerang();
                    } else {
                        performMeleeAttack();
                    }
                }
            });
        } else {
            console.error("❌ ERROR: Attack button (mobile) not found!");
        }
        
        if (boomerangBtn) {
            boomerangBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                console.log("📱 Boomerang button (mobile) pressed");
                if (gameState.running && !gameState.paused && player.hasBoomerang) {
                    throwBoomerang();
                } else if (gameState.running && !gameState.paused) {
                    performMeleeAttack();
                }
            });
        }
        
        // ==== WINDOW FOCUS/BLUR ====
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
        
        console.log("✅ Event listeners setup complete!");
    }
    
    // ========== GAME CONTROLS ==========
    function startGame() {
        console.log("🚀 ===== START GAME FUNCTION CALLED =====");
        console.log("📊 Before start:", {
            running: gameState.running,
            gameStarted: gameState.gameStarted,
            gameOver: gameState.gameOver,
            win: gameState.win
        });
        
        gameState.running = true;
        gameState.gameStarted = true;
        gameState.gameOver = false;
        gameState.win = false;
        gameState.paused = false;
        gameState.lastTime = performance.now();
        
        console.log("📊 After start:", {
            running: gameState.running,
            gameStarted: gameState.gameStarted,
            gameOver: gameState.gameOver,
            win: gameState.win
        });
        
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
        console.log("🔄 Restarting game...");
        gameState.score = 0;
        gameState.lives = 5;
        gameState.timeLeft = levelConfigs[gameState.currentLevel].time;
        gameState.gameOver = false;
        gameState.win = false;
        gameState.running = true;
        
        setupLevel(gameState.currentLevel);
        startGame();
        hideNextLevelButton();
        
        console.log("✅ Game restarted!");
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
        updatePlayer(deltaTime);
        updatePlatforms(deltaTime);
        updateEnemies(deltaTime);
        updateItems(deltaTime);
        updateProjectiles(deltaTime);
        updateEnemyProjectiles(deltaTime);
        updateParticles(deltaTime);
        updatePlayerTimers(deltaTime);
        updateGameTimer(deltaTime);
        checkCollisions();
        checkWinCondition();
        checkGameOver();
        updateCamera();
        updateStatusEffects(deltaTime);
    }
    
    function updatePlayer(deltaTime) {
        // ===== HANDLE JUMP INPUT =====
        handleJumpInput(deltaTime);
        
        // ===== INPUT GERAKAN =====
        let targetVelocityX = 0;
        
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            targetVelocityX = -1;
            player.facingRight = false;
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            targetVelocityX = 1;
            player.facingRight = true;
        }
        
        // ===== KONTROL DI UDARA & DI TANAH =====
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
        
        // ===== APLIKASI GRAVITY =====
        player.velocityY += player.gravity * deltaTime;
        player.velocityY = Math.min(player.velocityY, player.maxFallSpeed);
        
        // Update posisi
        player.x += player.velocityX * deltaTime;
        player.y += player.velocityY * deltaTime;
        
        // ===== KONTROL DI UDARA =====
        if (player.isJumping) {
            const airSpeed = player.speed * player.airControl * player.jumpSpeedBoost;
            
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
                player.velocityX = Math.max(-airSpeed, player.velocityX - 80 * deltaTime);
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                player.velocityX = Math.min(airSpeed, player.velocityX + 80 * deltaTime);
            }
        }
        
        // ===== UPDATE ATTACK TIMERS =====
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
        
        // ===== COMBO SYSTEM =====
        const currentTime = Date.now() / 1000;
        if (currentTime - player.lastAttackTime > player.comboWindow) {
            player.comboCount = 0;
        }
        
        // Batas layar
        if (player.x < 0) {
            player.x = 0;
            if (player.velocityX < 0) player.velocityX = 0;
        }
        
        const maxX = platforms[0].width - player.width;
        if (player.x > maxX) {
            player.x = maxX;
            if (player.velocityX > 0) player.velocityX = 0;
        }
        
        // ===== DETEKSI PLATFORM =====
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
            player.jumpPower = 480;
            player.airControl = 0.9;
            player.jumpSpeedBoost = 2.0;
            
            if (player.jumpRequested && 
                player.isJumping && 
                !player.doubleJumpUsed &&
                player.velocityY > -player.jumpPower * 0.7) {
                
                player.velocityY = -player.jumpPower * 0.95;
                player.doubleJumpUsed = true;
                player.jumpBuffer = 0;
                
                console.log("🦅 Double jump (Level 4 boost)!");
                createParticles(player.x + player.width/2, player.y + player.height/2, 12, '#00FFFF');
            }
        }
    }
    
    function handleJumpInput(deltaTime) {
        if ((keys[' '] || keys['x'] || keys['X'] || keys['ArrowUp']) && 
            gameState.running && !gameState.paused) {
            player.jumpBuffer = player.jumpBufferTime;
            player.jumpRequested = true;
        } else {
            player.jumpBuffer = Math.max(0, player.jumpBuffer - deltaTime);
            player.jumpRequested = false;
        }
        
        if (!player.isJumping && player.onGround) {
            player.coyoteTime = player.coyoteTimeMax;
        } else {
            player.coyoteTime = Math.max(0, player.coyoteTime - deltaTime);
        }
        
        if (player.jumpBuffer > 0 && !player.isJumping && player.coyoteTime > 0) {
            player.velocityY = -player.jumpPower;
            player.isJumping = true;
            player.onGround = false;
            player.doubleJumpUsed = false;
            player.jumpBuffer = 0;
            
            console.log("⬆️ Normal jump!");
            createParticles(player.x + player.width/2, player.y + player.height/2, 8, '#00FF00');
        }
        
        if (player.jumpRequested && 
            player.isJumping && 
            player.canDoubleJump && 
            !player.doubleJumpUsed &&
            player.velocityY > -player.jumpPower * 0.6) {
            
            player.velocityY = -player.jumpPower * 0.85;
            player.doubleJumpUsed = true;
            player.jumpBuffer = 0;
            
            console.log("🦅 Double jump!");
            createParticles(player.x + player.width/2, player.y + player.height/2, 10, '#00FFFF');
            
            if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                player.velocityX = Math.min(player.maxHorizontalSpeed * 1.3, player.velocityX + 120);
            }
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
                player.velocityX = Math.max(-player.maxHorizontalSpeed * 1.3, player.velocityX - 120);
            }
        }
        
        if (player.isJumping && player.velocityY < -100) {
            if (!(keys[' '] || keys['x'] || keys['X'] || keys['ArrowUp'])) {
                player.velocityY *= player.jumpCutMultiplier;
            }
        }
    }
    
    function updateStatusEffects(deltaTime) {
        // Poison effect
        if (player.isPoisoned) {
            player.poisonTimer -= deltaTime;
            if (player.poisonTimer <= 0) {
                player.isPoisoned = false;
                takeDamage(1, 'poison');
                player.poisonTimer = 2;
                createParticles(player.x + player.width/2, player.y + player.height/2, 5, '#00FF00');
            }
        }
        
        // Slow effect
        if (player.isSlowed) {
            player.slowTimer -= deltaTime;
            if (player.slowTimer <= 0) {
                player.isSlowed = false;
                player.speed = 180;
                player.jumpPower = 450;
            }
        }
        
        // Burn effect
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
                
                // Check boomerang collision with enemies
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
        
        // ==== ENEMY COLLISIONS ====
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
                
                // Player jumping on enemy
                if (player.velocityY > 0 && dy > 0) {
                    const stompDamage = player.attackTypes.jumpAttack.damage;
                    const finalDamage = calculateDamageToEnemy(stompDamage, enemy, 'crush', null);
                    
                    enemy.health -= finalDamage;
                    
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 
                                  15 + finalDamage, '#FFD700');
                    
                    player.velocityY = -player.jumpPower * 0.7;
                    
                    gameState.score += 30 + (finalDamage * 5);
                    
                    if (enemy.health <= 0) {
                        const defeatScore = calculateDefeatScore(enemy, 1);
                        gameState.score += defeatScore;
                        enemies.splice(i, 1);
                        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 25, '#FF4500');
                        
                        dropItemFromEnemy(enemy);
                    }
                } else {
                    // Player taking damage from enemy
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
                    
                    // Special enemy attack effects
                    applyEnemyAttackEffects(enemy);
                }
            }
        }
        
        // ==== ITEM COLLISIONS ====
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
        
        // ==== FLAG COLLISION ====
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
                        player.jumpPower = 450;
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
    
    function winLevel() {
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
        
        updateGameStats();
        updateLevelButtons();
        
        setTimeout(() => {
            showLevelCompletePopup(timeBonus, livesBonus, levelBonus);
        }, 1000);
    }
    
    function gameOver() {
        gameState.gameOver = true;
        gameState.running = false;
        
        setTimeout(() => {
            alert(`Game Over!\nSkor akhir: ${gameState.score}\nLevel yang dicapai: ${gameState.currentLevel}`);
        }, 500);
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
    
    // ========== UI FUNCTIONS ==========
    function updateGameStats() {
        const livesEl = document.getElementById('lives');
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const timerEl = document.getElementById('timer');
        const unlockedLevelEl = document.getElementById('unlockedLevel');
        
        if (livesEl) livesEl.textContent = gameState.lives;
        if (scoreEl) scoreEl.textContent = gameState.score;
        if (levelEl) levelEl.textContent = `Level ${gameState.currentLevel}/10`;
        if (timerEl) timerEl.textContent = Math.floor(gameState.timeLeft);
        if (unlockedLevelEl) unlockedLevelEl.textContent = gameState.unlockedLevel;
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
                </div>
                <div class="popup-buttons">
                    <button class="popup-btn next">Level Berikutnya</button>
                    <button class="popup-btn retry">Ulangi Level</button>
                    <button class="popup-btn menu">Menu Utama</button>
                </div>
            `;
            document.body.appendChild(popup);
            
            popup.querySelector('.popup-btn.next').addEventListener('click', function() {
                if (gameState.currentLevel < gameState.maxLevel) {
                    setupLevel(gameState.currentLevel + 1);
                    startGame();
                }
                overlay.classList.remove('show');
                popup.classList.remove('show');
            });
            
            popup.querySelector('.popup-btn.retry').addEventListener('click', function() {
                restartGame();
                overlay.classList.remove('show');
                popup.classList.remove('show');
            });
            
            popup.querySelector('.popup-btn.menu').addEventListener('click', function() {
                gameState.running = false;
                gameState.gameStarted = false;
                document.getElementById('startBtn').innerHTML = '<i class="fas fa-play"></i> Mulai Game';
                overlay.classList.remove('show');
                popup.classList.remove('show');
            });
        } else {
            popup.querySelector('h2').innerHTML = `<i class="fas fa-trophy"></i> Level ${gameState.currentLevel} Selesai!`;
            popup.querySelectorAll('.stats span')[0].textContent = timeBonus;
            popup.querySelectorAll('.stats span')[1].textContent = livesBonus;
            popup.querySelectorAll('.stats span')[2].textContent = levelBonus;
            popup.querySelectorAll('.stats span')[3].textContent = gameState.score;
            
            const nextBtn = popup.querySelector('.popup-btn.next');
            if (gameState.currentLevel < gameState.maxLevel) {
                nextBtn.textContent = 'Level Berikutnya';
                nextBtn.disabled = false;
            } else {
                nextBtn.textContent = 'Game Selesai!';
                nextBtn.disabled = true;
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
        
        if (!gameState.gameStarted) {
            drawStartScreen();
            return;
        }
        
        if (gameState.gameOver) {
            drawGameOverScreen();
            return;
        }
        
        if (gameState.win) {
            drawWinScreen();
            return;
        }
        
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
        
        // Draw combo counter
        if (player.comboCount > 1 && gameState.running && !gameState.paused) {
            drawComboCounter();
        }
        
        // Draw elemental indicator
        if (player.attackElement && gameState.running && !gameState.paused) {
            drawElementalIndicator();
        }
        
        // Draw status effects
        drawStatusEffects();
    }
    
    function drawComboCounter() {
        const comboX = canvas.width / 2;
        const comboY = 50;
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`COMBO x${player.comboCount}!`, comboX, comboY);
        
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 10;
        ctx.fillText(`COMBO x${player.comboCount}!`, comboX, comboY);
        ctx.shadowBlur = 0;
    }
    
    function drawElementalIndicator() {
        const elemX = canvas.width - 100;
        const elemY = 80;
        
        let elementColor = '#FFFFFF';
        let elementSymbol = '❓';
        
        switch(player.attackElement) {
            case 'fire':
                elementColor = '#FF4500';
                elementSymbol = '🔥';
                break;
            case 'ice':
                elementColor = '#00FFFF';
                elementSymbol = '❄️';
                break;
            case 'electric':
                elementColor = '#FFFF00';
                elementSymbol = '⚡';
                break;
        }
        
        ctx.fillStyle = elementColor;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(elementSymbol, elemX, elemY);
        
        ctx.font = '14px Arial';
        ctx.fillText(player.attackElement.toUpperCase(), elemX, elemY + 25);
    }
    
    function drawStatusEffects() {
        let yPos = 100;
        
        if (player.isPoisoned) {
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('☠️ Poisoned', 20, yPos);
            yPos += 25;
        }
        
        if (player.isSlowed) {
            ctx.fillStyle = '#00FFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('🐌 Slowed', 20, yPos);
            yPos += 25;
        }
        
        if (player.isBurning) {
            ctx.fillStyle = '#FF4500';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('🔥 Burning', 20, yPos);
            yPos += 25;
        }
    }
    
    function drawStartScreen() {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a472a');
        gradient.addColorStop(1, '#2a623d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('KOKO ADVENTURE', canvas.width/2, canvas.height/3);
        
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '24px Arial';
        ctx.fillText('v4.0 - Sistem Damage Lengkap', canvas.width/2, canvas.height/3 + 60);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.fillText('🎮 SISTEM DAMAGE: Elemental, Armor Types, Combo 🎮', canvas.width/2, canvas.height/2);
        
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '18px Arial';
        ctx.fillText('Tekan tombol "Mulai Game" untuk memulai', canvas.width/2, canvas.height/2 + 50);
        
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '18px Arial';
        ctx.fillText('Kontrol:', canvas.width/2, canvas.height/2 + 100);
        ctx.fillText('← → : Gerak | ↑/Spasi/X : Lompat | Z : Serang', canvas.width/2, canvas.height/2 + 130);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`Level Terbuka: ${gameState.unlockedLevel}/10`, canvas.width/2, canvas.height/2 + 180);
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('Selamat Bertualang!', canvas.width/2, canvas.height - 100);
    }
    
    function drawBackground() {
        const config = levelConfigs[gameState.currentLevel];
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        switch(config.theme) {
            case 'day':
                skyGradient.addColorStop(0, '#87CEFA');
                skyGradient.addColorStop(1, '#98FB98');
                break;
            case 'night':
                skyGradient.addColorStop(0, '#0A0A2A');
                skyGradient.addColorStop(1, '#1A472A');
                break;
            case 'fog':
                skyGradient.addColorStop(0, '#778899');
                skyGradient.addColorStop(1, '#8FBC8F');
                break;
            case 'toxic':
                skyGradient.addColorStop(0, '#556B2F');
                skyGradient.addColorStop(1, '#6B8E23');
                break;
            case 'mountain':
                skyGradient.addColorStop(0, '#4682B4');
                skyGradient.addColorStop(1, '#98FB98');
                break;
            case 'magic':
                skyGradient.addColorStop(0, '#4B0082');
                skyGradient.addColorStop(1, '#9370DB');
                break;
            case 'fire':
                skyGradient.addColorStop(0, '#8B0000');
                skyGradient.addColorStop(1, '#FF4500');
                break;
            case 'boss':
                skyGradient.addColorStop(0, '#2F4F4F');
                skyGradient.addColorStop(1, '#8B0000');
                break;
            default:
                skyGradient.addColorStop(0, '#87CEEB');
                skyGradient.addColorStop(1, '#90EE90');
        }
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(gameState.camera.x, gameState.camera.y, canvas.width, canvas.height);
        
        if (config.theme === 'day') {
            const sunX = gameState.camera.x + 50;
            const sunY = gameState.camera.y + 50;
            
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    if ((i === 2 || j === 2) || (i > 0 && i < 4 && j > 0 && j < 4)) {
                        ctx.fillRect(sunX + i*4, sunY + j*4, 4, 4);
                    }
                }
            }
        } else if (config.theme === 'night') {
            const moonX = gameState.camera.x + 50;
            const moonY = gameState.camera.y + 50;
            
            ctx.fillStyle = '#F0F8FF';
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    if (i >= 2 || j >= 2) {
                        ctx.fillRect(moonX + i*4, moonY + j*4, 4, 4);
                    }
                }
            }
        }
        
        if (config.theme === 'day' || config.theme === 'mountain') {
            for (let cloud of backgroundElements.filter(e => e.type === 'cloud')) {
                const parallaxOffset = gameState.camera.x * 0.3;
                const cloudX = cloud.x - parallaxOffset;
                const cloudY = cloud.y - gameState.camera.y * 0.1;
                
                if (cloudX + cloud.width > gameState.camera.x && 
                    cloudX < gameState.camera.x + canvas.width) {
                    drawPixelCloud(cloudX, cloudY, cloud.width, cloud.height);
                }
            }
        }
        
        if (config.theme === 'mountain') {
            for (let element of backgroundElements.filter(e => e.type === 'mountain')) {
                const parallaxOffset = gameState.camera.x * 0.5;
                const mountainX = element.x - parallaxOffset;
                const mountainY = element.y - gameState.camera.y * 0.2;
                
                if (mountainX + element.width > gameState.camera.x && 
                    mountainX < gameState.camera.x + canvas.width) {
                    drawPixelMountain(mountainX, mountainY, element.width, element.height, element.color);
                }
            }
        }
        
        for (let element of backgroundElements) {
            const drawX = element.x;
            const drawY = element.y;
            
            if (isInViewport(element)) {
                if (element.type === 'tree') {
                    let treeX = drawX;
                    let treeY = drawY - element.height;
                    
                    if (element.layer === 'back') {
                        treeX = drawX - gameState.camera.x * 0.7;
                        treeY = (drawY - element.height) - gameState.camera.y * 0.1;
                    }
                    
                    drawPixelTree(treeX, treeY, element.width, element.height);
                }
                if (element.type === 'bush') {
                    drawPixelBush(drawX, drawY, element.width, element.height);
                }
                if (element.type === 'log') {
                    drawPixelLog(drawX, drawY, element.width, element.height);
                }
            }
        }
        
        if (config.theme === 'night' || config.theme === 'magic') {
            for (let element of backgroundElements.filter(e => e.type === 'star')) {
                const starX = element.x;
                const starY = element.y;
                
                if (starX > gameState.camera.x && starX < gameState.camera.x + canvas.width &&
                    starY > gameState.camera.y && starY < gameState.camera.y + canvas.height) {
                    
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = 0.5 + Math.sin(Date.now()/1000 + element.twinkle) * 0.5;
                    ctx.fillRect(starX, starY, 2, 2);
                    ctx.fillRect(starX + 2, starY + 2, 2, 2);
                    ctx.fillRect(starX, starY + 4, 2, 2);
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
    
    function drawPlayer() {
        // Bayangan
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(player.x + player.width/2, player.y + player.height + 5, 
                    player.width/2, player.height/6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const centerX = player.x + player.width/2;
        const centerY = player.y + player.height/2;
        const radius = player.width/2;
        
        const ballColor = player.invincible && Math.floor(Date.now()/100) % 2 === 0 ? 
                         '#FF0000' : '#FFFFFF';
        
        ctx.fillStyle = ballColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = ballColor === '#FFFFFF' ? '#F0F0F0' : '#CC0000';
        const pixelSize = 3;
        for (let i = 0; i < 360; i += 45) {
            const angle = i * Math.PI / 180;
            const px = centerX + Math.cos(angle) * (radius - pixelSize/2);
            const py = centerY + Math.sin(angle) * (radius - pixelSize/2);
            ctx.fillRect(px - pixelSize/2, py - pixelSize/2, pixelSize, pixelSize);
        }
        
        ctx.fillStyle = '#000000';
        const eyeOffset = player.facingRight ? radius/3 : -radius/3;
        const eyeSize = radius/4;
        
        ctx.beginPath();
        ctx.arc(centerX + eyeOffset, centerY - radius/4, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + eyeOffset, centerY + radius/4, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX + eyeOffset/2, centerY, radius/3, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Draw attack effect when attacking
        if (player.isAttacking) {
            const attackRadius = radius * (1 + Math.sin(Date.now() / 100) * 0.3);
            ctx.strokeStyle = player.attackTypes[player.currentAttackType].color;
            if (player.attackElement === 'fire') ctx.strokeStyle = '#FF0000';
            if (player.attackElement === 'ice') ctx.strokeStyle = '#00FFFF';
            if (player.attackElement === 'electric') ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, attackRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        if (player.hasShield) {
            ctx.strokeStyle = '#0000FF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            
            const shieldWidth = 50;
            const shieldProgress = player.shieldTime / 10;
            ctx.fillStyle = '#0000FF';
            ctx.fillRect(canvas.width/2 - shieldWidth/2, 10, shieldWidth * shieldProgress, 5);
            ctx.strokeStyle = '#FFFFFF';
            ctx.strokeRect(canvas.width/2 - shieldWidth/2, 10, shieldWidth, 5);
        }
        
        if (player.hasBoomerang) {
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(player.x + player.width/2 - 5, player.y - 15, 10, 10);
        }
        
        // Status effect visuals
        if (player.isPoisoned) {
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        if (player.isBurning) {
            ctx.strokeStyle = '#FF4500';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    
    function drawEnemies() {
        for (let enemy of enemies) {
            if (enemy.isBoss) {
                const barWidth = 100;
                const healthPercent = enemy.health / enemy.maxHealth;
                
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(enemy.x + enemy.width/2 - barWidth/2, enemy.y - 20, barWidth, 8);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(enemy.x + enemy.width/2 - barWidth/2, enemy.y - 20, barWidth * healthPercent, 8);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(enemy.x + enemy.width/2 - barWidth/2, enemy.y - 20, barWidth, 8);
            }
            
            ctx.fillStyle = enemy.color;
            if (enemy.type === 'ghost') {
                ctx.globalAlpha = enemy.transparency;
            }
            
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Enemy-specific details
            switch(enemy.type) {
                case 'robot_basic':
                case 'robot_fast':
                case 'robot_shooter':
                case 'robot_strong':
                case 'robot_toxic':
                case 'boss_robot':
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillRect(enemy.x + 10, enemy.y + 10, 8, 8);
                    ctx.fillRect(enemy.x + enemy.width - 18, enemy.y + 10, 8, 8);
                    break;
                    
                case 'snake':
                case 'snake_venom':
                    ctx.fillStyle = '#FF0000';
                    ctx.beginPath();
                    ctx.moveTo(enemy.x + enemy.width/2, enemy.y + enemy.height);
                    ctx.lineTo(enemy.x + enemy.width/2 + enemy.direction * 10, enemy.y + enemy.height + 10);
                    ctx.stroke();
                    break;
                    
                case 'dragon':
                case 'boss_dragon':
                case 'fire_dragon':
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.moveTo(enemy.x, enemy.y + 20);
                    ctx.lineTo(enemy.x - 30, enemy.y + 10);
                    ctx.lineTo(enemy.x - 20, enemy.y + 40);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(enemy.x + enemy.width, enemy.y + 20);
                    ctx.lineTo(enemy.x + enemy.width + 30, enemy.y + 10);
                    ctx.lineTo(enemy.x + enemy.width + 20, enemy.y + 40);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
            
            ctx.globalAlpha = 1;
            
            if (enemy.maxHealth > 1 && !enemy.isBoss) {
                const healthPercent = enemy.health / enemy.maxHealth;
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 4);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 4);
            }
        }
    }
    
    function drawItems() {
        for (let item of items) {
            ctx.save();
            
            switch(item.type) {
                case 'coin':
                    drawPixelCircle(item.x + item.width/2, item.y + item.height/2, item.width/2, 4, '#FFD700');
                    break;
                    
                case 'leaf':
                    drawPixelLeaf(item.x, item.y, item.width, item.height, '#32CD32');
                    break;
                    
                case 'boomerang':
                    ctx.fillStyle = '#4169E1';
                    ctx.translate(item.x + item.width/2, item.y + item.height/2);
                    ctx.rotate(Date.now() / 500);
                    ctx.fillRect(-item.width/2, -item.height/2, item.width, item.height);
                    break;
                    
                case 'shield':
                    ctx.fillStyle = '#0000FF';
                    ctx.beginPath();
                    ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;
                    
                case 'star':
                    ctx.fillStyle = '#FF4500';
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * Math.PI * 2) / 5 - Math.PI/2;
                        const x = item.x + item.width/2 + Math.cos(angle) * item.width/2;
                        const y = item.y + item.height/2 + Math.sin(angle) * item.height/2;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    function drawProjectiles() {
        for (let proj of projectiles) {
            ctx.save();
            
            if (proj.type === 'boomerang') {
                ctx.fillStyle = proj.color;
                ctx.translate(proj.x + proj.width/2, proj.y + proj.height/2);
                ctx.rotate(Date.now() / 100);
                ctx.fillRect(-proj.width/2, -proj.height/2, proj.width, proj.height);
            } else {
                ctx.fillStyle = proj.color;
                ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            }
            
            ctx.restore();
        }
    }
    
    function drawEnemyProjectiles() {
        for (let proj of enemyProjectiles) {
            ctx.save();
            
            switch(proj.type) {
                case 'fireball':
                    ctx.fillStyle = '#FF4500';
                    ctx.beginPath();
                    ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'laser':
                    ctx.fillStyle = proj.color;
                    ctx.globalAlpha = 0.7;
                    ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
                    break;
                    
                case 'web':
                    ctx.fillStyle = '#FFFFFF';
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'snowball':
                    ctx.fillStyle = '#F0F8FF';
                    ctx.beginPath();
                    ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'spell':
                    ctx.fillStyle = proj.color;
                    ctx.beginPath();
                    ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'meteor':
                    ctx.fillStyle = '#FF0000';
                    ctx.beginPath();
                    ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2 + 10 + i*5, 
                               (proj.width/2) * (1 - i/5), 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                    
                default:
                    ctx.fillStyle = proj.color;
                    ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            }
            
            ctx.restore();
        }
    }
    
    function drawParticles() {
        for (let particle of particles) {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    function drawPlatforms() {
        for (let platform of platforms) {
            if (platform.type === 'disappearing' && !platform.visible) continue;
            
            let platformColor = platform.color || '#228B22';
            
            switch(platform.type) {
                case 'moving':
                    platformColor = '#FF9800';
                    break;
                case 'disappearing':
                    platformColor = platform.visible ? '#9C27B0' : 'rgba(156, 39, 176, 0.3)';
                    break;
                case 'toxic':
                    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                    const toxicGradient = ctx.createLinearGradient(
                        platform.x, platform.y,
                        platform.x, platform.y + platform.height
                    );
                    toxicGradient.addColorStop(0, `rgba(50, 205, 50, ${pulse})`);
                    toxicGradient.addColorStop(1, `rgba(0, 100, 0, ${pulse})`);
                    
                    ctx.fillStyle = toxicGradient;
                    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    ctx.fillStyle = '#FF0000';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('☠️', platform.x + platform.width/2, platform.y + platform.height/2 + 5);
                    
                    ctx.strokeStyle = '#006400';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
                    continue;
                    
                case 'lava':
                    const lavaGradient = ctx.createLinearGradient(
                        platform.x, platform.y, 
                        platform.x, platform.y + platform.height
                    );
                    lavaGradient.addColorStop(0, '#FF4500');
                    lavaGradient.addColorStop(0.5, '#FF0000');
                    lavaGradient.addColorStop(1, '#8B0000');
                    ctx.fillStyle = lavaGradient;
                    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    continue;
                    
                case 'floating':
                    platformColor = '#2196F3';
                    break;
            }
            
            ctx.fillStyle = platformColor;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            ctx.strokeStyle = '#2F4F4F';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
    }
    
    function drawFlag() {
        if (!flag.collected) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(flag.x, flag.y, 5, flag.height);
            
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(flag.x + 5, flag.y);
            ctx.lineTo(flag.x + 5 + flag.width, flag.y + flag.height/2);
            ctx.lineTo(flag.x + 5, flag.y + flag.height);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = Math.floor(Date.now() / 500) % 2 === 0 ? 'rgba(255, 255, 0, 0.7)' : 'rgba(0, 255, 0, 0.7)';
            ctx.fillRect(flag.x - 10, flag.y - 30, flag.width + 20, 25);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('🚩 FINISH', flag.x - 20, flag.y - 35);
        }
    }
    
    function drawUI() {
        const config = levelConfigs[gameState.currentLevel];
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${config.name} - ${config.difficulty}`, 10, 30);
        
        // Combo display
        if (player.comboCount > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`COMBO x${player.comboCount}`, canvas.width - 100, 30);
        }
        
        // Debug info
        if (showDebugInfo) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.fillText(`Combo: ${player.comboCount}`, 10, 50);
            ctx.fillText(`Attack Type: ${player.currentAttackType}`, 10, 65);
            ctx.fillText(`Element: ${player.attackElement || 'none'}`, 10, 80);
            ctx.fillText(`Attack CD: ${player.attackCooldown.toFixed(2)}`, 10, 95);
            ctx.fillText(`Enemies: ${enemies.length}`, 10, 110);
        }
        
        if (gameState.paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
            
            ctx.font = '24px Arial';
            ctx.fillText('Tekan ESC untuk melanjutkan', canvas.width/2, canvas.height/2 + 50);
        }
    }
    
    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/3);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText(`Skor Akhir: ${gameState.score}`, canvas.width/2, canvas.height/2 - 30);
        ctx.fillText(`Level yang dicapai: ${gameState.currentLevel}`, canvas.width/2, canvas.height/2 + 10);
        ctx.fillText(`Level terbuka: ${gameState.unlockedLevel}/10`, canvas.width/2, canvas.height/2 + 50);
        
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '20px Arial';
        ctx.fillText('Tekan tombol "Ulangi" untuk mencoba lagi', canvas.width/2, canvas.height - 100);
    }
    
    function drawWinScreen() {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LEVEL COMPLETE!', canvas.width/2, canvas.height/3);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px Arial';
        ctx.fillText(`Skor: ${gameState.score}`, canvas.width/2, canvas.height/2 - 20);
        
        if (gameState.currentLevel < gameState.maxLevel) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(`Level ${gameState.currentLevel + 1} TERBUKA!`, canvas.width/2, canvas.height/2 + 40);
        } else {
            ctx.fillStyle = '#FF4500';
            ctx.font = 'bold 36px Arial';
            ctx.fillText('SELAMAT! ANDA MENYELESAIKAN GAME!', canvas.width/2, canvas.height/2 + 40);
        }
        
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '20px Arial';
        if (gameState.currentLevel < gameState.maxLevel) {
            ctx.fillText('Tekan tombol "Level Berikutnya" untuk melanjutkan', canvas.width/2, canvas.height - 100);
        } else {
            ctx.fillText('Anda telah menyelesaikan semua level!', canvas.width/2, canvas.height - 100);
        }
    }
    
    // ========== HELPER FUNCTION ==========
    function isInViewport(object) {
        return object.x + object.width > gameState.camera.x && 
               object.x < gameState.camera.x + gameState.camera.width &&
               object.y + object.height > gameState.camera.y && 
               object.y < gameState.camera.y + gameState.camera.height;
    }
    
    // ========== INITIALIZE AND START ==========
    console.log("🔄 Starting game initialization...");
    init();
});