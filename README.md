# DungeonShift

DungeonShift e um roguelike top-down feito com KAPLAY + Vite.

O jogo coloca o jogador em dungeons procedurais com progressao por andares, escolha de heroi, combate em tempo real, loot, HUD, menu de pausa e feedback visual/sonoro placeholder.

## Status atual

- selecao de heroi
- dungeon procedural por floor
- 4 tipos de inimigo com IA distinta
- combate melee e a distancia
- loot, bau e progressao entre andares
- HUD, menu principal, pausa e game over
- sombras, sangue, flash de dano, camera shake e audio placeholder

## Rodando localmente

Requisitos:

- Node.js 18+

Instalacao:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Build de producao:

```bash
npm run build
```

Preview local da build:

```bash
npm run preview
```

## Controles

- `WASD` ou setas: mover
- `Space` ou `Z`: atacar
- `1-6`: usar item do inventario
- `ESC`: abrir/fechar pausa
- menu principal: `Enter` inicia, `P` abre preview de sprites

## Estrutura principal

```txt
src/
  assets.js
  main.js
  scenes/
  entities/
  systems/
  components/
  data/
```

## Tecnologias

- KAPLAY
- Vite
- assets visuais CraftPix

## Observacoes

- o projeto usa efeitos sonoros placeholder gerados via Web Audio, prontos para serem trocados por assets reais depois
- o balanceamento ainda pode ser refinado durante os testes
