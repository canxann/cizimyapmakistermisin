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
let targetCheckpoints = [];
let currentStroke = [];
let drawing = false;
let activePointer = null;
let distanceSinceFlower = 0;

const FLOWER_DISTANCE = 8;
const HIT_RADIUS = 28; // Hassas hitbox

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function getLetterSize() {
    const isMobile = window.innerWidth <= 600;
    return {
        width: isMobile ? 190 : 230,
        height: isMobile ? 250 : 300
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
        setTimeout(() => message.classList.remove("show"), 3000);
        return;
    }

    currentLetter = TEXT[currentIndex];
    if (currentLetter === " ") {
        targetLetter.textContent = "";
        currentIndex++;
        setTimeout(showCurrentLetter, 200);
        return;
    }

    const def = LETTERS[currentLetter] || [];
    targetSegments = def.map(seg => seg.map(toScreenPoint));
    
    // Harfi oluşturan her bir çizginin (segmentin) üzerini detaylı kontrol noktalarıyla dolduruyoruz
    targetCheckpoints = [];
    targetSegments.forEach(seg => {
        for (let i = 0; i < seg.length - 1; i++) {
            const a = seg[i], b = seg[i+1];
            const dist = Math.hypot(b.x - a.x, b.y - a.y);
            const steps = Math.max(6, Math.floor(dist / 8));
            for(let s = 0; s <= steps; s++) {
                targetCheckpoints.push({
                    x: a.x + (b.x - a.x) * (s/steps),
                    y: a.y + (b.y - a.y) * (s/steps),
                    hit: false
                });
            }
        }
    });

    currentStroke = [];

    targetLetter.textContent = currentLetter;
    tutorialHint.textContent = `"${currentLetter}" harfini çiz`;
    tutorialProgress.textContent = `${currentIndex + 1} / ${TEXT.length}`;
    targetLetter.classList.add("visible");
}

function addFlower(x, y) {
    if (flowers.length > 2500) flowers.shift();
    flowers.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        size: 11 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        hue: -12 + Math.random() * 24,
        born: performance.now(),
        life: 12000
    });
}

function drawFlower(flower, now) {
    const age = now - flower.born;
    if (age >= flower.life) return false;

    let alpha = 0.95;
    if (age > flower.life - 1200) {
        alpha *= (flower.life - age) / 1200;
    }

    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.rotate(flower.rotation);
    ctx.globalAlpha = alpha;

    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
        ctx.rotate((Math.PI * 2) / petalCount);
        ctx.fillStyle = `hsl(${325 + flower.hue}, 75%, 75%)`;
        ctx.beginPath();
        ctx.ellipse(0, -flower.size * 0.45, flower.size * 0.3, flower.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = "#ffe394";
    ctx.beginPath();
    ctx.arc(0, 0, flower.size * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
}

function checkLetterCompletion(x, y) {
    if (!tutorialMode || targetCheckpoints.length === 0) return;

    let hitCount = 0;
    targetCheckpoints.forEach(cp => {
        if (!cp.hit && Math.hypot(cp.x - x, cp.y - y) <= HIT_RADIUS) {
            cp.hit = true;
        }
        if (cp.hit) hitCount++;
    });

    // Harfin en az %90'ı eksiksiz çizilmeden geçilmeyecek
    if (hitCount / targetCheckpoints.length >= 0.90) {
        targetLetter.classList.remove("visible");
        currentIndex++;
        currentStroke = [];
        setTimeout(showCurrentLetter, 350);
    }
}

function render(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Çiçekler arkada kalıcı olarak durur
    for (let i = flowers.length - 1; i >= 0; i--) {
        const alive = drawFlower(flowers[i], time);
        if (!alive) flowers.splice(i, 1);
    }

    // Rehber Çizgi
    if (tutorialMode && targetSegments.length > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(217, 95, 131, 0.25)";
        ctx.lineWidth = 5;
        ctx.setLineDash([8, 8]);
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
        ctx.strokeStyle = "rgba(215,76,120,0.65)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        ctx.stroke();
        ctx.restore();
    }

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Pointer Olayları
canvas.addEventListener("pointerdown", (e) => {
    activePointer = e.pointerId;
    drawing = true;
    currentStroke = [{ x: e.clientX, y: e.clientY }];
    distanceSinceFlower = 0;
    addFlower(e.clientX, e.clientY);
    if (tutorialMode) checkLetterCompletion(e.clientX, e.clientY);
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing || e.pointerId !== activePointer) return;
    const last = currentStroke[currentStroke.length - 1];
    const pt = { x: e.clientX, y: e.clientY };
    
    currentStroke.push(pt);

    distanceSinceFlower += Math.hypot(pt.x - last.x, pt.y - last.y);
    if (distanceSinceFlower >= FLOWER_DISTANCE) {
        addFlower(pt.x, pt.y);
        distanceSinceFlower = 0;
    }

    if (tutorialMode) {
        checkLetterCompletion(pt.x, pt.y);
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (e.pointerId === activePointer) {
        drawing = false;
        activePointer = null;
        currentStroke = [];
    }
});

clearButton.addEventListener("click", () => {
    flowers = [];
    currentStroke = [];
});

showCurrentLetter();
