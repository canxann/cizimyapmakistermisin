const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tutorialHint = document.getElementById("tutorialHint");
const targetLetter = document.getElementById("targetLetter");
const tutorialProgress = document.getElementById("tutorialProgress");
const message = document.getElementById("message");
const clearButton = document.getElementById("clearButton");

const TEXT = "VALORANT GIRL PICK ME OLMA";

const LETTERS = {
    V: [[[0.08, 0.02], [0.50, 0.98]], [[0.50, 0.98], [0.92, 0.02]]],
    A: [[[0.08, 0.98], [0.50, 0.02]], [[0.50, 0.02], [0.92, 0.98]], [[0.25, 0.60], [0.75, 0.60]]],
    L: [[[0.18, 0.02], [0.18, 0.98]], [[0.18, 0.98], [0.88, 0.98]]],
    O: [[[0.50, 0.02], [0.27, 0.06], [0.10, 0.25], [0.04, 0.50], [0.10, 0.75], [0.27, 0.94], [0.50, 0.98], [0.73, 0.94], [0.90, 0.75], [0.96, 0.50], [0.90, 0.25], [0.73, 0.06], [0.50, 0.02]]],
    R: [[[0.15, 0.98], [0.15, 0.02]], [[0.15, 0.02], [0.60, 0.02]], [[0.60, 0.02], [0.88, 0.20]], [[0.88, 0.20], [0.60, 0.43]], [[0.60, 0.43], [0.15, 0.43]], [[0.56, 0.43], [0.92, 0.98]]],
    N: [[[0.12, 0.98], [0.12, 0.02]], [[0.12, 0.02], [0.88, 0.98]], [[0.88, 0.98], [0.88, 0.02]]],
    T: [[[0.08, 0.03], [0.92, 0.03]], [[0.50, 0.03], [0.50, 0.98]]],
    G: [[[0.90, 0.20], [0.72, 0.06], [0.40, 0.03], [0.15, 0.15], [0.06, 0.40], [0.06, 0.65], [0.18, 0.88], [0.42, 0.97], [0.72, 0.91], [0.90, 0.74], [0.90, 0.53], [0.55, 0.53]]],
    I: [[[0.20, 0.03], [0.80, 0.03]], [[0.50, 0.03], [0.50, 0.97]], [[0.20, 0.97], [0.80, 0.97]]],
    P: [[[0.15, 0.98], [0.15, 0.02]], [[0.15, 0.02], [0.60, 0.02]], [[0.60, 0.02], [0.88, 0.20]], [[0.88, 0.20], [0.60, 0.43]], [[0.60, 0.43], [0.15, 0.43]]],
    C: [[[0.90, 0.18], [0.70, 0.06], [0.38, 0.03], [0.14, 0.17], [0.05, 0.40], [0.05, 0.62], [0.14, 0.84], [0.38, 0.97], [0.70, 0.94], [0.90, 0.80]]],
    K: [[[0.15, 0.02], [0.15, 0.98]], [[0.85, 0.02], [0.15, 0.50]], [[0.15, 0.50], [0.90, 0.98]]],
    E: [[[0.86, 0.03], [0.14, 0.03]], [[0.14, 0.03], [0.14, 0.97]], [[0.14, 0.97], [0.86, 0.97]], [[0.14, 0.50], [0.70, 0.50]]],
    M: [[[0.08, 0.98], [0.08, 0.02]], [[0.08, 0.02], [0.50, 0.55]], [[0.50, 0.55], [0.92, 0.02]], [[0.92, 0.02], [0.92, 0.98]]]
};

let flowers = [];
let tutorialMode = true;
let currentIndex = 0;
let currentLetter = "";
let targetSegments = [];
let targetPoints = [];
let userPoints = [];
let currentStroke = [];
let drawing = false;
let activePointer = null;
let distanceSinceFlower = 0;

const FLOWER_DISTANCE = 15;
const HIT_RADIUS = 50;
const REQUIRED_COVERAGE = 0.50;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function getLetterSize() {
    const isMobile = window.innerWidth <= 600;
    return {
        width: isMobile ? 180 : 220,
        height: isMobile ? 240 : 280
    };
}

function getLetterOrigin() {
    const size = getLetterSize();
    return {
        x: window.innerWidth / 2 - size.width / 2,
        y: window.innerHeight / 2 - size.height / 2
    };
}

function toScreenPoint(point) {
    const size = getLetterSize();
    const origin = getLetterOrigin();
    return {
        x: origin.x + point[0] * size.width,
        y: origin.y + point[1] * size.height
    };
}

