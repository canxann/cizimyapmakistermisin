const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tutorialHint = document.getElementById("tutorialHint");
const targetLetter = document.getElementById("targetLetter");
const tutorialProgress = document.getElementById("tutorialProgress");
const message = document.getElementById("message");
const msgTitle = document.getElementById("msgTitle");
const msgSub = document.getElementById("msgSub");
const clearButton = document.getElementById("clearButton");

const FULL_SENTENCE = "VALORANT GIRL PICK ME OLMA";
const CHARS_LIST = FULL_SENTENCE.replace(/\s+/g, "").split("");

let flowers = [];
let tutorialMode = true;
let currentIndex = 0;
let drawing = false;
let activePointer = null;
let lastX = 0;
let lastY = 0;
let hitPoints = 0;
let isTransitioning = false;

const REQUIRED_HITS = 14;      
const FLOWER_SPACING = 18;     

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function triggerVibrate(pattern = 30) {
    try {
        if (navigator.vibrate) navigator.vibrate(pattern);
    } catch(e) {}
}

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
    triggerVibrate([50, 50, 50, 100]);
    for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 10;
        flowers.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 10 + Math.random() * 14,
            maxSize: 12 + Math.random() * 10,
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
            flowers = [];
            clearButton.classList.add("show");
        }, 2000);

        return;
    }

    const char = CHARS_LIST[currentIndex];
    flowers = []; 
    hitPoints = 0;
    isTransitioning = false;

    targetLetter.textContent = char;
    tutorialHint.textContent = `"${char}" harfinin içini çiçeklerle doldur`;
    tutorialProgress.textContent = `${currentIndex + 1} / ${CHARS_LIST.length}`;
    targetLetter.classList.add("visible");
}

function addFlower(x, y) {
    const limit = tutorialMode ? 100 : 250;
    if (flowers.length > limit) {
        flowers.shift();
    }

    const targetSize = 12 + Math.random() * 10;

    flowers.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: 0,
        vy: 0,
        size: targetSize * 0.2, // Doğarken minik başlar (Pop efekti için)
        maxSize: targetSize,
        rotation: Math.random() * Math.PI * 2,
        hue: -15 + Math.random() * 30,
        born: performance.now(),
        life: tutorialMode ? 25000 : 1500,
        isBurst: false
    });
}

function drawFlower(flower, now) {
    const age = now - flower.born;
    if (age >= flower.life) return false;

    // İlk 150 milisaniyede minikten normal boyuta pürüzsüz büyüme (Pop animasyonu)
    if (age < 150) {
        const progress = age / 150;
        flower.size = flower.maxSize * (0.2 + 0.8 * progress);
    } else {
        flower.size = flower.maxSize;
    }

    if (flower.isBurst) {
        flower.x += flower.vx;
        flower.y += flower.vy;
        flower.vx *= 0.95;
        flower.vy *= 0.95;
    }

    let alpha = 0.95;
    const fadeDuration = tutorialMode ? 1500 : 400;
    if (age > flower.life - fadeDuration) {
        alpha *= (flower.life - age) / fadeDuration;
    }

    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.rotate(flower.rotation);
    ctx.globalAlpha = Math.max(0, alpha);

    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
        ctx.rotate((Math.PI * 2) / petalCount);
        // Serbest modda renkler hafifçe lila/pembe/somon tonlarında çeşitlenir
        const hueShift = 325 + flower.hue + (!tutorialMode ? Math.sin(now * 0.003) * 15 : 0);
        ctx.fillStyle = `hsl(${hueShift}, 75%, 75%)`;
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
    lastX = e.clientX;
    lastY = e.clientY;
    
    addFlower(lastX, lastY);

    if (tutorialMode && !isTransitioning) {
        const rect = targetLetter.getBoundingClientRect();
        if (e.clientX >= rect.left - 30 && e.clientX <= rect.right + 30 &&
            e.clientY >= rect.top - 30 && e.clientY <= rect.bottom + 30) {
            hitPoints++;
            triggerVibrate(20);
            if (hitPoints >= REQUIRED_HITS) {
                isTransitioning = true;
                targetLetter.classList.remove("visible");
                currentIndex++;
                setTimeout(showCurrentLetter, 200);
            }
        }
    }
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing || e.pointerId !== activePointer) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.hypot(dx, dy);

    if (dist >= FLOWER_SPACING) {
        lastX = e.clientX;
        lastY = e.clientY;
        addFlower(lastX, lastY);

        if (tutorialMode && !isTransitioning) {
            const rect = targetLetter.getBoundingClientRect();
            if (e.clientX >= rect.left - 30 && e.clientX <= rect.right + 30 &&
                e.clientY >= rect.top - 30 && e.clientY <= rect.bottom + 30) {
                hitPoints++;
                triggerVibrate(15);
                if (hitPoints >= REQUIRED_HITS) {
                    isTransitioning = true;
                    targetLetter.classList.remove("visible");
                    currentIndex++;
                    setTimeout(showCurrentLetter, 200);
                }
            }
        }
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
