# Plano de Desenvolvimento — Roguelike Top-Down com KAPLAY

> Baseado no estudo arquitetural `estudo-kaplay.md` e nos assets CraftPix disponíveis em `assets/`

---

## Visão Geral dos Assets Disponíveis

| Pasta | Conteúdo |
|---|---|
| `1 Characters/1,2,3` | 3 heróis — animações D/S/U para Attack, Death, Hurt, Idle, Walk |
| `3 Dungeon Enemies/1,2,3,4` | 4 inimigos — mesma estrutura direcional |
| `1 Characters/Other` | Arrow.png, Fireball.png, Shadow.png, Blood (D/S/U) |
| `2 Dungeon Tileset/1 Tiles` | Tileset.png + ~80 tiles individuais |
| `2 Dungeon Tileset/2 Objects` | Blockage, Bookshelf, Boxes, Chairs, Doors, Tables, Torches, Trapdoors, Other |
| `2 Dungeon Tileset/3 Animated objects` | BigDoor, Door, Chest1/2, Fire, Lever, Spikes, Trapdoor — variantes D/S/U |
| `4 GUI/1 Interface` | TileMaps 1-8 + Tiles 1-32 (painéis, botões, janelas) |
| `4 GUI/3 Icons` | 60 ícones |
| `4 GUI/4 Bars` | BarsMap + BarTiles 1-18 (barras de vida/mana) |
| `4 GUI/5 Scrolling` | 3 tiles de scroll |
| `4 GUI/6 Logo` | Logo do jogo |
| `4 GUI` | Fog.png, TinyFontCraftpixPixel.otf, Palette.png |
| `5Tiled_files` | Arquivos .tmx de referência para sprites |

---

## Fase 0 — Setup do Projeto

**Objetivo:** Scaffolding com KAPLAY + Vite, estrutura de pastas, assets no lugar certo.

### Tarefas

- [ ] `npx create-kaplay roguelike-game` para inicializar o projeto com Vite
- [ ] Copiar a pasta `assets/` para dentro de `public/` (raiz estática do Vite)
- [ ] Criar a estrutura de módulos em `src/`:
  ```
  src/
  ├── main.js          ← inicialização kaplay() + registro de cenas
  ├── assets.js        ← todos os loadSprite() centralizados
  ├── scenes/
  │   ├── menu.js      ← seleção de personagem
  │   ├── game.js      ← loop principal
  │   └── gameover.js  ← tela de derrota
  ├── entities/
  │   ├── hero.js      ← fábrica do herói
  │   └── enemy.js     ← fábrica de inimigos
  ├── systems/
  │   ├── dungeon.js   ← geração procedural BSP
  │   ├── combat.js    ← dano, hitbox, projéteis
  │   └── hud.js       ← UI com fixed()
  └── components/
      ├── healthManager.js
      └── inventoryManager.js
  ```
- [ ] Configurar `kaplay()` em `main.js`:
  - Resolução virtual fixa (ex: 1280×720)
  - `crisp: true` — desabilitar anti-aliasing
  - Background escuro (`#1a1a2e`)
  - `debug: true` durante desenvolvimento
- [ ] Registrar a fonte customizada: `loadFont("pixel", "public/assets/4 GUI/TinyFontCraftpixPixel.otf")`

### Entregável
Projeto rodando no browser com tela preta e sem erros de console.

---

## Fase 1 — Carregamento de Assets (assets.js)

**Objetivo:** Manifesto centralizado de todos os sprites com metadados de animação corretos.

### Tarefas

**Heróis** — `loadSprite()` para cada um dos 3 personagens, com `anims`:
- `idle` → loop: true
- `walk` → loop: true
- `attack` → loop: false
- `hurt` → loop: false
- `death` → loop: false
- Cada herói tem variantes direcionais D (down), S (side), U (up) — carregar as 3 direções separadas

**Inimigos** — mesma estrutura para os 4 enemies (pastas `3 Dungeon Enemies/1..4`)

**Projéteis e efeitos:**
- `Arrow.png` (Arqueiro)
- `Fireball.png` (Mago)
- `Shadow.png` (sombra sob personagens)
- `D_Blood.png`, `S_Blood.png`, `U_Blood.png` (efeito de dano)

**Tileset de dungeon:**
- `Tileset.png` → `loadSprite("tileset", ...)` com sliceX/sliceY
- Objetos animados: Chest1/2 D/S/U, Door D/S/U, BigDoor D/S/U, Spikes, Fire1, Trapdoor D/S/U, Lever1/2

