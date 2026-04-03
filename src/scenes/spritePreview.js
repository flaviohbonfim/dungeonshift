const PAGES = [
    {
        title: "Herois Corrigidos",
        cols: 5,
        cellX: 140,
        cellY: 110,
        entries: [
            spriteEntry("hero1_S_idle", "Cavaleiro idle"),
            spriteEntry("hero1_S_walk", "Cavaleiro walk"),
            spriteEntry("hero1_S_attack", "Cavaleiro attack"),
            spriteEntry("hero1_D_idle", "Cavaleiro down"),
            spriteEntry("hero1_U_idle", "Cavaleiro up"),
            spriteEntry("hero2_S_idle", "Arqueiro idle"),
            spriteEntry("hero2_S_walk", "Arqueiro walk"),
            spriteEntry("hero2_S_attack", "Arqueiro attack"),
            spriteEntry("hero2_D_idle", "Arqueiro down"),
            spriteEntry("hero2_U_idle", "Arqueiro up"),
            spriteEntry("hero3_S_idle", "Mago idle"),
            spriteEntry("hero3_S_walk", "Mago walk"),
            spriteEntry("hero3_S_attack", "Mago attack"),
            spriteEntry("hero3_D_idle", "Mago down"),
            spriteEntry("hero3_U_idle", "Mago up"),
        ],
    },
    {
        title: "Inimigos",
        cols: 5,
        cellX: 140,
        cellY: 110,
        entries: [
            spriteEntry("enemy1_S_idle", "Rato idle"),
            spriteEntry("enemy1_S_walk", "Rato walk"),
            spriteEntry("enemy1_S_attack", "Rato attack"),
            spriteEntry("enemy1_D_idle", "Rato down"),
            spriteEntry("enemy1_U_idle", "Rato up"),
            spriteEntry("enemy2_S_idle", "Goblin clava idle"),
            spriteEntry("enemy2_S_walk", "Goblin clava walk"),
            spriteEntry("enemy2_S_attack", "Goblin clava attack"),
            spriteEntry("enemy3_S_idle", "Goblin adaga idle"),
            spriteEntry("enemy3_S_attack", "Goblin adaga attack"),
            spriteEntry("enemy4_S_idle", "Lider idle"),
            spriteEntry("enemy4_S_attack", "Lider attack"),
            spriteEntry("enemy4_S_death", "Lider death"),
        ],
    },
    {
        title: "Objetos e Efeitos",
        cols: 6,
        cellX: 120,
        cellY: 110,
        entries: [
            spriteEntry("arrow", "Arrow", 4),
            spriteEntry("fireball", "Fireball", 4),
            spriteEntry("shadow", "Shadow", 4),
            spriteEntry("blood_D", "Blood D", 3),
            spriteEntry("blood_S", "Blood S", 3),
            spriteEntry("blood_U", "Blood U", 3),
            spriteEntry("chest1_D", "Chest1 D", 3),
            spriteEntry("door_D", "Door D", 3),
            spriteEntry("fire", "Fire1", 3),
            spriteEntry("spikes", "Spikes", 3),
            spriteEntry("lever1", "Lever1", 3),
            spriteEntry("lever2", "Lever2", 3),
        ],
    },
    {
        title: "Barras HUD Candidatas",
        cols: 6,
        cellX: 120,
        cellY: 88,
        entries: Array.from({ length: 18 }, (_, index) => {
            const n = String(index + 1).padStart(2, "0");
            return spriteEntry(`bar_${n}`, `bar_${n}`, 4);
        }),
    },
    {
        title: "BarsMap 000-047",
        cols: 8,
        cellX: 86,
        cellY: 80,
        entries: frameEntriesFor("bars_map", 0, 47, 3.2, "bars_map"),
    },
    {
        title: "BarsMap 048-095",
        cols: 8,
        cellX: 86,
        cellY: 80,
        entries: frameEntriesFor("bars_map", 48, 95, 3.2, "bars_map"),
    },
    {
        title: "BarsMap 096-143",
        cols: 8,
        cellX: 86,
        cellY: 80,
        entries: frameEntriesFor("bars_map", 96, 143, 3.2, "bars_map"),
    },
    {
        title: "Tiles de Interface 01-16",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: Array.from({ length: 16 }, (_, index) => {
            const n = String(index + 1).padStart(2, "0");
            return spriteEntry(`ui_tile_${n}`, `ui_tile_${n}`, 3.2);
        }),
    },
    {
        title: "Tiles de Interface 17-32",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: Array.from({ length: 16 }, (_, index) => {
            const n = String(index + 17).padStart(2, "0");
            return spriteEntry(`ui_tile_${n}`, `ui_tile_${n}`, 3.2);
        }),
    },
    {
        title: "Tileset Dungeon 00-39",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: frameEntries(0, 39),
    },
    {
        title: "Tileset Dungeon 40-79",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: frameEntries(40, 79),
    },
    {
        title: "Tileset Dungeon 80-119",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: frameEntries(80, 119),
    },
    {
        title: "Tileset Dungeon 120-159",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: frameEntries(120, 159),
    },
    {
        title: "Tileset Dungeon 160-199",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: frameEntries(160, 199),
    },
    {
        title: "Tileset Dungeon 200-208",
        cols: 8,
        cellX: 90,
        cellY: 82,
        entries: frameEntries(200, 208),
    },
];