function showCurrentLetter() {
    if (currentIndex >= TEXT.length) {
        tutorialMode = false;
        targetLetter.classList.remove("visible");
        tutorialHint.textContent = "";
        tutorialProgress.textContent = "";
        message.classList.add("show");
        clearButton.classList.add("show");
        setTimeout(() => message.classList.remove("show"), 2500);
        return;
    }

    currentLetter = TEXT[currentIndex];
    if (currentLetter === " ") {
        targetLetter.textContent = "";
        currentIndex++;
        setTimeout(showCurrentLetter, 250);
        return;
    }

    const def = LETTERS[currentLetter] || [];
    targetSegments = def.map(seg => seg.map(toScreenPoint));
    
    targetPoints = [];
    targetSegments.forEach(seg => {
        for (let i = 0; i < seg.length - 1; i++) {
            const a = seg[i], b = seg[i+1];
            const steps = 6;
            for(let s=0; s<=steps; s++) {
                targetPoints.push({
                    x: a.x + (b.x - a.x) * (s/steps),
                    y: a.y + (b.y - a.y) * (s/steps)
                });
            }
        }
    });

    userPoints = [];
    currentStroke = [];

    targetLetter.textContent = currentLetter;
    tutorialHint.textContent = `"${currentLetter}" harfini çiz`;
    tutorialProgress.textContent = `${currentIndex + 1} / ${TEXT.length}`;
    targetLetter.classList.add("visible");
}

function addFlower(x, y, customSize = null) {
    if (flowers.length > 900) flowers.shift();
    flowers.push({
        x, y,
        size: customSize ?? (10 + Math.random() * 10),
        rotation: Math.random() * Math.PI * 2,
        hue: -10 + Math.random() * 20,
        born: performance.now(),
        life: 7000
    });
}

function drawFlower(flower, now) {
    const age = now - flower.born;
    if (age >= flower.life) return false;

    let alpha = 0.9;
    if (age > flower.life - 1000) {
        alpha *= (flower.life - age) / 1000;
    }

    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.rotate(flower.rotation);
    ctx.globalAlpha = alpha;

    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
        ctx.rotate((Math.PI * 2) / petalCount);
        ctx.fillStyle = `hsl(${330 + flower.hue}, 70%, 76%)`;
        ctx.beginPath();
        ctx.ellipse(0, -flower.size * 0.45, flower.size * 0.28, flower.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = "#ffdd80";
    ctx.beginPath();
    ctx.arc(0, 0, flower.size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
}

function checkLetterCompletion() {
    if (!tutorialMode || targetPoints.length === 0 || userPoints.length < 10) return;

    let covered = 0;
    for (const target of targetPoints) {
        let found = false;
        for (const user of userPoints) {
            if (Math.hypot(target.x - user.x, target.y - user.y) <= HIT_RADIUS) {
                found = true;
                break;
            }
        }
        if (found) covered++;
    }

    if (covered / targetPoints.length >= REQUIRED_COVERAGE) {
        targetLetter.classList.remove("visible");
        currentIndex++;
        setTimeout(showCurrentLetter, 400);
    }
}

function render(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rehber Çizgi
    if (tutorialMode && targetSegments.length > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(217, 95, 131, 0.22)";
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 6]);
        targetSegments.forEach(seg => {
            ctx.beginPath();
            ctx.moveTo(seg[0].x, seg[0].y);
            for (let i = 1; i < seg.length; i++) ctx.lineTo(seg[i].x, seg[i].y);
            ctx.stroke();
        });
        ctx.restore();
    }

    // Kullanıcı Çizgisi
    if (currentStroke.length > 1) {
        ctx.save();
        ctx.strokeStyle = "rgba(215,76,120,0.6)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        ctx.stroke();
        ctx.restore();
    }

    // Çiçekler
    for (let i = flowers.length - 1; i >= 0; i--) {
        const alive = drawFlower(flowers[i], time);
        if (!alive) flowers.splice(i, 1);
    }

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Pointer Olayları
canvas.addEventListener("pointerdown", (e) => {
    activePointer = e.pointerId;
    drawing = true;
    currentStroke = [{ x: e.clientX, y: e.clientY }];
    userPoints.push({ x: e.clientX, y: e.clientY });
    distanceSinceFlower = 0;
    addFlower(e.clientX, e.clientY, 8);
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing || e.pointerId !== activePointer) return;
    const last = currentStroke[currentStroke.length - 1];
    const pt = { x: e.clientX, y: e.clientY };
    
    currentStroke.push(pt);
    userPoints.push(pt);

    distanceSinceFlower += Math.hypot(pt.x - last.x, pt.y - last.y);
    if (distanceSinceFlower >= FLOWER_DISTANCE) {
        addFlower(pt.x, pt.y);
        distanceSinceFlower = 0;
        if (tutorialMode) checkLetterCompletion();
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (e.pointerId === activePointer) {
        drawing = false;
        activePointer = null;
        currentStroke = [];
        if (tutorialMode) checkLetterCompletion();
    }
});

clearButton.addEventListener("click", () => {
    flowers = [];
    userPoints = [];
    currentStroke = [];
});

showCurrentLetter();