**GUI:**
- BarTiles 1-18 para a barra de vida
- TileMaps para painéis de janela
- Icons 1-60

### Ponto crítico
Verificar `sliceX` e `sliceY` exatos olhando cada spritesheet. Inspecionar os `.tmx` em `5Tiled_files/` como referência de framecount por animação.

### Entregável
Console do KAPLAY sem erros de asset não encontrado. Todos os sprites visíveis em uma cena de teste.

---

## Fase 2 — Motor Cinemático do Herói (hero.js)

**Objetivo:** Herói controlável com movimento top-down correto, animações acopladas ao estado e câmera suave.

### Tarefas

**Movimento:**
- `setGravity(0)` — sem gravidade
- Componentes: `pos()`, `sprite()`, `area()`, `body({ isStatic: false })`
- Leitura de input via `isKeyDown()` em `onUpdate()`
- Vetor direcional `(dx, dy)` com normalização diagonal: se `dx != 0 && dy != 0`, multiplicar por `0.707`
- Aplicar deslocamento: `hero.move(dir.scale(SPEED * dt()))`

**Espelhamento de sprite:**
- `flipX = true` quando dx < 0 (movimento para oeste)
- `flipX = false` quando dx > 0

**Transição de animações:**
- Verificar `hero.getCurAnim().name` antes de chamar `play()` — não reinvocar a mesma animação
- Idle quando vetor = (0,0); Walk quando magnitude > 0

**Sistema direcional D/S/U:**
- Detectar direção predominante do vetor para alternar entre sprite Down, Side, Up
- Usar 3 sprites separados ou sprite único com offset de linha

**Câmera:**
- `onUpdate(() => camPos(lerp(camPos(), hero.pos, 0.1)))` — câmera amortecida
- Clamping: fixar `camPos` dentro dos limites da dungeon gerada

**Ataque:**
- Cavaleiro: hitbox temporária `area()` adjacente ao herói → `overlaps("enemy")` → dano
- Arqueiro/Mago: `add([pos(), sprite("arrow"), move(dir, PROJ_SPEED), area(), "projectile"])` + `onCollide("enemy")` → dano + `destroy()`

### Entregável
Herói se move nas 8 direções com velocidade constante, animações corretas, câmera suavizada.

---

## Fase 3 — Geração Procedural de Dungeon (dungeon.js)

**Objetivo:** Gerar uma dungeon nova a cada run via BSP e renderizá-la com `addLevel()`.

### Algoritmo BSP

1. Iniciar com uma área total (ex: 60×40 tiles)
2. Dividir recursivamente em sub-regiões (corte horizontal ou vertical aleatório) até atingir tamanho mínimo de sala (~8×8)
3. Em cada folha da árvore, "esculpir" uma sala com margem interna (paredes nas bordas)
4. Conectar salas irmãs com corredores em L (Bresenham ou L-shape simples)
5. Gerar array de strings (`map[]`) com os símbolos:

| Símbolo | Entidade KAPLAY |
|---|---|
| `#` | `sprite("wall")`, `area()`, `body({ isStatic: true })`, tag `"wall"` |
| `.` | `sprite("floor")`, `z(-1)` — sem colisão |
| `T` | `sprite("spikes")`, `area()`, tag `"danger"` |
| `C` | `sprite("chest")`, `area()`, `body({ isStatic: true })`, tag `"chest"` |
| `D` | `sprite("door")`, `area()`, tag `"door"` |
| `@` | posição de spawn do herói — processado manualmente, não via addLevel |
| `e` | posição de spawn de inimigo — processado manualmente |

6. Chamar `addLevel(map, { tileWidth: 32, tileHeight: 32, tiles: { ... } })`

### Decoração pós-geração
- Após BSP, varredura de vizinhança para torches (`Fire1.png`) em paredes internas
- Injetar `Lever`, baús (`Chest1/2`), `Trapdoor` em posições interiores de salas

### Progressão de andares
- Cada floor = nova chamada a `generateDungeon(floor)` com seed diferente
- `floor` aumenta tamanho mínimo das salas e densidade de inimigos

### Entregável
Dungeon nova a cada run, sem salas isoladas, com tiles visuais corretos e colisões funcionando.

---

## Fase 4 — IA dos Inimigos (enemy.js)

