import { playSfx } from "../systems/audio.js";
import { hideMobileControls } from "../systems/mobileControls.js";

export function gameoverScene(k, {
    floor = 1,
    score = 0,
    kills = 0,
    heroName = "Heroi",
} = {}) {
    hideMobileControls();

    k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(18, 10, 14),
        k.z(-10),
    ]);

    k.add([
        k.rect(520, 320, { radius: 18 }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.color(34, 22, 30),
        k.outline(3, k.rgb(176, 92, 92)),
        k.opacity(0.97),
        k.z(10),
    ]);

    k.add([
        k.text("GAME OVER", { size: 34 }),
        k.pos(k.width() / 2, k.height() / 2 - 108),
        k.anchor("center"),
        k.color(232, 110, 110),
        k.z(11),
    ]);

    k.add([
        k.text(heroName, { size: 18 }),
        k.pos(k.width() / 2, k.height() / 2 - 72),
        k.anchor("center"),
        k.color(238, 240, 248),
        k.z(11),
    ]);

    k.add([
        k.text(`Andar alcancado: ${floor}`, { size: 18 }),
        k.pos(k.width() / 2, k.height() / 2 - 18),
        k.anchor("center"),
        k.color(214, 220, 236),
        k.z(11),
    ]);

    k.add([
        k.text(`Score: ${score}`, { size: 18 }),
        k.pos(k.width() / 2, k.height() / 2 + 18),
        k.anchor("center"),
        k.color(214, 220, 236),
        k.z(11),
    ]);

    k.add([
        k.text(`Inimigos derrotados: ${kills}`, { size: 18 }),
        k.pos(k.width() / 2, k.height() / 2 + 54),
        k.anchor("center"),
        k.color(214, 220, 236),
        k.z(11),
    ]);

    createGameOverButton(k, {
        x: k.width() / 2,
        y: k.height() / 2 + 126,
        label: "Voltar ao Inicio",
        accent: [176, 120, 120],
        onSelect: () => {
            playSfx(k, "menuSelect");
            k.go("menu", { screen: "main" });
        },
    });

    k.add([
        k.text("ENTER ou clique para voltar", { size: 13 }),
        k.pos(k.width() / 2, k.height() / 2 + 168),
        k.anchor("center"),
        k.color(180, 188, 206),
        k.z(11),
    ]);

    k.onKeyPress("enter", () => {
        playSfx(k, "menuSelect");
        k.go("menu", { screen: "main" });
    });
    k.onKeyPress("escape", () => {
        playSfx(k, "menuSelect");
        k.go("menu", { screen: "main" });
    });
}

function createGameOverButton(k, { x, y, label, accent, onSelect }) {
    const button = k.add([
        k.rect(250, 56, { radius: 12 }),
        k.pos(x, y),
        k.anchor("center"),
        k.area(),
        k.color(52, 34, 42),
        k.outline(3, k.rgb(...accent)),
        k.opacity(1),
        k.z(12),
    ]);

    const text = k.add([
        k.text(label, { size: 18 }),
        k.pos(x, y - 9),
        k.anchor("center"),
        k.color(244, 246, 255),
        k.z(13),
    ]);

    button.onClick(onSelect);
    button.onHover(() => {
        button.color = k.rgb(72, 44, 56);
        text.color = k.rgb(...accent);
        k.setCursor("pointer");
    });
    button.onHoverEnd(() => {
        button.color = k.rgb(52, 34, 42);
        text.color = k.rgb(244, 246, 255);
        k.setCursor("default");
    });
}
