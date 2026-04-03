const DEFAULT_FLASH = [255, 120, 120];
const BASE_COLOR = [255, 255, 255];

export function attachShadow(k, owner, options = {}) {
    const {
        offsetY = 8,
        scale = 1.35,
        opacity = 0.38,
        zOffset = -0.2,
    } = options;

    const shadow = k.add([
        k.sprite("shadow"),
        k.pos(owner.pos.x, owner.pos.y + offsetY),
        k.anchor("center"),
        k.scale(scale),
        k.opacity(opacity),
        k.z((owner.z ?? 1) + zOffset),
        {
            update() {
                if (!owner.exists()) {
                    this.destroy();
                    return;
                }

                this.pos.x = owner.pos.x;
                this.pos.y = owner.pos.y + offsetY;
                this.z = (owner.z ?? 1) + zOffset;
                this.hidden = owner.hidden;
            },
        },
    ]);

    return shadow;
}

export function applyDamageFeedback(k, target, options = {}) {
    const {
        source = null,
        attackDir = null,
        flashColor = DEFAULT_FLASH,
        flashDuration = 0.09,
        bloodScale = 1,
        shake = 0,
    } = options;

    triggerHitFlash(k, target, { flashColor, flashDuration });

    const bloodDir = resolveImpactDir(target, source, attackDir);
    spawnBloodSplat(k, target.pos.clone(), bloodDir, {
        scale: bloodScale,
        z: (target.z ?? 1) - 0.05,
    });

    if (shake > 0) {
        k.shake(shake);
    }
}

export function triggerHitFlash(k, target, options = {}) {
    const {
        flashColor = DEFAULT_FLASH,
        flashDuration = 0.09,
    } = options;

    if (!target.color) return;

    target.flashToken = (target.flashToken ?? 0) + 1;
    const token = target.flashToken;
    target.color = k.rgb(...flashColor);

    k.wait(flashDuration, () => {
        if (!target.exists() || target.flashToken !== token) return;
        target.color = k.rgb(...BASE_COLOR);
    });
}

export function spawnBloodSplat(k, pos, dir, options = {}) {
    const {
        scale = 1,
        z = 1,
        opacity = 0.92,
    } = options;

    const blood = k.add([
        k.pos(pos),
        k.sprite(`blood_${dir}`),
        k.anchor("center"),
        k.scale(scale),
        k.opacity(opacity),
        k.z(z),
    ]);

    blood.play("splat", {
        onEnd: () => {
            if (blood.exists()) {
                blood.destroy();
            }
        },
    });

    return blood;
}

function resolveImpactDir(target, source, attackDir) {
    const normalizedDir = normalizeDir(attackDir)
        || normalizeDir(source?.attackDir)
        || normalizeDir(source?.facingDir);

    if (normalizedDir) {
        return normalizedDir;
    }

    if (source?.pos) {
        const dx = target.pos.x - source.pos.x;
        const dy = target.pos.y - source.pos.y;

        if (Math.abs(dx) >= Math.abs(dy)) {
            return "S";
        }

        return dy >= 0 ? "D" : "U";
    }

    return normalizeDir(target.facingDir) ?? "S";
}

function normalizeDir(dir) {
    if (dir === "U" || dir === "D") return dir;
    if (dir === "S") return "S";
    return null;
}