**Objetivo:** 4 inimigos com FSM via componente `state()` — comportamento distinto por tipo.

### FSM base para todos os inimigos

```
patrol → hunt → attack → cooldown → patrol
```

- `state("patrol", ["patrol", "hunt", "attack", "cooldown"])`
- `onStateEnter("patrol")` — iniciar animação walk aleatória
- `onStateUpdate("patrol")` — movimento pseudo-aleatório + checar distância ao herói
- `onStateUpdate("hunt")` — `moveTo(player.pos, SPEED)` — perseguição linear
- `onStateEnter("attack")` — `play("attack", { loop: false })` + aplicar dano → `enterState("cooldown")`
- `onStateUpdate("cooldown")` — timer decrementado por `dt()`, ao zerar volta para `patrol`

### Diferenciação por tipo

| Inimigo | Tipo | Comportamento especial |
|---|---|---|
| Enemy 1 (Rato) | Territorial | Raio de detecção pequeno, não persegue longe |
| Enemy 2 (Goblin Bastão) | Agressivo | Perseguição contínua após detectar, sem cooldown longo |
| Enemy 3 (Goblin Adaga) | Emboscada | Fica imóvel (patrol estático) até herói entrar em raio menor, então ataque rápido |
| Enemy 4 (Líder Goblin) | Tanque/Líder | Mais HP, chama outros goblins ao entrar em hunt |

### Spawn
- Posições `e` no mapa BSP são substituídas por `add(createEnemy(type, pos))`
- Tipo de inimigo sorteado por andar: floors baixos = Ratos; floors altos = Líder Goblin

### Entregável
4 inimigos com comportamentos distintos, sem bugs de estado simultâneo.

---

## Fase 5 — Sistemas de Combate e Progressão

**Objetivo:** Dano bidirecional, morte, loot, transição de andar.

### Componente `healthManager`

Custom component em `components/healthManager.js`:
```js
function healthManager(maxHp) {
  return {
    id: "healthManager",
    maxHp,
    hp: maxHp,
    hurt(dmg) { this.hp -= dmg; if (this.hp <= 0) this.die(); },
    heal(amt)  { this.hp = Math.min(this.hp + amt, this.maxHp); },
    die() { this.play("death", { loop: false }); /* → destroy após animação */ }
  }
}
```

### Dano ao herói
- `onCollide("danger")` → `hero.hurt(TRAP_DMG)` — espinhos
- `onCollide("projectile")` → `hero.hurt(PROJ_DMG)`
- Ataque melee inimigo via `onStateEnter("attack")` → range check + `player.hurt(MELEE_DMG)`

### Morte de inimigo
- Ao `die()`: play animação death → `wait(0.5, () => { spawnLoot(pos); destroy(this) })`
- Loot: chance de spawnar item com tag `"loot"` em `pos()`

### Baús (tag `"chest"`)
- `hero.onCollide("chest", (chest) => { chest.play("open"); openInventory(chest.contents) })`
- Conteúdo: array de itens gerados proceduralmente

### Transição de andar
- Trapdoor com tag `"exit"`: `hero.onCollide("exit", () => goToNextFloor())`
- `goToNextFloor()` → `go("game", { floor: currentFloor + 1, hero: savedStats })`

### Entregável
Loop completo: herói toma dano, morre se HP = 0; inimigos morrem e dropam loot; andar seguinte carrega corretamente.

---

## Fase 6 — HUD e Interface (hud.js)

**Objetivo:** UI visível e imune ao movimento de câmera usando `fixed()`.

### Barra de vida
- Usar `BarTiles` do CraftPix (`4 GUI/4 Bars/BarTile_01..18.png`)
- Renderizar barra dinâmica em `onUpdate()`: calcular proporção `hp/maxHp` → quantos tiles preencher
- Ancorar com `fixed()` no canto superior esquerdo

### Inventário
- Array puro `inventory[]` de objetos `{ name, icon, effect }`
- Renderizar ícones usando `Icons/Icon_XX.png` com `fixed()` na parte inferior
- Interação: `onClick()` em slots → aplicar efeito (curar, bufar ataque)

### Painel de status
- Usar `TileMaps` da GUI para compor janelas/painéis ao redor da barra de vida
- `text()` com a fonte `TinyFontCraftpixPixel` para número de HP, andar atual, personagem

