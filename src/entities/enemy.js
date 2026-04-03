import { healthManager } from "../components/healthManager.js";
import { rollEnemyLoot } from "../components/inventoryManager.js";
import { ENEMY_STATS } from "../data/stats.js";
import { playSfx } from "../systems/audio.js";
import { applyDamageFeedback, attachShadow } from "../systems/feedback.js";

const ENEMY_BEHAVIORS = {
    1: {
        attackRange: 24,
        cooldown: 0.8,
        patrolSpeedMult: 0.55,
        huntSpeedMult: 1.0,
        patrolRadius: 56,
        patrolWindow: [0.5, 1.2],
        idleChance: 0.35,
        forgetRange: 140,
        leashRange: 130,
        persistentAggro: false,
        patrolStatic: false,
        rallyRange: 0,
    },
    2: {
        attackRange: 28,
        cooldown: 0.35,
        patrolSpeedMult: 0.7,
        huntSpeedMult: 1.05,
        patrolRadius: 72,
        patrolWindow: [0.45, 1.0],
        idleChance: 0.15,
        forgetRange: 420,
        leashRange: 420,
        persistentAggro: true,
        patrolStatic: false,
        rallyRange: 0,
    },
    3: {
        attackRange: 22,
        cooldown: 0.25,
        patrolSpeedMult: 0,
        huntSpeedMult: 1.45,
        patrolRadius: 0,
        patrolWindow: [0.8, 1.2],
        idleChance: 1,
        forgetRange: 180,
        leashRange: 160,
        persistentAggro: false,
        patrolStatic: true,
        rallyRange: 0,
    },
    4: {
        attackRange: 30,
        cooldown: 0.75,
        patrolSpeedMult: 0.5,
        huntSpeedMult: 0.95,
        patrolRadius: 84,
        patrolWindow: [0.6, 1.3],
        idleChance: 0.2,
        forgetRange: 320,
        leashRange: 280,
        persistentAggro: true,
        patrolStatic: false,
        rallyRange: 220,
    },
};

export function pickEnemyTypeForFloor(floor, rng = Math.random) {
    const pool = floor <= 2
        ? [1, 1, 1, 2]
        : floor <= 4
            ? [1, 2, 2, 3, 3]
            : [2, 2, 3, 3, 4];

    return pool[Math.floor(rng() * pool.length)];
}

