export function healthManager(k, maxHp, options = {}) {
    const {
        initialHp = maxHp,
        invulnerability = 0,
        autoDestroy = false,
        destroyDelay = 0,
        onHurt = null,
        onHeal = null,
        onDeath = null,
    } = options;

    return {
        id: "healthManager",
        hp: Math.min(initialHp, maxHp),
        maxHp,
        isDead: false,
        hurtCooldown: 0,

        update() {
            if (this.hurtCooldown > 0) {
                this.hurtCooldown = Math.max(0, this.hurtCooldown - k.dt());
            }
        },

        hurt(dmg = 0, meta = {}) {
            if (this.isDead || dmg <= 0 || this.hurtCooldown > 0) {
                return false;
            }

            this.hp = Math.max(0, this.hp - dmg);
            this.hurtCooldown = meta.ignoreInvulnerability
                ? 0
                : meta.invulnerability ?? invulnerability;

            this.trigger("hurt", dmg, meta);
            onHurt?.call(this, dmg, meta);

            if (this.hp <= 0) {
                this.die(meta);
            }

            return true;
        },

        heal(amount = 0, meta = {}) {
            if (this.isDead || amount <= 0) {
                return 0;
            }

            const previousHp = this.hp;
            this.hp = Math.min(this.hp + amount, this.maxHp);
            const healed = this.hp - previousHp;

            if (healed > 0) {
                this.trigger("heal", healed, meta);
                onHeal?.call(this, healed, meta);
            }

            return healed;
        },

        setMaxHp(nextMaxHp, { preserveRatio = false } = {}) {
            const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
            this.maxHp = Math.max(1, nextMaxHp);
            this.hp = preserveRatio
                ? Math.max(1, Math.round(this.maxHp * ratio))
                : Math.min(this.hp, this.maxHp);
        },

        die(meta = {}) {
            if (this.isDead) {
                return false;
            }

            this.isDead = true;
            this.hp = 0;
            this.hurtCooldown = Number.POSITIVE_INFINITY;

            this.trigger("death", meta);
            onDeath?.call(this, meta);

            if (autoDestroy || meta.destroyOnDeath) {
                const delay = meta.destroyDelay ?? destroyDelay;
                k.wait(delay, () => {
                    if (this.exists()) {
                        this.destroy();
                    }
                });
            }

            return true;
        },
    };
}
