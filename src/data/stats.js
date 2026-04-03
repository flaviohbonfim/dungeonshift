// Fase 8 — tabela de stats separada do código de jogo

export const HERO_STATS = {
    1: { name: "Cavaleiro", speed: 180, hp: 100, attackDmg: 25, attackRange: 40 },
    2: { name: "Arqueiro",  speed: 220, hp: 70,  attackDmg: 20, projSpeed: 400 },
    3: { name: "Mago",      speed: 160, hp: 60,  attackDmg: 35, projSpeed: 350 },
};

export const ENEMY_STATS = {
    1: { name: "Rato",         hp: 30,  speed: 100, dmg: 8,  detectionRange: 80,  type: "territorial" },
    2: { name: "Goblin Bastão",hp: 50,  speed: 130, dmg: 12, detectionRange: 140, type: "aggressive"  },
    3: { name: "Goblin Adaga", hp: 40,  speed: 160, dmg: 18, detectionRange: 60,  type: "ambush"      },
    4: { name: "Líder Goblin", hp: 120, speed: 110, dmg: 20, detectionRange: 160, type: "leader"      },
};