export function createEnemy(k, { type = 1, pos, player, floor = 1 } = {}) {
    const stats = scaleEnemyStats(ENEMY_STATS[type] ?? ENEMY_STATS[1], floor);
    const behavior = ENEMY_BEHAVIORS[type] ?? ENEMY_BEHAVIORS[1];
    const spawnPos = pos?.clone?.() ?? k.center();

    let curDir = "D";
    let facingLeft = false;
    let curAnimKey = "";
    let patrolDir = k.vec2(0, 0);
    let patrolTimer = 0;
    let cooldownTimer = 0;
    let aggroLocked = false;
    let playerRef = player ?? null;

    const enemy = k.add([
        k.pos(spawnPos),
        k.sprite(`enemy${type}_D_idle`),
        k.color(255, 255, 255),
        k.area({ shape: new k.Rect(k.vec2(-8, -8), 16, 16) }),
        k.body({ gravityScale: 0 }),
        k.anchor("center"),
        k.z(1),
        k.state("patrol", ["patrol", "hunt", "attack", "cooldown"]),
        healthManager(k, stats.hp, {
            invulnerability: 0.12,
            onHurt(_dmg, meta) {
                if (this.isDead) return;
                playSfx(k, "enemyHurt", { pan: calcPan(k, enemy.pos) });
                applyDamageFeedback(k, enemy, {
                    source: meta.source,
                    attackDir: meta.attackDir,
                    bloodScale: 0.95,
                });
                setVisualState(curDir, "hurt");
            },
            onDeath(meta) {
                disableCombatBody();
                awardKill(meta);
                playSfx(k, "enemyDeath", { pan: calcPan(k, enemy.pos) });
                setVisualState(curDir, "death");

                const lootItem = rollEnemyLoot(floor);
                k.wait(0.5, () => {
                    if (!enemy.exists()) return;
                    if (lootItem) {
                        spawnLootPickup(k, enemy.pos.clone(), lootItem);
                    }
                    enemy.destroy();
                });
            },
        }),
        "enemy",
        type === 1 ? "rat" : "goblin",
        {
            enemyType: type,
            enemyName: stats.name,
            stats,
            homePos: spawnPos.clone(),
        },
    ]);

    enemy.play("idle");
    curAnimKey = `enemy${type}_D_idle`;
    enemy.facingDir = curDir;
    attachShadow(k, enemy, { offsetY: 8, scale: 1.25, opacity: 0.32 });

    enemy.alert = () => {
        if (enemy.isDead) return;
        aggroLocked = true;
        if (enemy.state === "patrol") {
            enemy.enterState("hunt");
        }
    };

    enemy.takeDamage = (dmg = 0, meta = {}) => enemy.hurt(dmg, meta);

    enemy.onCollideUpdate("wall", (_wall, collision) => {
        if (enemy.isDead || !collision?.displacement) return;
        enemy.moveBy(collision.displacement);
    });

    function awardKill(meta = {}) {
        const source = meta.source;
        if (!source) return;
        source.kills = (source.kills ?? 0) + 1;
        source.score = (source.score ?? 0) + stats.scoreValue;
    }

    function disableCombatBody() {
        if (enemy.has("body")) {
            enemy.vel = k.vec2(0, 0);
            enemy.isStatic = true;
        }
        if (enemy.has("area")) {
            enemy.collisionIgnore = [
                "hero",
                "enemy",
                "heroProjectile",
                "wall",
                "loot",
                "chest",
                "exit",
            ];
        }
    }

    function getPlayer() {
        if (playerRef?.exists?.() && !playerRef.isDead) {
            return playerRef;
        }

        playerRef = k.get("hero")[0] ?? null;
        if (playerRef?.exists?.() && !playerRef.isDead) {
            return playerRef;
        }

        return null;
    }

    function resolveDir(dx, dy) {
        if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return "S";
        if (dy < 0) return "U";
        if (dy > 0) return "D";
        return curDir;
    }

    function setVisualState(dir, anim, playOptions) {
        const newKey = `enemy${type}_${dir}_${anim}`;
        const spriteChanged = newKey !== curAnimKey;

        curDir = dir;
        enemy.facingDir = dir;

        if (dir === "S") {
            enemy.flipX = !facingLeft;
        } else {
            enemy.flipX = false;
        }

        if (!spriteChanged && !playOptions) return;

        if (spriteChanged) {
            curAnimKey = newKey;
            enemy.use(k.sprite(newKey));
        }

        enemy.play(anim, playOptions);

        if (dir === "S") {
            enemy.flipX = !facingLeft;
        }
    }

    function faceVector(dx, dy) {
        if (dx !== 0) facingLeft = dx < 0;
        return resolveDir(dx, dy);
    }

    function faceTarget(target) {
        return faceVector(target.pos.x - enemy.pos.x, target.pos.y - enemy.pos.y);
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function pickPatrolDir() {
        patrolTimer = randomBetween(...behavior.patrolWindow);

        if (behavior.patrolStatic) {
            patrolDir = k.vec2(0, 0);
            return;
        }

        const distFromHome = enemy.pos.dist(enemy.homePos);
        if (distFromHome > behavior.patrolRadius) {
            patrolDir = k.vec2(
                enemy.homePos.x - enemy.pos.x,
                enemy.homePos.y - enemy.pos.y,
            ).unit();
            return;
        }

        if (Math.random() < behavior.idleChance) {
            patrolDir = k.vec2(0, 0);
            return;
        }

        const angle = Math.random() * Math.PI * 2;
        patrolDir = k.vec2(Math.cos(angle), Math.sin(angle));
    }

    function updatePatrolVisual() {
        if (patrolDir.x !== 0 || patrolDir.y !== 0) {
            const dir = faceVector(patrolDir.x, patrolDir.y);
            setVisualState(dir, "walk");
            return;
        }

        setVisualState(curDir, "idle");
    }

    function canDetectPlayer() {
        const target = getPlayer();
        if (!target) return false;

        const distToPlayer = enemy.pos.dist(target.pos);
        if (distToPlayer <= stats.detectionRange) return true;

        return aggroLocked && distToPlayer <= behavior.forgetRange;
    }

    function shouldAbortHunt(target) {
        const distToPlayer = enemy.pos.dist(target.pos);

        if (type === 1) {
            return distToPlayer > behavior.forgetRange
                || enemy.homePos.dist(target.pos) > behavior.leashRange;
        }

        if (type === 3) {
            return distToPlayer > behavior.forgetRange
                || enemy.homePos.dist(enemy.pos) > behavior.leashRange;
        }

        return distToPlayer > behavior.forgetRange;
    }

    function rallyAllies() {
        if (!behavior.rallyRange) return;

        k.get("enemy").forEach((ally) => {
            if (ally === enemy || !ally.exists() || ally.isDead) return;
            if (ally.enemyType === 1) return;
            if (ally.pos.dist(enemy.pos) > behavior.rallyRange) return;
            ally.alert?.();
        });
    }

    function beginPatrol() {
        pickPatrolDir();
        updatePatrolVisual();
    }

    enemy.onStateEnter("patrol", () => {
        if (enemy.isDead) return;

        if (!behavior.persistentAggro) {
            aggroLocked = false;
        }

        beginPatrol();
    });

    enemy.onStateUpdate("patrol", () => {
        if (enemy.isDead) return;

        if (canDetectPlayer()) {
            if (behavior.persistentAggro) {
                aggroLocked = true;
            }
            enemy.enterState("hunt");
            return;
        }

        patrolTimer -= k.dt();
        if (patrolTimer <= 0) {
            pickPatrolDir();
            updatePatrolVisual();
        }

        if (patrolDir.x === 0 && patrolDir.y === 0) return;

        enemy.move(patrolDir.scale(stats.speed * behavior.patrolSpeedMult));
    });

    enemy.onStateEnter("hunt", () => {
        if (enemy.isDead) return;

        aggroLocked = aggroLocked || behavior.persistentAggro;

        const target = getPlayer();
        if (!target) {
            enemy.enterState("patrol");
            return;
        }

        const dir = faceTarget(target);
        setVisualState(dir, "walk");

        if (type === 4) {
            rallyAllies();
        }
    });

    enemy.onStateUpdate("hunt", () => {
        if (enemy.isDead) return;

        const target = getPlayer();
        if (!target) {
            enemy.enterState("patrol");
            return;
        }

        if (shouldAbortHunt(target)) {
            aggroLocked = false;
            enemy.enterState("patrol");
            return;
        }

        const distToPlayer = enemy.pos.dist(target.pos);
        if (distToPlayer <= behavior.attackRange) {
            enemy.enterState("attack");
            return;
        }

        const dir = faceTarget(target);
        setVisualState(dir, "walk");
        enemy.moveTo(target.pos, stats.speed * behavior.huntSpeedMult);
    });

    enemy.onStateEnter("attack", () => {
        if (enemy.isDead) return;

        const target = getPlayer();
        if (!target) {
            enemy.enterState("patrol");
            return;
        }

        const dir = faceTarget(target);
        setVisualState(dir, "attack", {
            onEnd: () => {
                if (enemy.exists() && !enemy.isDead && enemy.state === "attack") {
                    enemy.enterState("cooldown");
                }
            },
        });

        if (enemy.pos.dist(target.pos) <= behavior.attackRange + 6) {
            target.takeDamage?.(stats.dmg, { source: enemy, attackDir: curDir });
        }
    });

    enemy.onStateEnter("cooldown", () => {
        if (enemy.isDead) return;
        cooldownTimer = behavior.cooldown;
        setVisualState(curDir, "idle");
    });

    enemy.onStateUpdate("cooldown", () => {
        if (enemy.isDead) return;
        cooldownTimer -= k.dt();
        if (cooldownTimer <= 0) {
            enemy.enterState("patrol");
        }
    });

    beginPatrol();

    return enemy;
}

function scaleEnemyStats(baseStats, floor) {
    const floorBonus = Math.max(0, floor - 1);

    return {
        ...baseStats,
        hp: Math.round(baseStats.hp + floorBonus * (baseStats.type === "leader" ? 18 : 8)),
        dmg: Math.round(baseStats.dmg + floorBonus * (baseStats.type === "leader" ? 3 : 2)),
        speed: baseStats.speed + Math.floor(floorBonus / 3) * 5,
        detectionRange: baseStats.detectionRange + floorBonus * 4,
        scoreValue: Math.round(20 + floor * 8 + baseStats.hp / 4),
    };
}

function spawnLootPickup(k, pos, item) {
    k.add([
        k.sprite(item.icon),
        k.pos(pos),
        k.scale(2),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(-8, -8), 16, 16) }),
        k.z(2),
        "loot",
        {
            item,
            collected: false,
        },
    ]);
}

function calcPan(k, pos) {
    const camPos = k.getCamPos();
    const screenHalf = Math.max(1, k.width() / 2);
    return (pos.x - camPos.x) / screenHalf;
}
