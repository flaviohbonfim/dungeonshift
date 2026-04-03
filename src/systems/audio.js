let audioInitialized = false;

export function initAudio(k) {
    if (audioInitialized) return;
    audioInitialized = true;

    const unlock = () => {
        if (k.audioCtx.state !== "running") {
            k.audioCtx.resume().catch(() => {});
        }
    };

    if (typeof window !== "undefined") {
        window.addEventListener("pointerdown", unlock, { once: true, passive: true });
        window.addEventListener("keydown", unlock, { once: true });
        window.addEventListener("touchstart", unlock, { once: true, passive: true });
    }
}

export function playSfx(k, name, options = {}) {
    if (!k?.audioCtx) return;

    if (k.audioCtx.state !== "running") {
        k.audioCtx.resume().catch(() => {});
    }

    switch (name) {
        case "meleeSwing":
            tone(k, { type: "triangle", from: 280, to: 170, duration: 0.08, volume: 0.05, pan: options.pan });
            tone(k, { type: "square", from: 150, to: 120, duration: 0.04, volume: 0.018, pan: options.pan });
            break;
        case "arrowShot":
            tone(k, { type: "triangle", from: 760, to: 480, duration: 0.08, volume: 0.04, pan: options.pan });
            break;
        case "fireballShot":
            tone(k, { type: "sawtooth", from: 210, to: 420, duration: 0.14, volume: 0.038, pan: options.pan });
            tone(k, { type: "triangle", from: 320, to: 540, duration: 0.12, volume: 0.02, pan: options.pan });
            break;
        case "heroHurt":
            tone(k, { type: "square", from: 240, to: 150, duration: 0.12, volume: 0.05 });
            break;
        case "heroDeath":
            tone(k, { type: "sawtooth", from: 220, to: 70, duration: 0.45, volume: 0.055 });
            tone(k, { type: "triangle", from: 140, to: 55, duration: 0.5, volume: 0.03 });
            break;
        case "enemyHurt":
            tone(k, { type: "square", from: 300, to: 220, duration: 0.06, volume: 0.03, pan: options.pan });
            break;
        case "enemyDeath":
            tone(k, { type: "triangle", from: 180, to: 90, duration: 0.18, volume: 0.032, pan: options.pan });
            break;
        case "pickup":
            tone(k, { type: "sine", from: 680, to: 980, duration: 0.08, volume: 0.03, pan: options.pan });
            break;
        case "chestOpen":
            tone(k, { type: "triangle", from: 240, to: 420, duration: 0.16, volume: 0.04 });
            tone(k, { type: "square", from: 120, to: 200, duration: 0.09, volume: 0.02 });
            break;
        case "floorUp":
            tone(k, { type: "triangle", from: 330, to: 620, duration: 0.22, volume: 0.042 });
            tone(k, { type: "sine", from: 500, to: 760, duration: 0.18, volume: 0.018 });
            break;
        case "menuSelect":
            tone(k, { type: "triangle", from: 420, to: 600, duration: 0.1, volume: 0.028 });
            break;
        case "pauseOpen":
            tone(k, { type: "triangle", from: 300, to: 210, duration: 0.08, volume: 0.024 });
            break;
        case "pauseClose":
            tone(k, { type: "triangle", from: 210, to: 300, duration: 0.08, volume: 0.024 });
            break;
        default:
            break;
    }
}

function tone(k, {
    type = "triangle",
    from = 440,
    to = from,
    duration = 0.1,
    volume = 0.03,
    pan = 0,
}) {
    const ctx = k.audioCtx;
    const start = ctx.currentTime;
    const end = start + duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, from), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), end);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.01, duration * 0.35));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    if (typeof ctx.createStereoPanner === "function") {
        const panner = ctx.createStereoPanner();
        panner.pan.value = clamp(pan ?? 0, -0.8, 0.8);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
    } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
    }

    osc.start(start);
    osc.stop(end + 0.02);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
