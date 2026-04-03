// Geração Procedural de Dungeon — Binary Space Partitioning
// Retorna: { heroPos, enemySpawns, bounds }

export const TILE_SIZE = 16;

const BASE_W = 48;
const BASE_H = 39;
const MIN_CELL = 12;
const CORRIDOR_RADIUS = 1;

// Tiles identificados do Dungeon Tileset.tmx (firstgid=1, colunas=19):
// frame = tileID - 1
// Tile 41 → frame 40 → piso principal
// Tile 54 → frame 53 → piso secundário
// Tile 22 → frame 21 → parede topo-esquerda
// Tile 23 → frame 22 → parede topo
const FLOOR_FRAME_ROWS = [
    [40, 41, 42],
    [59, 60, 61],
    [78, 79, 78],
    [129, 130, 131],
    [148, 149, 150],
];
const WALL_VERTICAL_FRAMES = [81, 43, 45];
const WALL_VERTICAL_BOTTOM_FRAMES = [161,163];
const WALL_HORIZONTAL_FRAMES = [161,163];
const WALL_FILL_FRAME = 161;

export function generateDungeon(k, { floor = 1 } = {}) {
    const mapW = BASE_W + Math.floor(floor / 3) * 4;
    const mapH = BASE_H + Math.floor(floor / 3) * 4;

    // Grid preenchido com paredes
    const grid = Array.from({ length: mapH }, () => Array(mapW).fill("#"));

    // BSP
    const root = makeNode(1, 1, mapW - 2, mapH - 2);
    splitNode(root, MIN_CELL);
    const rooms = [];
    carveRooms(root, grid, rooms);
    connectRooms(root, grid);

    // Spawns
    const heroRoom = rooms[0];
    const exitRoom = rooms[rooms.length - 1];
    const heroPos  = tileCenter(k, heroRoom);

    const exitTX = Math.floor(exitRoom.x + exitRoom.w / 2);
    const exitTY = Math.floor(exitRoom.y + exitRoom.h / 2);
    grid[exitTY][exitTX] = "E";

    // Baús
    rooms.slice(1, -1).forEach((room, i) => {
        if (i % 3 === 0) {
            const cx = Math.floor(room.x + room.w / 2);
            const cy = Math.floor(room.y + room.h / 2);
            if (grid[cy][cx] === ".") grid[cy][cx] = "C";
        }
    });

    // Spawns de inimigos
    const enemySpawns = [];
    const density = 1 + Math.floor(floor / 2);
    rooms.slice(1).forEach((room) => {
        const usedTiles = new Set();

        for (let n = 0; n < Math.min(density, 4); n++) {
            const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            const tileKey = `${ex},${ey}`;

            if (grid[ey][ex] !== "." || usedTiles.has(tileKey)) continue;

            usedTiles.add(tileKey);
            enemySpawns.push(k.vec2(
                ex * TILE_SIZE + TILE_SIZE / 2,
                ey * TILE_SIZE + TILE_SIZE / 2,
            ));
        }
    });

    // -----------------------------------------------------------------------
    // Renderização — OTIMIZADO
    //
    // Estratégia:
    //   1. Rect de fundo escuro cobrindo o mapa (área de paredes/vazio)
    //   2. Entidade única com draw() customizado renderiza todos os tiles de
    //      piso sem criar uma entidade por tile — 1 entidade, N drawSprite()
    //   3. addLevel() apenas com PAREDES DE BORDA para colisão
    //   4. Objetos interativos (baús, saída) como entidades separadas
    // -----------------------------------------------------------------------

    // 1. Background escuro — área de paredes/vazio
    k.add([
        k.rect(mapW * TILE_SIZE, mapH * TILE_SIZE),
        k.pos(0, 0),
        k.color(15, 10, 20),
        k.z(-2),
    ]);

    const collisionWallGrid = grid.map((row, y) =>
        row.map((cell, x) => cell === "#" && isBorderWall(grid, x, y, false))
    );

    const renderWallGrid = grid.map((row, y) =>
        row.map((cell, x) => cell === "#" && isBorderWall(grid, x, y, true))
    );

    // 2. Renderizador único: desenha apenas chão e paredes visíveis
    k.add([
        k.pos(0, 0),
        k.z(-1),
        {
            id: "tileRenderer",
            draw() {
                const { startGX, endGX, startGY, endGY } = getVisibleTileBounds(k, mapW, mapH);

                for (let gy = startGY; gy <= endGY; gy++) {
                    for (let gx = startGX; gx <= endGX; gx++) {
                        const pos = k.vec2(gx * TILE_SIZE, gy * TILE_SIZE);

                        if (grid[gy][gx] !== "#") {
                            k.drawSprite({
                                sprite: "tileset",
                                frame: getFloorFrame(gx, gy),
                                pos,
                                scale: k.vec2(1, 1),
                            });
                        }

                        if (renderWallGrid[gy][gx]) {
                            k.drawSprite({
                                sprite: "tileset",
                                frame: WALL_FILL_FRAME,
                                pos,
                                scale: k.vec2(1, 1),
                            });

                            k.drawSprite({
                                sprite: "tileset",
                                frame: getWallFrame(grid, renderWallGrid, gx, gy),
                                pos,
                                scale: k.vec2(1, 1),
                            });
                        }
                    }
                }
            },
        },
    ]);

    // 3. Colisores mesclados de parede — muito menos objetos que addLevel por tile
    buildWallSegments(collisionWallGrid).forEach((segment) => {
        k.add([
            k.pos(segment.x * TILE_SIZE, segment.y * TILE_SIZE),
            k.anchor("topleft"),
            k.area({
                shape: new k.Rect(k.vec2(0, 0), segment.w * TILE_SIZE, TILE_SIZE),
            }),
            k.z(0),
            "wall",
        ]);
    });

    // 4. Objetos interativos como entidades independentes (melhor controle visual)
    rooms.slice(1, -1).forEach((room, i) => {
        if (i % 3 === 0) {
            const cx = Math.floor(room.x + room.w / 2);
            const cy = Math.floor(room.y + room.h / 2);
            const chest = k.add([
                k.sprite("chest1_D"),
                k.pos(cx * TILE_SIZE + TILE_SIZE / 2, cy * TILE_SIZE + TILE_SIZE / 2),
                k.anchor("center"),
                k.area({ shape: new k.Rect(k.vec2(-8, -6), 16, 12) }),
                k.z(1),
                "chest",
                { opened: false },
            ]);

            chest.play("closed");
        }
    });

    addRoomTorches(k, rooms);

    const exit = k.add([
        k.sprite("tileset", { frame: 36 }),
        k.pos(exitTX * TILE_SIZE + TILE_SIZE / 2, exitTY * TILE_SIZE + TILE_SIZE / 2),
        k.anchor("center"),
        k.scale(1),
        k.area({ shape: new k.Rect(k.vec2(-7, -7), 14, 14) }),
        k.z(1),
        "exit",
    ]);

    const bounds = {
        left:   TILE_SIZE,
        top:    TILE_SIZE,
        right:  (mapW - 1) * TILE_SIZE,
        bottom: (mapH - 1) * TILE_SIZE,
    };

    return { heroPos, enemySpawns, bounds };
}

