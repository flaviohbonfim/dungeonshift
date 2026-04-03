import { HERO_STATS } from "../data/stats.js";
import { playSfx } from "../systems/audio.js";
import { hideMobileControls } from "../systems/mobileControls.js";

const STAT_BAR_FRAMES = {
    FOR: [33, 34, 35],
    VEL: [96, 97, 98],
    MAG: [99, 100, 101],
};

const HERO_CARDS = [
    {
        type: 1,
        accent: [120, 145, 190],
        role: "Linha de frente",
        blurb: "Ataque corpo a corpo com vida alta e ritmo constante.",
        stats: [
            { icon: "icon_07", label: "FOR", value: 4 },
            { icon: "icon_43", label: "VEL", value: 2 },
            { icon: "icon_56", label: "MAG", value: 1 },
        ],
    },
    {
        type: 2,
        accent: [90, 190, 220],
        role: "Controle a distancia",
        blurb: "Mobilidade alta e disparos seguros para limpar salas.",
        stats: [
            { icon: "icon_07", label: "FOR", value: 3 },
            { icon: "icon_43", label: "VEL", value: 5 },
            { icon: "icon_56", label: "MAG", value: 2 },
        ],
    },
    {
        type: 3,
        accent: [218, 120, 164],
        role: "Burst arcano",
        blurb: "Projetil forte, menos vida e dependencia de posicionamento.",
        stats: [
            { icon: "icon_07", label: "FOR", value: 2 },
            { icon: "icon_43", label: "VEL", value: 2 },
            { icon: "icon_56", label: "MAG", value: 5 },
        ],
    },
];

export function menuScene(k, { screen = "main" } = {}) {
    hideMobileControls();
    drawMenuBackground(k);

    if (screen === "heroes") {
        renderHeroSelection(k);
        return;
    }

    renderMainMenu(k);
}

function drawMenuBackground(k) {
    k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(16, 22, 34),
        k.z(-20),
    ]);
}

function renderMainMenu(k) {
    drawDungeonShiftLogo(k, { x: k.width() / 2, y: 150, scale: 1 });

    k.add([
        k.text("Desca ao calabouco e sobreviva o maximo que puder", { size: 16, align: "center", width: 560 }),
        k.pos(k.width() / 2, 270),
        k.anchor("center"),
        k.color(214, 222, 240),
        k.z(11),
    ]);

    createActionButton(k, {
        x: k.width() / 2,
        y: 395,
        label: "Comecar Jogo",
        accent: [120, 145, 190],
        onSelect: () => {
            playSfx(k, "menuSelect");
            k.go("menu", { screen: "heroes" });
        },
    });

    createActionButton(k, {
        x: k.width() / 2,
        y: 485,
        label: "Ver Sprites",
        accent: [90, 190, 220],
        onSelect: () => {
            playSfx(k, "menuSelect");
            k.go("preview");
        },
    });

    k.add([
        k.text("ENTER inicia  |  P abre preview", { size: 14 }),
        k.pos(k.width() / 2, k.height() - 60),
        k.anchor("center"),
        k.color(184, 194, 214),
        k.z(11),
    ]);

    k.onKeyPress("enter", () => k.go("menu", { screen: "heroes" }));
    k.onKeyPress("p", () => k.go("preview"));
}

function renderHeroSelection(k) {
    let hoveredType = 1;

    drawDungeonShiftLogo(k, { x: k.width() / 2, y: 88, scale: 0.5, opacity: 0.88 });

    k.add([
        k.text("Escolha seu aventureiro", { size: 26 }),
        k.pos(k.width() / 2, 198),
        k.anchor("center"),
        k.color(236, 242, 255),
        k.z(11),
    ]);

    const helperText = k.add([
        k.text("Clique em um card ou pressione 1, 2 ou 3", { size: 14 }),
        k.pos(k.width() / 2, k.height() - 56),
        k.anchor("center"),
        k.color(214, 222, 240),
        k.z(11),
    ]);

    createActionButton(k, {
        x: 140,
        y: 88,
        label: "Voltar",
        accent: [140, 150, 176],
        width: 140,
        height: 44,
        textSize: 16,
        onSelect: () => {
            playSfx(k, "menuSelect");
            k.go("menu", { screen: "main" });
        },
    });

    const cards = HERO_CARDS.map((config, index) => createHeroCard(k, config, {
        x: k.width() / 2 + (index - 1) * 250,
        y: 420,
        onSelect: (type) => startGame(k, type),
        onHover: (type) => {
            hoveredType = type;
            helperText.text = `${HERO_STATS[type].name}  -  ${config.role}`;
            k.setCursor("pointer");
        },
        onHoverEnd: () => {
            helperText.text = "Clique em um card ou pressione 1, 2 ou 3";
            k.setCursor("default");
        },
    }));

    k.onKeyPress("1", () => startGame(k, 1));
    k.onKeyPress("2", () => startGame(k, 2));
    k.onKeyPress("3", () => startGame(k, 3));
    k.onKeyPress("enter", () => startGame(k, hoveredType));
    k.onKeyPress("p", () => k.go("preview"));
    k.onKeyPress("escape", () => k.go("menu", { screen: "main" }));

    k.onUpdate(() => {
        cards.forEach((card, index) => {
            card.preview.pos.y = card.basePreviewY + Math.sin(k.time() * 2 + index) * 4;
        });
    });
}

