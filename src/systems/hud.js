const INVENTORY_SLOTS = 6;
const PANEL_BG = [22, 29, 41];
const PANEL_BORDER = [115, 132, 162];
const PANEL_BORDER_ACTIVE = [162, 184, 220];

export function setupHUD(k, hero, { floor = 1 } = {}) {
    let hoveredSlot = -1;

    createDecoratedPanel(k, { x: 18, y: 18, width: 264, height: 124 });
    createDecoratedPanel(k, { x: k.width() - 254, y: 18, width: 236, height: 92 });
    createDecoratedPanel(k, {
        x: k.width() / 2 - 226,
        y: k.height() - 106,
        width: 452,
        height: 78,
        opacity: 0.66,
    });

    const healthLabel = k.add([
        k.text("VIDA", { size: 14 }),
        k.pos(42, 34),
        k.fixed(),
        k.z(166),
        k.color(235, 240, 255),
    ]);

    const healthBarBack = k.add([
        k.rect(190, 16, { radius: 4 }),
        k.pos(42, 58),
        k.fixed(),
        k.color(44, 24, 30),
        k.outline(2, k.rgb(90, 102, 126)),
        k.z(166),
    ]);

    const healthBarFill = k.add([
        k.rect(190, 16, { radius: 4 }),
        k.pos(42, 58),
        k.fixed(),
        k.color(194, 72, 84),
        k.z(167),
    ]);

    const hpText = k.add([
        k.text("", { size: 12 }),
        k.pos(42, 84),
        k.fixed(),
        k.z(166),
        k.color(210, 226, 255),
    ]);

    const buffText = k.add([
        k.text("", { size: 11, width: 224 }),
        k.pos(42, 102),
        k.fixed(),
        k.z(166),
        k.color(170, 255, 210),
    ]);

    const heroText = k.add([
        k.text("", { size: 12 }),
        k.pos(k.width() - 234, 34),
        k.fixed(),
        k.z(166),
        k.color(240, 245, 255),
    ]);

    const floorText = k.add([
        k.text("", { size: 12 }),
        k.pos(k.width() - 234, 56),
        k.fixed(),
        k.z(166),
        k.color(218, 228, 255),
    ]);

    const scoreText = k.add([
        k.text("", { size: 12 }),
        k.pos(k.width() - 234, 78),
        k.fixed(),
        k.z(166),
        k.color(218, 228, 255),
    ]);

    const overflowText = k.add([
        k.text("", { size: 10 }),
        k.pos(k.width() / 2 + 188, k.height() - 92),
        k.anchor("center"),
        k.fixed(),
        k.z(166),
        k.color(255, 224, 170),
    ]);

    const slotBaseX = k.width() / 2 - ((INVENTORY_SLOTS - 1) * 60) / 2;
    const slotY = k.height() - 68;

    const slots = Array.from({ length: INVENTORY_SLOTS }, (_, index) => createInventorySlot(k, {
        index,
        x: slotBaseX + index * 60,
        y: slotY,
        onUse: () => {
            const result = hero.useInventorySlot(index);
            if (!result.used) {
                return;
            }
        },
        onHover: () => {
            hoveredSlot = index;
            k.setCursor("pointer");
        },
        onHoverEnd: () => {
            hoveredSlot = -1;
            k.setCursor("default");
        },
    }));

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
        k.onKeyPress(String(i + 1), () => {
            hero.useInventorySlot(i);
        });
    }

    hero.on("item:used", () => {
        hoveredSlot = -1;
        k.setCursor("default");
    });

    k.add([
        k.pos(0, 0),
        k.fixed(),
        k.z(150),
        {
            draw() {
                const focus = hero.screenPos() ?? k.center();

                k.drawSubtracted(
                    () => {
                        k.drawRect({
                            pos: k.vec2(0, 0),
                            anchor: "topleft",
                            width: k.width(),
                            height: k.height(),
                            color: k.rgb(6, 8, 14),
                            opacity: 0.55,
                        });

                        k.drawSprite({
                            sprite: "fog",
                            pos: k.vec2(0, 0),
                            anchor: "topleft",
                            width: k.width(),
                            height: k.height(),
                            opacity: 0.18,
                        });
                    },
                    () => {
                        k.drawCircle({ pos: focus, radius: 88, opacity: 1 });
                        k.drawCircle({ pos: focus, radius: 124, opacity: 1 });
                    },
                );
            },
        },
    ]);

    k.onUpdate(() => {
        const hpRatio = hero.maxHp > 0 ? hero.hp / hero.maxHp : 0;
        const barWidth = 190 * hpRatio;

        healthBarFill.width = Math.max(1, barWidth);
        healthBarFill.hidden = barWidth <= 0.5;
        healthBarFill.color = hpRatio > 0.6
            ? k.rgb(194, 72, 84)
            : hpRatio > 0.3
                ? k.rgb(210, 130, 72)
                : k.rgb(230, 88, 88);

        heroText.text = hero.heroName;
        floorText.text = `Andar ${floor}  |  Kills ${hero.kills}`;
        scoreText.text = `Score ${hero.score}`;
        hpText.text = `${hero.hp}/${hero.maxHp} HP`;
        buffText.text = formatBuffSummary(hero);
        overflowText.text = hero.inventory.length > INVENTORY_SLOTS
            ? `+${hero.inventory.length - INVENTORY_SLOTS}`
            : "";

        updateInventorySlots(k, hero, slots, hoveredSlot);

        healthLabel.color = hpRatio <= 0.3 ? k.rgb(255, 160, 160) : k.rgb(235, 240, 255);
    });
}