// ---------------------------------------------------------------------------
// Helpers: isBorderWall
// ---------------------------------------------------------------------------

function isBorderWall(grid, x, y, includeDiagonals = false) {
    const offsets = includeDiagonals
        ? [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]
        : [[-1,0],[1,0],[0,-1],[0,1]];

    return offsets.some(
        ([dx, dy]) => isWalkable(grid[y + dy]?.[x + dx])
    );
}

function getFloorFrame(gx, gy) {
    const row = FLOOR_FRAME_ROWS[(gy + Math.floor(gx / 4)) % FLOOR_FRAME_ROWS.length];
    return row[gx % row.length];
}

function getWallFrame(grid, renderWallGrid, x, y) {
    const walkableBelow = isWalkable(grid[y + 1]?.[x]);
    const walkableLeft = isWalkable(grid[y]?.[x - 1]);
    const walkableRight = isWalkable(grid[y]?.[x + 1]);
    const wallBelow = renderWallGrid[y + 1]?.[x];

    if (walkableBelow) {
        return pickVariant(WALL_HORIZONTAL_FRAMES, x, y);
    }

    if (walkableLeft || walkableRight) {
        if (!wallBelow) {
            return pickVariant(WALL_VERTICAL_BOTTOM_FRAMES, x, y);
        }

        return pickVariant(WALL_VERTICAL_FRAMES, x, y);
    }

    return pickVariant(WALL_VERTICAL_FRAMES, x, y);
}

function pickVariant(frames, x, y) {
    return frames[Math.abs(x * 17 + y * 31) % frames.length];
}

function isWalkable(cell) {
    return cell === "." || cell === "C" || cell === "E";
}

function getVisibleTileBounds(k, mapW, mapH) {
    const camPos = k.getCamPos();
    const camScale = k.getCamScale();
    const zoom = camScale?.x ?? camScale ?? 1;
    const halfW = k.width() / (2 * zoom);
    const halfH = k.height() / (2 * zoom);
    const margin = 2;

    return {
        startGX: Math.max(0, Math.floor((camPos.x - halfW) / TILE_SIZE) - margin),
        endGX: Math.min(mapW - 1, Math.ceil((camPos.x + halfW) / TILE_SIZE) + margin),
        startGY: Math.max(0, Math.floor((camPos.y - halfH) / TILE_SIZE) - margin),
        endGY: Math.min(mapH - 1, Math.ceil((camPos.y + halfH) / TILE_SIZE) + margin),
    };
}

