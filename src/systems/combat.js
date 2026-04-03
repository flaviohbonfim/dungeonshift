import { rollChestContents } from "../components/inventoryManager.js";
import { playSfx } from "./audio.js";

const PROJECTILE_CONFIG = {
    2: { sprite: "arrow", scale: 1.25 },
    3: { sprite: "fireball", scale: 2 },
};

export function setupCombat(k, hero, enemies, options = {}) {
    const {
        floor = 1,
        heroType = hero.heroType,
        onNextFloor = null,
        onGameOver = null,
    } = options;

    let transitioning = false;

    hero.on("attack", (attackInfo) => {
        if (transitioning || hero.isDead) return;

        if (heroType === 1) {
            playSfx(k, "meleeSwing", { pan: calcPan(k, hero.pos) });
            performMeleeAttack(k, hero, enemies, attackInfo);
            return;
        }

        playSfx(k, heroType === 2 ? "arrowShot" : "fireballShot", {
            pan: calcPan(k, hero.pos),
        });

        fireProjectile(k, hero, attackInfo);
    });

    hero.on("death", () => {
        if (transitioning) return;
        transitioning = true;

        k.wait(0.9, () => {
            if (onGameOver) {
                onGameOver({
                    score: hero.score ?? 0,
                    kills: hero.kills ?? 0,
                    heroType,
                    heroName: hero.heroName,
                });
            }
        });
    });

    hero.onCollide("loot", (loot) => {
        if (transitioning || hero.isDead || loot.collected) return;

        loot.collected = true;
        const item = hero.addItem(loot.item);
        hero.score = (hero.score ?? 0) + 10;

        playSfx(k, "pickup", { pan: calcPan(k, loot.pos) });
        showWorldText(k, loot.pos.clone(), `+ ${item.name}`, [120, 220, 140]);
        loot.destroy();
    });

    hero.onCollide("chest", (chest) => {
        if (transitioning || hero.isDead || chest.opened) return;

        chest.opened = true;
        chest.contents ??= rollChestContents(floor);
        hero.addItems(chest.contents);
        hero.score = (hero.score ?? 0) + 20 * chest.contents.length;

        playSfx(k, "chestOpen", { pan: calcPan(k, chest.pos) });
        chest.play?.("open");
        showWorldText(k, chest.pos.clone(), summarizeItems(chest.contents), [255, 220, 120]);
    });

    hero.onCollide("exit", (exit) => {
        if (transitioning || hero.isDead) return;

        transitioning = true;
        hero.score = (hero.score ?? 0) + 100;
        playSfx(k, "floorUp");
        if (exit.sprite?.anims?.open) {
            exit.play("open");
        }

        const nextState = hero.serializeProgress();

        k.wait(0.2, () => {
            if (onNextFloor) {
                onNextFloor(nextState);
                return;
            }

            k.go("game", {
                heroType,
                floor: floor + 1,
                heroState: nextState,
            });
        });
    });
}

function performMeleeAttack(k, hero, enemies, attackInfo) {
    const direction = getDirectionVector(k, attackInfo);
    const attackCenter = attackInfo.pos.clone().add(direction.scale(hero.stats.attackRange ?? 40));
    const hitRadius = 28;
    const damage = hero.getAttackDamage?.() ?? hero.stats.attackDmg;

    enemies.forEach((enemy) => {
        if (!enemy.exists() || enemy.isDead) return;
        if (enemy.pos.dist(attackCenter) > hitRadius) return;

        enemy.hurt?.(damage, { source: hero, attackDir: attackInfo.dir });
    });
}

function fireProjectile(k, hero, attackInfo) {
    const config = PROJECTILE_CONFIG[attackInfo.heroType] ?? PROJECTILE_CONFIG[2];
    const direction = getDirectionVector(k, attackInfo);
    const spawnPos = attackInfo.pos.clone().add(direction.scale(14));
    const damage = hero.getAttackDamage?.() ?? hero.stats.attackDmg;

    const projectile = k.add([
        k.pos(spawnPos),
        k.sprite(config.sprite),
        k.opacity(1),
        k.scale(config.scale),
        k.rotate(0),
        k.anchor("center"),
        k.area(),
        k.move(direction, hero.stats.projSpeed ?? 400),
        k.lifespan(1.5),
        k.z(2),
        "heroProjectile",
        {
            attackDir: attackInfo.dir,
            spent: false,
        },
    ]);

    if (attackInfo.heroType === 2) {
        if (attackInfo.dir === "U") {
            projectile.angle = 90;
        } else if (attackInfo.dir === "D") {
            projectile.angle = -90;
        } else {
            projectile.flipX = !attackInfo.facingLeft;
        }
    }

    projectile.onCollide("wall", () => {
        projectile.destroy();
    });

    projectile.onCollide("enemy", (enemy) => {
        if (projectile.spent || enemy.isDead) return;

        projectile.spent = true;
        enemy.hurt?.(damage, { source: projectile, attackDir: attackInfo.dir });
        projectile.destroy();
    });
}

function getDirectionVector(k, attackInfo) {
    if (attackInfo.dir === "U") return k.vec2(0, -1);
    if (attackInfo.dir === "D") return k.vec2(0, 1);
    return attackInfo.facingLeft ? k.vec2(-1, 0) : k.vec2(1, 0);
}

function summarizeItems(items) {
    return items.map((item) => item.name).join(" + ");
}

function showWorldText(k, pos, message, color) {
    k.add([
        k.text(message, { size: 12 }),
        k.pos(pos.x, pos.y - 16),
        k.anchor("center"),
        k.color(...color),
        k.opacity(1),
        k.z(20),
        k.lifespan(0.8),
        {
            update() {
                this.move(0, -18);
            },
        },
    ]);
}

function calcPan(k, pos) {
    const camPos = k.getCamPos();
    const screenHalf = Math.max(1, k.width() / 2);
    return (pos.x - camPos.x) / screenHalf;
}
