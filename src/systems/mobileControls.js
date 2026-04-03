const state = {
    visible: false,
    paused: false,
    moveX: 0,
    moveY: 0,
    attackQueued: false,
};

const mobileInput = {
    getMoveVector() {
        if (!state.visible || state.paused) {
            return { x: 0, y: 0 };
        }

        return { x: state.moveX, y: state.moveY };
    },

    consumeAttackPress() {
        if (!state.visible || state.paused) {
            state.attackQueued = false;
            return false;
        }

        const queued = state.attackQueued;
        state.attackQueued = false;
        return queued;
    },

    isVisible() {
        return state.visible;
    },
};

let root = null;
let movePad = null;
let moveThumb = null;
let attackButton = null;
let styleTag = null;
let movePointerId = null;
let attackPointerId = null;

export function showMobileControls() {
    if (!shouldUseMobileControls()) {
        hideMobileControls();
        return mobileInput;
    }

    ensureMobileControlsDom();
    resetMove();
    state.attackQueued = false;
    state.paused = false;
    state.visible = true;
    root.style.display = "block";
    root.style.opacity = "1";

    return mobileInput;
}

export function hideMobileControls() {
    resetMove();
    state.attackQueued = false;
    state.paused = false;
    state.visible = false;
    attackPointerId = null;
    movePointerId = null;
    attackButton?.classList.remove("is-pressed");
    if (root) {
        root.style.display = "none";
    }
}

export function setMobileControlsPaused(paused) {
    state.paused = paused;
    state.attackQueued = false;
    resetMove();

    if (root && state.visible) {
        root.style.opacity = paused ? "0.55" : "1";
    }
}

export { mobileInput };

function shouldUseMobileControls() {
    if (typeof window === "undefined") {
        return false;
    }

    return Boolean(
        window.matchMedia?.("(pointer: coarse)")?.matches
        || navigator.maxTouchPoints > 0
        || "ontouchstart" in window,
    );
}

function ensureMobileControlsDom() {
    if (root) return;

    injectStyles();

    root = document.createElement("div");
    root.className = "mobile-controls";

    const leftCluster = document.createElement("div");
    leftCluster.className = "mobile-controls__left";

    movePad = document.createElement("div");
    movePad.className = "mobile-controls__pad";
    movePad.innerHTML = "<span>MOVE</span>";

    moveThumb = document.createElement("div");
    moveThumb.className = "mobile-controls__thumb";
    movePad.appendChild(moveThumb);
    leftCluster.appendChild(movePad);

    const rightCluster = document.createElement("div");
    rightCluster.className = "mobile-controls__right";

    attackButton = document.createElement("button");
    attackButton.className = "mobile-controls__attack";
    attackButton.type = "button";
    attackButton.textContent = "ATK";
    rightCluster.appendChild(attackButton);

    root.appendChild(leftCluster);
    root.appendChild(rightCluster);
    document.body.appendChild(root);

    movePad.addEventListener("pointerdown", onMovePointerDown);
    attackButton.addEventListener("pointerdown", onAttackPointerDown);

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: false });
    window.addEventListener("pointercancel", onPointerUp, { passive: false });
}

function injectStyles() {
    if (styleTag) return;

    styleTag = document.createElement("style");
    styleTag.textContent = `
        .mobile-controls {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 60;
        }

        .mobile-controls__left,
        .mobile-controls__right {
            position: absolute;
            bottom: calc(18px + env(safe-area-inset-bottom, 0px));
            pointer-events: none;
        }

        .mobile-controls__left {
            left: calc(18px + env(safe-area-inset-left, 0px));
        }

        .mobile-controls__right {
            right: calc(18px + env(safe-area-inset-right, 0px));
        }

        .mobile-controls__pad,
        .mobile-controls__attack {
            pointer-events: auto;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            border: 2px solid rgba(202, 220, 255, 0.34);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
        }

        .mobile-controls__pad {
            position: relative;
            width: 134px;
            height: 134px;
            border-radius: 999px;
            background: radial-gradient(circle at 35% 35%, rgba(108, 136, 196, 0.24), rgba(16, 23, 38, 0.54));
        }

        .mobile-controls__pad > span {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font: 700 11px/1 sans-serif;
            letter-spacing: 0.18em;
            color: rgba(230, 238, 255, 0.5);
        }

        .mobile-controls__thumb {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 54px;
            height: 54px;
            border-radius: 999px;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle at 35% 35%, rgba(244, 247, 255, 0.95), rgba(140, 164, 216, 0.78));
            box-shadow: inset 0 1px 4px rgba(255, 255, 255, 0.45), 0 8px 20px rgba(0, 0, 0, 0.24);
        }

        .mobile-controls__attack {
            width: 96px;
            height: 96px;
            border-radius: 999px;
            background: radial-gradient(circle at 35% 35%, rgba(208, 96, 96, 0.95), rgba(108, 26, 42, 0.72));
            color: rgba(250, 242, 244, 0.95);
            font: 800 20px/1 sans-serif;
            letter-spacing: 0.12em;
        }

        .mobile-controls__attack.is-pressed {
            transform: scale(0.96);
            filter: brightness(1.12);
        }
    `;

    document.head.appendChild(styleTag);
}

function onMovePointerDown(event) {
    if (!state.visible || state.paused || movePointerId !== null) return;

    movePointerId = event.pointerId;
    movePad.setPointerCapture?.(event.pointerId);
    updateMoveFromClient(event.clientX, event.clientY);
    event.preventDefault();
}

function onAttackPointerDown(event) {
    if (!state.visible || state.paused) return;

    attackPointerId = event.pointerId;
    state.attackQueued = true;
    attackButton.classList.add("is-pressed");
    attackButton.setPointerCapture?.(event.pointerId);
    event.preventDefault();
}

function onPointerMove(event) {
    if (event.pointerId === movePointerId) {
        updateMoveFromClient(event.clientX, event.clientY);
        event.preventDefault();
    }
}

function onPointerUp(event) {
    if (event.pointerId === movePointerId) {
        movePointerId = null;
        resetMove();
        event.preventDefault();
    }

    if (event.pointerId === attackPointerId) {
        attackPointerId = null;
        attackButton.classList.remove("is-pressed");
        event.preventDefault();
    }
}

function updateMoveFromClient(clientX, clientY) {
    const rect = movePad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width * 0.32;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > radius) {
        const scale = radius / distance;
        dx *= scale;
        dy *= scale;
    }

    const normalizedX = dx / radius;
    const normalizedY = dy / radius;
    const magnitude = Math.hypot(normalizedX, normalizedY);

    if (magnitude < 0.18) {
        state.moveX = 0;
        state.moveY = 0;
        moveThumb.style.transform = "translate(-50%, -50%)";
        return;
    }

    state.moveX = clamp(normalizedX, -1, 1);
    state.moveY = clamp(normalizedY, -1, 1);
    moveThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function resetMove() {
    state.moveX = 0;
    state.moveY = 0;

    if (moveThumb) {
        moveThumb.style.transform = "translate(-50%, -50%)";
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