function createDecoratedPanel(k, { x, y, width, height, opacity = 0.96 }) {
    k.add([
        k.rect(width, height, { radius: 10 }),
        k.pos(x, y),
        k.fixed(),
        k.color(...PANEL_BG),
        k.outline(2, k.rgb(...PANEL_BORDER)),
        k.opacity(opacity),
        k.z(160),
    ]);
}

function createInventorySlot(k, { index, x, y, onUse, onHover, onHoverEnd }) {
    const frame = k.add([
        k.rect(46, 46, { radius: 6 }),
        k.pos(x, y),
        k.anchor("center"),
        k.fixed(),
        k.area(),
        k.color(50, 58, 74),
        k.outline(2, k.rgb(...PANEL_BORDER)),
        k.opacity(0.84),
        k.z(167),
    ]);

    frame.onClick(onUse);
    frame.onHover(() => {
        onHover();
    });
    frame.onHoverEnd(() => {
        onHoverEnd();
    });

    const icon = k.add([
        k.sprite("icon_01"),
        k.pos(x, y - 2),
        k.anchor("center"),
        k.fixed(),
        k.scale(2.6),
        k.opacity(0.92),
        k.z(168),
        { spriteKey: "icon_01" },
    ]);

    const hotkey = k.add([
        k.text(String(index + 1), { size: 10 }),
        k.pos(x - 14, y + 16),
        k.fixed(),
        k.z(168),
        k.color(236, 240, 255),
    ]);

    return { frame, icon, hotkey };
}

function updateInventorySlots(k, hero, slots, hoveredSlot) {
    slots.forEach((slot, index) => {
        const item = hero.inventory[index];
        const isHovered = hoveredSlot === index;

        slot.frame.color = item
            ? (isHovered ? k.rgb(86, 100, 126) : k.rgb(58, 68, 88))
            : (isHovered ? k.rgb(72, 80, 98) : k.rgb(50, 58, 74));
        slot.frame.outline.color = isHovered
            ? k.rgb(...PANEL_BORDER_ACTIVE)
            : item
                ? k.rgb(...PANEL_BORDER)
                : k.rgb(82, 94, 118);
        slot.frame.scale = isHovered ? k.vec2(1.04) : k.vec2(1);
        slot.hotkey.color = item ? k.rgb(236, 240, 255) : k.rgb(146, 156, 176);

        if (!item) {
            slot.icon.hidden = true;
            return;
        }

        slot.icon.hidden = false;
        if (slot.icon.spriteKey !== item.icon) {
            slot.icon.spriteKey = item.icon;
            slot.icon.use(k.sprite(item.icon));
        }
    });
}

function buffLabel(stat) {
    return stat === "attack" ? "ATK" : "DEF";
}

function formatBuffSummary(hero) {
    if (hero.activeBuffs.length === 0) {
        return "Sem efeitos ativos";
    }

    return hero.activeBuffs
        .map((buff) => `+${buff.amount} ${buffLabel(buff.stat)} ${Math.ceil(buff.remaining)}s`)
        .join("  |  ");
}
