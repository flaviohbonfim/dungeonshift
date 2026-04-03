import { createEnemy, pickEnemyTypeForFloor } from "../entities/enemy.js";
import { createHero } from "../entities/hero.js";
import { setupCombat } from "../systems/combat.js";
import { playSfx } from "../systems/audio.js";
import { generateDungeon } from "../systems/dungeon.js";
import { setupHUD } from "../systems/hud.js";

export function gameScene(k, { heroType = 1, floor = 1, heroState = null } = {}) {
    k.setGravity(0);
    k.setCamScale(2);

    const { heroPos, enemySpawns, bounds } = generateDungeon(k, { floor });
    const hero = createHero(k, {
        heroType,
        spawnPos: heroPos,
        bounds,
        savedState: heroState,
    });

    const enemies = enemySpawns.map((spawnPos) => createEnemy(k, {
        type: pickEnemyTypeForFloor(floor),
        pos: spawnPos,
        player: hero,
        floor,
    }));

    setupCombat(k, hero, enemies, {
        floor,
        heroType,
        onNextFloor(nextState) {
            k.go("game", { heroType, floor: floor + 1, heroState: nextState });
        },
        onGameOver(runResult) {
            k.go("gameover", {
                floor,
                score: runResult.score,
                kills: runResult.kills,
                heroType: runResult.heroType,
                heroName: runResult.heroName,
            });
        },
    });

    k.add([
        k.text(`Andar ${floor}`, { size: 20 }),
        k.pos(k.width() / 2, 52),
        k.anchor("center"),
        k.fixed(),
        k.color(238, 242, 255),
        k.opacity(0.9),
        k.z(170),
        k.lifespan(1.6),
        {
            update() {
                this.move(0, -6);
            },
        },
    ]);

    setupHUD(k, hero, { floor });

    let isPaused = false;
    let pauseUi = [];

    k.onKeyPress("escape", () => {
        if (isPaused) {
            closePauseMenu();
            return;
        }

        openPauseMenu();
    });

    function openPauseMenu() {
        isPaused = true;
        setScenePaused(true);
        playSfx(k, "pauseOpen");
        pauseUi = createPauseMenu(k, {
            onResume: closePauseMenu,
            onTitle: () => {
                playSfx(k, "menuSelect");
                k.setCursor("default");
                k.go("menu", { screen: "main" });
            },
        });
    }

    function closePauseMenu() {
        pauseUi.forEach((obj) => {
            if (obj.exists()) {
                obj.destroy();
            }
        });
        pauseUi = [];
        setScenePaused(false);
        isPaused = false;
        playSfx(k, "pauseClose");
        k.setCursor("default");
    }

    function setScenePaused(paused) {
        k.get("*").forEach((obj) => {
            if (obj.has("pauseUi")) return;
            obj.paused = paused;
        });
    }
}

function createPauseMenu(k, { onResume, onTitle }) {
    const objects = [];

    objects.push(k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.fixed(),
        k.color(8, 10, 18),
        k.opacity(0.7),
        k.z(500),
        "pauseUi",
    ]));

    objects.push(k.add([
        k.rect(360, 250, { radius: 16 }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.fixed(),
        k.color(26, 34, 48),
        k.outline(3, k.rgb(118, 138, 174)),
        k.opacity(0.98),
        k.z(501),
        "pauseUi",
    ]));

    objects.push(k.add([
        k.text("Jogo Pausado", { size: 26 }),
        k.pos(k.width() / 2, k.height() / 2 - 78),
        k.anchor("center"),
        k.fixed(),
        k.color(240, 244, 255),
        k.z(502),
        "pauseUi",
    ]));

    objects.push(k.add([
        k.text("ESC retoma a partida", { size: 13 }),
        k.pos(k.width() / 2, k.height() / 2 - 48),
        k.anchor("center"),
        k.fixed(),
        k.color(188, 198, 218),
        k.z(502),
        "pauseUi",
    ]));

    objects.push(...createPauseButton(k, {
        x: k.width() / 2,
        y: k.height() / 2 + 8,
        label: "Voltar ao Jogo",
        accent: [96, 176, 208],
        onClick: onResume,
    }));

    objects.push(...createPauseButton(k, {
        x: k.width() / 2,
        y: k.height() / 2 + 86,
        label: "Ir para Tela Inicial",
        accent: [188, 118, 118],
        onClick: onTitle,
    }));

    return objects;
}

function createPauseButton(k, { x, y, label, accent, onClick }) {
    const button = k.add([
        k.rect(250, 54, { radius: 12 }),
        k.pos(x, y),
        k.anchor("center"),
        k.fixed(),
        k.area(),
        k.color(36, 46, 64),
        k.outline(3, k.rgb(...accent)),
        k.opacity(1),
        k.z(503),
        "pauseUi",
    ]);

    const text = k.add([
        k.text(label, { size: 18 }),
        k.pos(x, y - 9),
        k.anchor("center"),
        k.fixed(),
        k.color(244, 246, 255),
        k.z(504),
        "pauseUi",
    ]);

    button.onClick(onClick);
    button.onHover(() => {
        button.color = k.rgb(52, 66, 92);
        text.color = k.rgb(...accent);
        k.setCursor("pointer");
    });
    button.onHoverEnd(() => {
        button.color = k.rgb(36, 46, 64);
        text.color = k.rgb(244, 246, 255);
        k.setCursor("default");
    });

    return [button, text];
}
