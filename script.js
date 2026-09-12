const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tutorialHint = document.getElementById("tutorialHint");
const targetLetter = document.getElementById("targetLetter");
const tutorialProgress = document.getElementById("tutorialProgress");
const message = document.getElementById("message");
const msgTitle = document.getElementById("msgTitle");
const msgSub = document.getElementById("msgSub");
const clearButton = document.getElementById("clearButton");

// Boşluklar dahil eksiksiz tam cümle
const FULL_SENTENCE = "VALORANT GIRL PICK ME OLMA";
const CHARS_LIST = FULL_SENTENCE.replace(/\s+/g, "").split(""); // 21 harf

let flowers = [];
let tutorialMode = true;
let currentIndex = 0;
let drawing = false;
let activePointer = null;
let distanceSinceFlower = 0;
let currentLetterFlowerCount = 0;

const FLOWER_DISTANCE = 10;
const REQUIRED_FLOWERS = 18; // Her harf için gereken çiçek sayısı (kolayca doldurulur ama atlanmaz)

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function playSweetSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + index * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + index * 0.1);
            osc.stop(audioCtx.currentTime + index * 0.1 + 0.4);
        });
    } catch(e) {}
}

function triggerFinalBurst() {
    playSweetSound();
    for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 10;
        flowers.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 10 + Math.random() * 14,
            rotation: Math.random() * Math.PI * 2,
            hue: -15 + Math.random() * 30,
            born: performance.now(),
            life: 3500,
            isBurst: true
        });
    }
}

function showCurrentLetter() {
    if (currentIndex >= CHARS_LIST.length) {
        tutorialMode = false;
        targetLetter.classList.remove("visible");
        tutorialHint.textContent = "";
        tutorialProgress.textContent = "";

        triggerFinalBurst();

        msgTitle.textContent = "Tutorial tamamlandı 🌸";
        msgSub.textContent = FULL_SENTENCE;
        message.classList.add("show");

        setTimeout(() => {
            message.classList.remove("show");
            flowers = []; // Otomatik pürüzsüz temizlik
            clearButton.classList.add("show");
        }, 2000);

        return;
    }

    const char = CHARS_LIST[currentIndex];
    flowers = []; // Her yeni harfte eski çiçekler tamamen silinir
    currentLetterFlowerCount = 0;

    targetLetter.textContent = char;
    tutorialHint.textContent = `"${char}" harfinin içini çiçeklerle doldur`;
    tutorialProgress.textContent = `${currentIndex + 1} / ${CHARS_LIST.length}`;
    targetLetter.classList.add("visible");
}

function addFlower(x, y) {
    if (flowers.length > 3000) flowers.shift();
    flowers.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: 0,
        vy: 0,
        size: 12 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        hue: -12 + Math.random() * 24,
        born: performance.now(),
        life: tutorialMode ? 15000 : 25000,
        isBurst: false
    });

    if (tutorialMode) {
        currentLetterFlowerCount++;
        // Yeterli çiçek çizildiğinde sonraki harfe geç
        if (currentLetterFlowerCount >= REQUIRED_FLOWERS) {
            targetLetter.classList.remove("visible");
            currentIndex++;
            setTimeout(showCurrentLetter, 250);
        }
    }
}

function drawFlower(flower, now) {
    const age = now - flower.born;
    if (age >= flower.life) return false;

    if (flower.isBurst) {
        flower.x += flower.vx;
        flower.y += flower.vy;
        flower.vx *= 0.95;
        flower.vy *= 0.95;
    }

    let alpha = 0.95;
    if (age > flower.life - 1500) {
        alpha *= (flower.life - age) / 1500;
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

function render(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = flowers.length - 1; i >= 0; i--) {
        const alive = drawFlower(flowers[i], time);
        if (!alive) flowers.splice(i, 1);
    }

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

canvas.addEventListener("pointerdown", (e) => {
    activePointer = e.pointerId;
    drawing = true;
    distanceSinceFlower = 0;
    addFlower(e.clientX, e.clientY);
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing || e.pointerId !== activePointer) return;
    
    const lastFlower = flowers[flowers.length - 1];
    if (lastFlower && !lastFlower.isBurst) {
        distanceSinceFlower += Math.hypot(e.clientX - lastFlower.x, e.clientY - lastFlower.y);
        if (distanceSinceFlower >= FLOWER_DISTANCE) {
            addFlower(e.clientX, e.clientY);
            distanceSinceFlower = 0;
        }
    } else {
        addFlower(e.clientX, e.clientY);
    }
});

canvas.addEventListener("pointerup", (e) => {
    if (e.pointerId === activePointer) {
        drawing = false;
        activePointer = null;
    }
});

clearButton.addEventListener("click", () => {
    flowers = [];
});

showCurrentLetter();