function createActionButton(k, {
    x,
    y,
    label,
    accent,
    onSelect,
    width = 280,
    height = 58,
    textSize = 20,
}) {
    const button = k.add([
        k.rect(width, height, { radius: 12 }),
        k.pos(x, y),
        k.anchor("center"),
        k.area(),
        k.color(28, 36, 52),
        k.outline(3, k.rgb(...accent)),
        k.opacity(0.97),
        k.z(20),
    ]);

    const labelObj = k.add([
        k.text(label, { size: textSize }),
        k.pos(x, y - 10),
        k.anchor("center"),
        k.color(244, 246, 255),
        k.z(21),
    ]);

    button.onClick(onSelect);
    button.onHover(() => {
        button.color = k.rgb(40, 52, 74);
        button.scale = k.vec2(1.03);
        labelObj.color = k.rgb(...accent);
        k.setCursor("pointer");
    });
    button.onHoverEnd(() => {
        button.color = k.rgb(28, 36, 52);
        button.scale = k.vec2(1);
        labelObj.color = k.rgb(244, 246, 255);
        k.setCursor("default");
    });
}

function createHeroCard(k, config, { x, y, onSelect, onHover, onHoverEnd }) {
    const baseRect = k.add([
        k.rect(220, 336, { radius: 12 }),
        k.pos(x, y),
        k.anchor("center"),
        k.area(),
        k.color(28, 36, 52),
        k.outline(3, k.rgb(...config.accent)),
        k.opacity(0.96),
        k.z(20),
    ]);

    const accentHeader = k.add([
        k.rect(220, 58, { radius: 12 }),
        k.pos(x, y - 123),
        k.anchor("center"),
        k.color(...config.accent),
        k.opacity(0.2),
        k.z(21),
    ]);

    const title = k.add([
        k.text(HERO_STATS[config.type].name, { size: 18 }),
        k.pos(x, y - 126),
        k.anchor("center"),
        k.color(244, 246, 255),
        k.z(22),
    ]);

    k.add([
        k.text(config.role, { size: 12 }),
        k.pos(x, y - 102),
        k.anchor("center"),
        k.color(...config.accent),
        k.z(22),
    ]);

    const preview = k.add([
        k.sprite(`hero${config.type}_D_idle`),
        k.pos(x, y - 32),
        k.anchor("center"),
        k.scale(3.2),
        k.z(23),
    ]);
    preview.play("idle");

    k.add([
        k.sprite("shadow"),
        k.pos(x, y + 18),
        k.anchor("center"),
        k.scale(2.8),
        k.opacity(0.35),
        k.z(22),
    ]);

    k.add([
        k.text(config.blurb, { size: 11, width: 170, align: "center" }),
        k.pos(x, y + 44),
        k.anchor("center"),
        k.color(218, 228, 242),
        k.z(22),
    ]);

    config.stats.forEach((stat, rowIndex) => {
        const rowY = y + 86 + rowIndex * 34;

        k.add([
            k.sprite(stat.icon),
            k.pos(x - 72, rowY),
            k.anchor("center"),
            k.scale(2.3),
            k.z(22),
        ]);

        k.add([
            k.text(stat.label, { size: 11 }),
            k.pos(x - 48, rowY - 8),
            k.z(22),
            k.color(232, 238, 248),
        ]);

        buildStatBar(stat.label, stat.value).forEach((frame, frameIndex) => {
            k.add([
                k.sprite("bars_map", { frame }),
                k.pos(x - 4 + frameIndex * 18, rowY - 12),
                k.scale(1.1),
                k.z(22),
            ]);
        });
    });

    baseRect.onClick(() => onSelect(config.type));
    baseRect.onHover(() => {
        baseRect.color = k.rgb(40, 52, 74);
        baseRect.outline.color = k.rgb(...config.accent);
        baseRect.scale = k.vec2(1.03);
        accentHeader.opacity = 0.32;
        title.color = k.rgb(...config.accent);
        onHover(config.type);
    });
    baseRect.onHoverEnd(() => {
        baseRect.color = k.rgb(28, 36, 52);
        baseRect.outline.color = k.rgb(...config.accent);
        baseRect.scale = k.vec2(1);
        accentHeader.opacity = 0.2;
        title.color = k.rgb(244, 246, 255);
        onHoverEnd();
    });

    return {
        preview,
        basePreviewY: y - 32,
    };
}

function buildStatBar(label, value) {
    const [left, center, right] = STAT_BAR_FRAMES[label] ?? STAT_BAR_FRAMES.FOR;

    if (value <= 1) return [center];
    if (value === 2) return [left, right];

    return [left, ...Array(Math.max(1, value - 2)).fill(center), right];
}

function drawDungeonShiftLogo(k, { x, y, scale = 1, opacity = 1 }) {
    k.add([
        k.text("DungeonShift", { size: 54 * scale }),
        k.pos(x + 4, y + 5),
        k.anchor("center"),
        k.color(16, 24, 36),
        k.opacity(0.85 * opacity),
        k.z(9),
    ]);

    k.add([
        k.text("DungeonShift", { size: 54 * scale }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(236, 242, 255),
        k.opacity(opacity),
        k.z(10),
    ]);

    k.add([
        k.text("shift into the next floor", { size: 14 * scale, width: 420, align: "center" }),
        k.pos(x, y + 38 * scale),
        k.anchor("center"),
        k.color(122, 160, 214),
        k.opacity(0.9 * opacity),
        k.z(10),
    ]);

    k.add([
        k.rect(220 * scale, 4 * scale, { radius: 2 * scale }),
        k.pos(x, y + 60 * scale),
        k.anchor("center"),
        k.color(122, 160, 214),
        k.opacity(0.75 * opacity),
        k.z(10),
    ]);
}

function startGame(k, heroType) {
    playSfx(k, "menuSelect");
    k.setCursor("default");
    k.go("game", { heroType, floor: 1 });
}