export function spritePreviewScene(k) {
    let page = 0;

    function render() {
        k.destroyAll();

        const current = PAGES[page];

        k.add([
            k.rect(k.width(), k.height()),
            k.pos(0, 0),
            k.color(12, 14, 22),
            k.z(-10),
        ]);

        k.add([
            k.text(`(${page + 1}/${PAGES.length}) ${current.title}`, { size: 18 }),
            k.pos(12, 10),
            k.fixed(),
            k.color(232, 238, 248),
        ]);

        k.add([
            k.text("<- -> navegar  |  ESC voltar  |  use estas paginas para me dizer bars_map frame XX, ui_tile_xx e frame XX do tileset", {
                size: 11,
            }),
            k.pos(12, 34),
            k.fixed(),
            k.color(180, 190, 214),
        ]);

        const cols = current.cols ?? 6;
        const cellX = current.cellX ?? 110;
        const cellY = current.cellY ?? 96;
        const startX = 18;
        const startY = 64;

        current.entries.forEach((entry, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * cellX;
            const y = startY + row * cellY;

            renderEntry(k, entry, x, y);
        });
    }

    render();

    k.onKeyPress("right", () => {
        page = (page + 1) % PAGES.length;
        render();
    });

    k.onKeyPress("left", () => {
        page = (page - 1 + PAGES.length) % PAGES.length;
        render();
    });

    k.onKeyPress("escape", () => k.go("menu"));
}

function renderEntry(k, entry, x, y) {
    k.add([
        k.rect(72, 54, { radius: 6 }),
        k.pos(x, y + 24),
        k.color(24, 30, 42),
        k.outline(1, k.rgb(74, 88, 116)),
        k.opacity(0.92),
    ]);

    try {
        const spriteComp = entry.frame === undefined
            ? k.sprite(entry.key)
            : k.sprite(entry.key, { frame: entry.frame });

        const obj = k.add([
            spriteComp,
            k.pos(x + 36, y + 52),
            k.anchor("center"),
            k.scale(entry.scale ?? 3),
        ]);

        if (entry.frame === undefined) {
            const animNames = Object.keys(obj.sprite?.anims ?? {});
            if (animNames.length > 0) {
                obj.play(animNames[0]);
            }
        }
    } catch {
        k.add([
            k.rect(20, 20),
            k.pos(x + 26, y + 42),
            k.color(200, 50, 50),
        ]);
    }

    k.add([
        k.text(entry.label, { size: 9, width: 84, align: "center" }),
        k.pos(x - 6, y),
        k.color(190, 198, 214),
    ]);
}

function spriteEntry(key, label, scale = 3) {
    return { key, label, scale };
}

function frameEntries(from, to) {
    return frameEntriesFor("tileset", from, to, 3.2, "frame");
}

function frameEntriesFor(key, from, to, scale, prefix) {
    return Array.from({ length: to - from + 1 }, (_, index) => ({
        key,
        frame: from + index,
        label: `${prefix} ${String(from + index).padStart(2, "0")}`,
        scale,
    }));
}
