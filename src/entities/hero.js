import { healthManager } from "../components/healthManager.js";
import { inventoryManager } from "../components/inventoryManager.js";
import { HERO_STATS } from "../data/stats.js";
import { playSfx } from "../systems/audio.js";
import { applyDamageFeedback, attachShadow } from "../systems/feedback.js";

const KEYS = {
    left: ["left", "a"],
    right: ["right", "d"],
    up: ["up", "w"],
    down: ["down", "s"],
    attack: ["space", "z"],
};

const CAM_SPEED = 6;

export function createHero(k, { heroType = 1, spawnPos, bounds = null, savedState = null } = {}) {
    const stats = HERO_STATS[heroType];
    const origin = spawnPos ?? k.center();
    const maxHp = savedState?.maxHp ?? stats.hp;
    const startingHp = savedState?.hp ?? maxHp;
    const startingInventory = savedState?.inventory ?? [];
    const startingBuffs = (savedState?.activeBuffs ?? []).map((buff) => ({ ...buff }));

    let curDir = "D";
    let facingLeft = false;
    let curAnimKey = "";
    let isAttacking = false;
    let isHurting = false;

    const hero = k.add([
        k.pos(origin),
        k.sprite(`hero${heroType}_D_idle`),
        k.color(255, 255, 255),
        k.area({ shape: new k.Rect(k.vec2(-8, -8), 16, 16) }),
        k.body({ gravityScale: 0 }),
        k.anchor("center"),
        k.z(1),
        healthManager(k, maxHp, {
            initialHp: startingHp,
            invulnerability: 0.35,
            onHurt(dmg, meta) {
                if (this.isDead) return;
                isHurting = true;
                isAttacking = false;
                hero.isAttacking = false;
                hero.vel = k.vec2(0, 0);
                playSfx(k, "heroHurt");
                applyDamageFeedback(k, hero, {
                    source: meta.source,
                    attackDir: meta.attackDir,
                    shake: dmg >= 12 ? Math.min(16, dmg) : 0,
                });
                setSpriteState(curDir, "hurt");
            },
            onDeath() {
                isHurting = false;
                isAttacking = false;
                hero.isAttacking = false;
                hero.vel = k.vec2(0, 0);
                playSfx(k, "heroDeath");
                k.shake(18);
                setSpriteState(curDir, "death");
            },
        }),
        inventoryManager(startingInventory),
        "hero",
        {
            heroType,
            stats,
            heroName: stats.name,
            score: savedState?.score ?? 0,
            kills: savedState?.kills ?? 0,
            isAttacking: false,
            facingDir: curDir,
            activeBuffs: startingBuffs,
        },
    ]);

    hero.play("idle");
    curAnimKey = `hero${heroType}_D_idle`;
    attachShadow(k, hero, { offsetY: 9, scale: 1.45, opacity: 0.34 });

    function setSpriteState(dir, anim, playOptions) {
        const newKey = `hero${heroType}_${dir}_${anim}`;
        const spriteChanged = newKey !== curAnimKey;

        curDir = dir;
        hero.facingDir = dir;

        if (!spriteChanged && !playOptions) {
            hero.flipX = !facingLeft && dir === "S";
            return;
        }

        if (spriteChanged) {
            curAnimKey = newKey;
            hero.use(k.sprite(newKey));
        }

        hero.play(anim, playOptions);
        hero.flipX = !facingLeft && dir === "S";
    }

    function resolveDir(vx, vy) {
        if (vx !== 0) return "S";
        if (vy < 0) return "U";
        if (vy > 0) return "D";
        return curDir;
    }

    hero.onUpdate(() => {
        hero.vel = k.vec2(0, 0);
        if (hero.isDead || isAttacking || isHurting) return;

        let vx = 0;
        let vy = 0;

        if (KEYS.left.some(k.isKeyDown.bind(k))) vx -= 1;
        if (KEYS.right.some(k.isKeyDown.bind(k))) vx += 1;
        if (KEYS.up.some(k.isKeyDown.bind(k))) vy -= 1;
        if (KEYS.down.some(k.isKeyDown.bind(k))) vy += 1;

        const moving = vx !== 0 || vy !== 0;

        if (moving) {
            hero.vel = k.vec2(vx, vy).unit().scale(stats.speed);
            if (vx !== 0) facingLeft = vx < 0;
        }

        const newDir = resolveDir(vx, vy);
        const newAnim = moving ? "walk" : "idle";
        setSpriteState(newDir, newAnim);

        if (curDir === "S") {
            hero.flipX = !facingLeft;
        }
    });

    hero.onUpdate(() => {
        if (hero.isDead || isAttacking || isHurting) return;

        if (KEYS.attack.some(k.isKeyPressed.bind(k))) {
            triggerAttack();
        }
    });

    function triggerAttack() {
        isAttacking = true;
        hero.isAttacking = true;
        setSpriteState(curDir, "attack");

        hero.trigger("attack", {
            dir: curDir,
            facingLeft,
            heroType,
            pos: hero.pos.clone(),
            stats,
        });
    }

    hero.onAnimEnd((animName) => {
        if (animName === "attack") {
            isAttacking = false;
            hero.isAttacking = false;
            if (!hero.isDead) {
                setSpriteState(curDir, "idle");
            }
            return;
        }

        if (animName === "hurt") {
            isHurting = false;
            if (!hero.isDead) {
                setSpriteState(curDir, "idle");
            }
        }
    });

    hero.onUpdate(() => {
        let target = hero.pos;

        if (bounds) {
            const camScale = k.getCamScale();
            const zoom = camScale?.x ?? camScale ?? 1;
            const hw = k.width() / (2 * zoom);
            const hh = k.height() / (2 * zoom);
            target = k.vec2(
                k.clamp(hero.pos.x, bounds.left + hw, bounds.right - hw),
                k.clamp(hero.pos.y, bounds.top + hh, bounds.bottom - hh),
            );
        }

        k.setCamPos(k.lerp(k.getCamPos(), target, CAM_SPEED * k.dt()));
    });

    hero.onCollideUpdate("wall", (_wall, collision) => {
        if (!collision?.displacement) return;
        hero.moveBy(collision.displacement);
    });

    hero.onUpdate(() => {
        if (hero.activeBuffs.length === 0) return;

        hero.activeBuffs = hero.activeBuffs
            .map((buff) => ({ ...buff, remaining: buff.remaining - k.dt() }))
            .filter((buff) => buff.remaining > 0);
    });

    hero.getBuffAmount = (stat) => hero.activeBuffs.reduce(
        (total, buff) => total + (buff.stat === stat ? buff.amount : 0),
        0,
    );

    hero.getAttackDamage = () => Math.max(1, hero.stats.attackDmg + hero.getBuffAmount("attack"));
    hero.getDefense = () => Math.max(0, hero.getBuffAmount("defense"));

    hero.useInventorySlot = (index) => {
        if (hero.isDead) {
            return { used: false, reason: "dead" };
        }

        const item = hero.inventory[index];
        if (!item) {
            return { used: false, reason: "empty" };
        }

        if (item.effect?.type === "heal") {
            const healed = hero.heal(item.effect.amount, { source: item });
            if (healed <= 0) {
                return { used: false, reason: "full" };
            }

            hero.removeItem(index);
            const result = { used: true, item, effect: item.effect, healed };
            hero.trigger("item:used", result);
            return result;
        }

        if (item.effect?.type === "buff") {
            hero.removeItem(index);

            const buff = {
                itemId: item.id,
                label: item.name,
                stat: item.effect.stat,
                amount: item.effect.amount,
                remaining: item.effect.duration,
            };

            hero.activeBuffs = [...hero.activeBuffs, buff];
            const result = { used: true, item, effect: item.effect, buff };
            hero.trigger("item:used", result);
            return result;
        }

        return { used: false, reason: "unknown" };
    };

    hero.takeDamage = (dmg, meta = {}) => {
        if (hero.isDead || isAttacking || isHurting) {
            return false;
        }

        const reducedDamage = meta.ignoreDefense
            ? dmg
            : Math.max(1, dmg - hero.getDefense());

        return hero.hurt(reducedDamage, { ...meta, rawDamage: dmg });
    };

    hero.serializeProgress = () => ({
        hp: hero.hp,
        maxHp: hero.maxHp,
        inventory: hero.serializeInventory(),
        score: hero.score,
        kills: hero.kills,
        activeBuffs: hero.activeBuffs.map((buff) => ({ ...buff })),
    });

    return hero;
}
