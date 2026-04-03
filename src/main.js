import kaplay from "kaplay";
import { loadAssets } from "./assets.js";
import { menuScene } from "./scenes/menu.js";
import { gameScene } from "./scenes/game.js";
import { gameoverScene } from "./scenes/gameover.js";
import { spritePreviewScene } from "./scenes/spritePreview.js";
import { initAudio } from "./systems/audio.js";

export const k = kaplay({
    width: 1280,
    height: 720,
    background: [26, 26, 46],
    crisp: true,
    debug: true,
    debugKey: "f1",
    font: "pixel",
    global: false,
});

loadAssets(k);
initAudio(k);

// Closure passando k explicitamente — scenes recebem args do go(), não o contexto k
k.scene("menu",     (params) => menuScene(k, params));
k.scene("game",     (params) => gameScene(k, params));
k.scene("gameover", (params) => gameoverScene(k, params));
k.scene("preview",  ()       => spritePreviewScene(k));

k.go("menu", { screen: "main" });
