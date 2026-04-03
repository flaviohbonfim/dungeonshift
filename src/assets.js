// Manifesto central de assets — carregado uma vez antes das cenas
//
// Convenção de nomes dos sprites:
//   hero{n}_{dir}_{anim}    ex: hero1_S_idle, hero2_D_walk, hero3_U_attack
//   enemy{n}_{dir}_{anim}   ex: enemy1_S_idle, enemy4_D_death
//   Direções: D = Down | S = Side | U = Up

export function loadAssets(k) {
    // Espaço no path precisa de URL encoding — CSS FontFace não aceita espaço literal
    k.loadFont("pixel", "/4%20GUI/TinyFontCraftpixPixel.otf");

    loadHeroes(k);
    loadEnemies(k);
    loadProjectilesAndEffects(k);
    loadDungeonTileset(k);
    loadAnimatedObjects(k);
    loadGUI(k);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Carrega as 5 animações (idle, walk, attack, hurt, death) para uma entidade
 * nas 3 direções (D, S, U). Gera 15 sprite keys no total por entidade.
 *
 * Dimensões confirmadas (todas as entidades são uniformes):
 *   idle   128×32  → 4 frames
 *   walk   192×32  → 6 frames
 *   attack 128×32  → 4 frames
 *   hurt    64×32  → 2 frames
 *   death  256×32  → 8 frames
 */
function loadEntitySprites(k, id, folder) {
    const DIRS = ["D", "S", "U"];

    DIRS.forEach((dir) => {
        k.loadSprite(`${id}_${dir}_idle`, `/${folder}/${dir}_Idle.png`, {
            sliceX: 4,
            sliceY: 1,
            anims: {
                idle: { from: 0, to: 3, loop: true, speed: 8 },
            },
        });

        k.loadSprite(`${id}_${dir}_walk`, `/${folder}/${dir}_Walk.png`, {
            sliceX: 6,
            sliceY: 1,
            anims: {
                walk: { from: 0, to: 5, loop: true, speed: 10 },
            },
        });

        k.loadSprite(`${id}_${dir}_attack`, `/${folder}/${dir}_Attack.png`, {
            sliceX: 4,
            sliceY: 1,
            anims: {
                attack: { from: 0, to: 3, loop: false, speed: 12 },
            },
        });

        k.loadSprite(`${id}_${dir}_hurt`, `/${folder}/${dir}_Hurt.png`, {
            sliceX: 2,
            sliceY: 1,
            anims: {
                hurt: { from: 0, to: 1, loop: false, speed: 8 },
            },
        });

        k.loadSprite(`${id}_${dir}_death`, `/${folder}/${dir}_Death.png`, {
            sliceX: 8,
            sliceY: 1,
            anims: {
                death: { from: 0, to: 7, loop: false, speed: 8 },
            },
        });
    });
}

// ---------------------------------------------------------------------------
// Heróis — 3 personagens (pastas "1 Characters/1", "2", "3")
// ---------------------------------------------------------------------------

function loadHeroes(k) {
    // Mapeamento validado visualmente:
    // hero1 = Cavaleiro -> pasta 2
    // hero2 = Arqueiro  -> pasta 1
    // hero3 = Mago      -> pasta 3
    loadEntitySprites(k, "hero1", "1 Characters/2");
    loadEntitySprites(k, "hero2", "1 Characters/1");
    loadEntitySprites(k, "hero3", "1 Characters/3");
}

// ---------------------------------------------------------------------------
// Inimigos — 4 tipos (pastas "3 Dungeon Enemies/1", "2", "3", "4")
// ---------------------------------------------------------------------------

function loadEnemies(k) {
    loadEntitySprites(k, "enemy1", "3 Dungeon Enemies/1");
    loadEntitySprites(k, "enemy2", "3 Dungeon Enemies/2");
    loadEntitySprites(k, "enemy3", "3 Dungeon Enemies/3");
    loadEntitySprites(k, "enemy4", "3 Dungeon Enemies/4");
}

// ---------------------------------------------------------------------------
// Projéteis e efeitos visuais
// ---------------------------------------------------------------------------

function loadProjectilesAndEffects(k) {
    // Arrow: 11×3 — sprite único
    k.loadSprite("arrow", "/1 Characters/Other/Arrow.png");

    // Fireball: 4×4 — sprite único
    k.loadSprite("fireball", "/1 Characters/Other/Fireball.png");

    // Shadow: 13×6 — sprite único (sombra embaixo dos personagens)
    k.loadSprite("shadow", "/1 Characters/Other/Shadow.png");

    // Blood: 128×32 → 4 frames, loop: false (efeito ao tomar dano)
    const bloodCfg = {
        sliceX: 4,
        sliceY: 1,
        anims: { splat: { from: 0, to: 3, loop: false, speed: 12 } },
    };
    k.loadSprite("blood_D", "/1 Characters/Other/D_Blood.png", bloodCfg);
    k.loadSprite("blood_S", "/1 Characters/Other/S_Blood.png", bloodCfg);
    k.loadSprite("blood_U", "/1 Characters/Other/U_Blood.png", bloodCfg);
}

// ---------------------------------------------------------------------------
// Dungeon tileset — paredes, pisos, objetos estáticos
//
// Tileset.png: 304×176, tiles de 16×16 → sliceX=19, sliceY=11
// ---------------------------------------------------------------------------

export const TILE_SIZE = 16;

export const TILESET_FRAMES = {
    // índices do Tileset.png — mapeados por função (ajustar visualmente na Fase 3)
    floor:      0,
    wall_top:   1,
    wall_side:  2,
    wall_bot:   3,
    corner_tl:  4,
    corner_tr:  5,
    corner_bl:  6,
    corner_br:  7,
};

function loadDungeonTileset(k) {
    k.loadSprite("tileset", "/2 Dungeon Tileset/1 Tiles/Tileset.png", {
        sliceX: 19,
        sliceY: 11,
    });
}

// ---------------------------------------------------------------------------
// Objetos animados do dungeon
// ---------------------------------------------------------------------------

function loadAnimatedObjects(k) {
    // --- Baús (Chest) ---
    // Chest1 / Chest2 — variantes D, S, U: 64×24 → 4 frames (16px por frame)
    const chestCfg = {
        sliceX: 4,
        sliceY: 1,
        anims: {
            closed: { from: 0, to: 0, loop: false, speed: 1 },
            open:   { from: 0, to: 3, loop: false, speed: 8 },
        },
    };
    ["D", "S", "U"].forEach((dir) => {
        k.loadSprite(`chest1_${dir}`, `/2 Dungeon Tileset/3 Animated objects/Chest1_${dir}.png`, chestCfg);
        k.loadSprite(`chest2_${dir}`, `/2 Dungeon Tileset/3 Animated objects/Chest2_${dir}.png`, chestCfg);
    });

    // --- Portas (Door) ---
    // Door D/U: 80×20 → 4 frames (20px por frame)
    // Door S:   56×26 → 4 frames (14px por frame)
    const doorCfg = {
        sliceX: 4,
        sliceY: 1,
        anims: {
            closed: { from: 0, to: 0, loop: false, speed: 1 },
            open:   { from: 0, to: 3, loop: false, speed: 10 },
        },
    };
    ["D", "S", "U"].forEach((dir) => {
        k.loadSprite(`door_${dir}`, `/2 Dungeon Tileset/3 Animated objects/Door_${dir}.png`, doorCfg);
    });

    // --- Grande Porta (BigDoor) ---
    // BigDoor D/U: 216×36 → 6 frames (36px por frame)
    // BigDoor S:   180×42 → 6 frames (30px por frame)
    const bigDoorCfg = {
        sliceX: 6,
        sliceY: 1,
        anims: {
            closed: { from: 0, to: 0, loop: false, speed: 1 },
            open:   { from: 0, to: 5, loop: false, speed: 10 },
        },
    };
    ["D", "S", "U"].forEach((dir) => {
        k.loadSprite(`bigdoor_${dir}`, `/2 Dungeon Tileset/3 Animated objects/BigDoor_${dir}.png`, bigDoorCfg);
    });

    // --- Alçapão (Trapdoor) ---
    // Trapdoor D/S/U: 132×32 → 4 frames (33px por frame)
    const trapdoorCfg = {
        sliceX: 4,
        sliceY: 1,
        anims: {
            closed: { from: 0, to: 0, loop: false, speed: 1 },
            open:   { from: 0, to: 3, loop: false, speed: 8 },
        },
    };
    ["D", "S", "U"].forEach((dir) => {
        k.loadSprite(`trapdoor_${dir}`, `/2 Dungeon Tileset/3 Animated objects/Trapdoor_${dir}.png`, trapdoorCfg);
    });

    // --- Espinhos (Spikes) ---
    // 102×17 → 6 frames (17px por frame) — animação de ativar/retrair
    k.loadSprite("spikes", "/2 Dungeon Tileset/3 Animated objects/Spikes.png", {
        sliceX: 6,
        sliceY: 1,
        anims: {
            retracted: { from: 0, to: 0, loop: false, speed: 1 },
            trigger:   { from: 0, to: 5, loop: false, speed: 12 },
            extended:  { from: 5, to: 5, loop: false, speed: 1 },
        },
    });

    // --- Fogo (Fire) ---
    // 128×16 → 8 frames (16px por frame) — loop infinito
    k.loadSprite("fire", "/2 Dungeon Tileset/3 Animated objects/Fire1.png", {
        sliceX: 8,
        sliceY: 1,
        anims: {
            burn: { from: 0, to: 7, loop: true, speed: 12 },
        },
    });

    // --- Alavancas (Lever) ---
    // Lever1/2: 64×18 → 4 frames (16px por frame)
    const leverCfg = {
        sliceX: 4,
        sliceY: 1,
        anims: {
            off:      { from: 0, to: 0, loop: false, speed: 1 },
            activate: { from: 0, to: 3, loop: false, speed: 10 },
            on:       { from: 3, to: 3, loop: false, speed: 1 },
        },
    };
    k.loadSprite("lever1", "/2 Dungeon Tileset/3 Animated objects/Lever1.png", leverCfg);
    k.loadSprite("lever2", "/2 Dungeon Tileset/3 Animated objects/Lever2.png", leverCfg);
}

// ---------------------------------------------------------------------------
// GUI — barras de vida, ícones, interface
// ---------------------------------------------------------------------------

function loadGUI(k) {
    // --- Fog of war ---
    k.loadSprite("fog", "/4 GUI/Fog.png");

    // --- Logo ---
    k.loadSprite("logo", "/4 GUI/6 Logo/1.png");

    // --- Barras de vida (BarTiles individuais: 16×16 cada) ---
    for (let i = 1; i <= 18; i++) {
        const n = String(i).padStart(2, "0");
        k.loadSprite(`bar_${n}`, `/4 GUI/4 Bars/BarTile_${n}.png`);
    }

    // --- BarsMap (12x12 tiles, 16x16 com gap de 2px) ---
    k.loadSprite("bars_map", "/4 GUI/4 Bars/BarsMap.png", {
        frames: buildBarsMapFrames(k),
    });

    // --- Ícones (10×10 cada, 60 no total) ---
    for (let i = 1; i <= 60; i++) {
        const n = String(i).padStart(2, "0");
        k.loadSprite(`icon_${n}`, `/4 GUI/3 Icons/Icon_${n}.png`);
    }

    // --- Painéis de interface (TileMaps para janelas/painéis) ---
    for (let i = 1; i <= 8; i++) {
        k.loadSprite(`ui_map_${i}`, `/4 GUI/1 Interface/TileMap${i}.png`);
    }

    // --- Tiles individuais da interface (16×16 cada) ---
    for (let i = 1; i <= 32; i++) {
        const n = String(i).padStart(2, "0");
        k.loadSprite(`ui_tile_${n}`, `/4 GUI/1 Interface/Tile_${n}.png`);
    }

    // --- Scrolling tiles (para backgrounds ou menus) ---
    k.loadSprite("scroll_map",  "/4 GUI/5 Scrolling/ScrollingMap.png");
    k.loadSprite("scroll_t1",   "/4 GUI/5 Scrolling/ScrollingTile1.png");
    k.loadSprite("scroll_t2",   "/4 GUI/5 Scrolling/ScrollingTile2.png");
    k.loadSprite("scroll_t3",   "/4 GUI/5 Scrolling/ScrollingTile3.png");
}

function buildBarsMapFrames(k) {
    const texSize = 214;
    const tileSize = 16;
    const gap = 2;
    const cols = 12;
    const rows = 12;

    return Array.from({ length: cols * rows }, (_, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * (tileSize + gap);
        const y = row * (tileSize + gap);

        return k.quad(
            x / texSize,
            y / texSize,
            tileSize / texSize,
            tileSize / texSize,
        );
    });
}