### Tela de seleção de personagem (cena `menu`)
- 3 cards com preview do herói (`1.png`, `2.png`, `3.png`)
- Usar `TileMaps` como fundo de painel, `Icons` para indicar atributos (força, velocidade, magia)
- `onClick()` em cada card → `go("game", { heroType: selected })`

### Fog of war
- `Fog.png` instanciado com `fixed()` sobre a tela
- Recorte circular em volta do herói via `drawCircle` com blend mode, ou camada de tiles escuros revelados progressivamente

### Entregável
HUD visível durante todo o jogo, inventário clicável, menu de seleção funcional.

---

## Fase 7 — Loop Roguelike Completo

**Objetivo:** Conectar todas as fases em um loop jogável com progressão real.

### Cenas

```
menu → game (floor 1) → [morte] → gameover → menu
                     ↓
              game (floor 2..N)
```

- `go("game", { floor, heroType, stats })` — passar stats entre andares
- Ao morrer: `go("gameover", { floor, score })`
- `gameover.js`: mostrar andar atingido, score, botão "tentar novamente" → `go("menu")`

### Escalonamento de dificuldade
- `floor` controla: tamanho da dungeon, HP base dos inimigos, quantidade de inimigos, tipos de inimigo disponíveis
- Floor 1-2: Ratos + Goblin Bastão; Floor 3-4: + Goblin Adaga; Floor 5+: + Líder Goblin

### Salvamento de estado entre andares
- Passar via parâmetro de cena: `{ hp, maxHp, inventory, floor }`
- Não usar localStorage nesta fase — apenas em memória por run

### Entregável
Run completa: seleciona herói → explora andares → morre → tela de game over → recomeça.

---

## Fase 8 — Polish e Feedback Visual

**Objetivo:** Efeitos que tornam o jogo responsivo e imersivo.

### Efeitos visuais
- **Sombra do personagem:** `Shadow.png` abaixo de cada entidade com `z(-0.5)`, `fixed` relativo ao pos do personagem
- **Sangue ao tomar dano:** spawnar `D_Blood.png` / `S_Blood.png` / `U_Blood.png` conforme direção do ataque — destruir após animação
- **Tochas animadas:** `Fire1.png` com loop nas salas — já disponível em `3 Animated objects`
- **Flash de dano:** `tween(color(WHITE), color(RED), 0.1)` no sprite ao receber hit

### Feedback de câmera
- Screen shake ao tomar dano pesado: `camPos(add(camPos(), rand(-5,5), rand(-5,5)))` por 3 frames

### Feedback de áudio (placeholder)
- Reservar slots para sons: ataque, hurt, morte, abrir baú, subir andar
- Usar `loadSound()` quando assets de áudio forem adicionados

### Balanceamento
- Tabela de stats por herói e por inimigo em `src/data/stats.js`
- Manter separado da lógica para iterar rapidamente sem tocar em código de jogo

### Entregável
Jogo com feedback visual em todas as ações principais. Visualmente polido usando os assets CraftPix ao máximo.

---

## Ordem de Implementação Recomendada

```
Fase 0 (setup)
    ↓
Fase 1 (assets) ──── validar todos os sprites no browser
    ↓
Fase 2 (herói) ───── herói controlável com câmera
    ↓
Fase 3 (dungeon) ─── herói se move pela dungeon procedural
    ↓
Fase 4 (IA) ──────── inimigos perseguem e atacam
    ↓
Fase 5 (combate) ─── HP, morte, loot
    ↓
Fase 6 (HUD) ─────── interface visível
    ↓
Fase 7 (loop) ─────── game completo jogável
    ↓
Fase 8 (polish) ──── efeitos finais
```

---

## Módulos e Arquivos por Fase

| Arquivo | Fase principal | Dependências |
|---|---|---|
| `src/main.js` | 0 | — |
| `src/assets.js` | 1 | assets CraftPix |
| `src/entities/hero.js` | 2 | assets.js, healthManager |
| `src/systems/dungeon.js` | 3 | assets.js |
| `src/entities/enemy.js` | 4 | assets.js, healthManager |
| `src/systems/combat.js` | 5 | hero.js, enemy.js |
| `src/components/healthManager.js` | 5 | — |
| `src/components/inventoryManager.js` | 5 | — |
| `src/systems/hud.js` | 6 | assets.js, inventoryManager |
| `src/scenes/menu.js` | 6 | assets.js |
| `src/scenes/game.js` | 7 | todos acima |
| `src/scenes/gameover.js` | 7 | — |
| `src/data/stats.js` | 8 | — |