function buildWallSegments(renderWallGrid) {
    const segments = [];

    for (let y = 0; y < renderWallGrid.length; y++) {
        let x = 0;
        while (x < renderWallGrid[y].length) {
            if (!renderWallGrid[y][x]) {
                x += 1;
                continue;
            }

            const startX = x;
            while (x < renderWallGrid[y].length && renderWallGrid[y][x]) {
                x += 1;
            }

            segments.push({ x: startX, y, w: x - startX });
        }
    }

    return segments;
}

function addRoomTorches(k, rooms) {
    rooms.forEach((room, index) => {
        if (room.w < 8 || room.h < 6 || index % 2 !== 0) return;

        const torchY = (room.y + 1) * TILE_SIZE + 4;
        const xPositions = [room.x + 1, room.x + room.w - 2]
            .filter((x, i, list) => list.indexOf(x) === i);

        xPositions.forEach((tileX) => {
            const torch = k.add([
                k.pos(tileX * TILE_SIZE + TILE_SIZE / 2, torchY),
                k.sprite("fire"),
                k.anchor("center"),
                k.opacity(0.92),
                k.z(0.45),
            ]);

            torch.play("burn");
        });
    });
}

// ---------------------------------------------------------------------------
// BSP
// ---------------------------------------------------------------------------

function makeNode(x, y, w, h) {
    return { x, y, w, h, left: null, right: null, room: null };
}

function splitNode(node, minCell) {
    if (node.left || node.right) return;
    const canH = node.h >= minCell * 2 + 2;
    const canV = node.w >= minCell * 2 + 2;
    if (!canH && !canV) return;
    const horizontal = canH && canV ? Math.random() < 0.5 : canH;
    if (horizontal) {
        const range = node.h - minCell * 2 - 1;
        if (range <= 0) return;
        const split = minCell + 1 + Math.floor(Math.random() * range);
        node.left  = makeNode(node.x, node.y,         node.w, split);
        node.right = makeNode(node.x, node.y + split, node.w, node.h - split);
    } else {
        const range = node.w - minCell * 2 - 1;
        if (range <= 0) return;
        const split = minCell + 1 + Math.floor(Math.random() * range);
        node.left  = makeNode(node.x,         node.y, split,          node.h);
        node.right = makeNode(node.x + split, node.y, node.w - split, node.h);
    }
    splitNode(node.left,  minCell);
    splitNode(node.right, minCell);
}

function carveRooms(node, grid, rooms) {
    if (!node.left && !node.right) {
        const margin  = 1;
        const shrinkW = Math.floor(Math.random() * Math.min(3, node.w / 4));
        const shrinkH = Math.floor(Math.random() * Math.min(3, node.h / 4));
        const rx = node.x + margin + shrinkW;
        const ry = node.y + margin + shrinkH;
        const rw = node.w - margin * 2 - shrinkW;
        const rh = node.h - margin * 2 - shrinkH;
        if (rw < 3 || rh < 3) return;
        node.room = { x: rx, y: ry, w: rw, h: rh };
        rooms.push(node.room);
        for (let y = ry; y < ry + rh; y++)
            for (let x = rx; x < rx + rw; x++)
                if (grid[y]?.[x] !== undefined) grid[y][x] = ".";
        return;
    }
    if (node.left)  carveRooms(node.left,  grid, rooms);
    if (node.right) carveRooms(node.right, grid, rooms);
}

function getRoom(node) {
    if (node.room) return node.room;
    const l = node.left  ? getRoom(node.left)  : null;
    const r = node.right ? getRoom(node.right) : null;
    if (!l) return r;
    if (!r) return l;
    return Math.random() < 0.5 ? l : r;
}

function connectRooms(node, grid) {
    if (!node.left || !node.right) return;
    connectRooms(node.left,  grid);
    connectRooms(node.right, grid);
    const a = getRoom(node.left);
    const b = getRoom(node.right);
    if (!a || !b) return;
    const ax = Math.floor(a.x + a.w / 2), ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2), by = Math.floor(b.y + b.h / 2);

    carveHorizontalCorridor(grid, ay, ax, bx, CORRIDOR_RADIUS);
    carveVerticalCorridor(grid, bx, ay, by, CORRIDOR_RADIUS);
}

function carveHorizontalCorridor(grid, y, fromX, toX, radius) {
    for (let x = Math.min(fromX, toX); x <= Math.max(fromX, toX); x++) {
        for (let offset = -radius; offset <= radius; offset++) {
            if (grid[y + offset]?.[x] !== undefined) {
                grid[y + offset][x] = ".";
            }
        }
    }
}

function carveVerticalCorridor(grid, x, fromY, toY, radius) {
    for (let y = Math.min(fromY, toY); y <= Math.max(fromY, toY); y++) {
        for (let offset = -radius; offset <= radius; offset++) {
            if (grid[y]?.[x + offset] !== undefined) {
                grid[y][x + offset] = ".";
            }
        }
    }
}

function tileCenter(k, room) {
    const tx = Math.floor(room.x + room.w / 2);
    const ty = Math.floor(room.y + room.h / 2);
    return k.vec2(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2);
}
