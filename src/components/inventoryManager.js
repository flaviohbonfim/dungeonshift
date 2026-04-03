let nextItemInstanceId = 1;

const ITEM_LIBRARY = {
    minor_potion: {
        id: "minor_potion",
        name: "Pocao Menor",
        icon: "icon_09",
        effect: { type: "heal", amount: 20 },
    },
    major_potion: {
        id: "major_potion",
        name: "Pocao Maior",
        icon: "icon_10",
        effect: { type: "heal", amount: 40 },
    },
    fury_tonic: {
        id: "fury_tonic",
        name: "Tonico de Furia",
        icon: "icon_24",
        effect: { type: "buff", stat: "attack", amount: 6, duration: 10 },
    },
    ward_charm: {
        id: "ward_charm",
        name: "Amuleto de Guarda",
        icon: "icon_31",
        effect: { type: "buff", stat: "defense", amount: 4, duration: 10 },
    },
};

function cloneItem(item) {
    return {
        ...item,
        effect: item.effect ? { ...item.effect } : null,
    };
}

export function createItem(itemId, overrides = {}) {
    const template = ITEM_LIBRARY[itemId] ?? ITEM_LIBRARY.minor_potion;

    return {
        ...cloneItem(template),
        ...overrides,
        effect: {
            ...template.effect,
            ...(overrides.effect ?? {}),
        },
        instanceId: overrides.instanceId ?? `item-${nextItemInstanceId++}`,
    };
}

export function rollEnemyLoot(floor = 1, rng = Math.random) {
    const dropChance = Math.min(0.25 + floor * 0.05, 0.55);
    if (rng() > dropChance) {
        return null;
    }

    const pool = floor >= 4
        ? ["minor_potion", "minor_potion", "major_potion", "fury_tonic"]
        : ["minor_potion", "minor_potion", "ward_charm"];

    return createItem(pool[Math.floor(rng() * pool.length)]);
}

export function rollChestContents(floor = 1, rng = Math.random) {
    const count = floor >= 3 && rng() < 0.5 ? 2 : 1;
    const pool = floor >= 5
        ? ["major_potion", "major_potion", "fury_tonic", "ward_charm"]
        : floor >= 3
            ? ["minor_potion", "major_potion", "fury_tonic"]
            : ["minor_potion", "minor_potion", "ward_charm"];

    return Array.from({ length: count }, () => {
        const itemId = pool[Math.floor(rng() * pool.length)];
        return createItem(itemId);
    });
}

export function inventoryManager(initialItems = []) {
    return {
        id: "inventoryManager",
        inventory: initialItems.map(cloneItem),

        addItem(item) {
            const nextItem = item.instanceId ? cloneItem(item) : createItem(item.id ?? "minor_potion", item);
            this.inventory = [...this.inventory, nextItem];
            this.trigger("inventory:add", nextItem);
            return nextItem;
        },

        addItems(items = []) {
            return items.map((item) => this.addItem(item));
        },

        removeItem(target) {
            const index = typeof target === "number"
                ? target
                : this.inventory.findIndex((item) => item.instanceId === target || item.id === target);

            if (index < 0 || index >= this.inventory.length) {
                return null;
            }

            const [removed] = this.inventory.splice(index, 1);
            this.inventory = [...this.inventory];
            this.trigger("inventory:remove", removed);
            return removed;
        },

        serializeInventory() {
            return this.inventory.map(cloneItem);
        },
    };
}
