const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });

const tutorialHint = document.getElementById("tutorialHint");
const targetLetter = document.getElementById("targetLetter");
const tutorialProgress = document.getElementById("tutorialProgress");
const message = document.getElementById("message");
const msgTitle = document.getElementById("msgTitle");
const msgSub = document.getElementById("msgSub");
const clearButton = document.getElementById("clearButton");

// Cümlenin tamamı harf harf (boşluklar filtrelenip sadece çizilebilir karakterler bırakıldı)
const FULL_SENTENCE = "VALORANT GIRL PICK ME OLMA";
// Sadece harfleri ve sayıları/karakterleri sırayla işleyelim ama boşlukları otomatik geçelim
const CHARS_LIST = FULL_SENTENCE.split("");

let flowers = [];
let tutorialMode = true;
let currentIndex = 0;
let drawing = false;
let activePointer = null;
let distanceSinceFlower = 0;

const FLOWER_DISTANCE = 12;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offCanvas.width = window.innerWidth;
    offCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Tatlı kutlama sesi (Web Audio API ile yumuşak melodi)
function playSweetSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do (Tiz tatlı melodi)
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

// Final Patlama Efekti (Ekranın etrafına çiçekler saçılır)
function triggerFinalBurst() {
    playSweetSound();
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        flowers.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 10 + Math.random() * 14,
            rotation: Math.random() * Math.PI * 2,
            hue: -15 + Math.random() * 30,
            born: performance.now(),
            life: 3000,
            isBurst: true
        });
    }
}

function showCurrentLetter() {
    // Tüm harfler bitti mi kontrolü
    while (currentIndex < CHARS_LIST.length && CHARS_LIST[currentIndex] === " ") {
        currentIndex++; // Boşlukları otomatik atla
    }

    if (currentIndex >= CHARS_LIST.length) {
        // Tutorial bitti! Final patlaması yapıyoruz
        tutorialMode = false;
        targetLetter.classList.remove("visible");
        tutorialHint.textContent = "";
        tutorialProgress.textContent = "";

        triggerFinalBurst();

        // Önce mesajı göster (Valo kız meme'i tam ekran şov)
        msgTitle.textContent = "Tutorial tamamlandı 🌸";
        msgSub.textContent = FULL_SENTENCE;
        message.classList.add("show");

        // 2 saniye sonra mesajı kapat, ekranı pürüzsüzce temizle ve free çizime geç
        setTimeout(() => {
            message.classList.remove("show");
            flowers = []; // Ekranı otomatik pürüzsüzce sıfırla
            clearButton.classList.add("show"); // İsterse sonradan temizlesin diye butonu çıkar
        }, 2000);

        return;
    }

    const char = CHARS_LIST[currentIndex];
    
    // Yeni harfe geçerken ekran tertemiz olur
    flowers = [];

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
}

function drawFlower(flower, now) {
    const age = now - flower.born;
    if (age >= flower.life) return false;

    // Eğer patlama efekti ise hareket ettir
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

// Harf doluluk oranı kontrolü
function checkLetterFilling() {
    if (!tutorialMode) return;

    const char = CHARS_LIST[currentIndex];
    if (!char) return;

    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
    offCtx.font = "900 " + Math.min(window.innerWidth * 0.35, 280) + "px Arial, sans-serif";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "#000000";
    offCtx.fillText(char, offCanvas.width / 2, offCanvas.height / 2);

    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    let totalLetterPixels = 0;
    let coveredPixels = 0;

    for (let y = 0; y < offCanvas.height; y += 5) {
        for (let x = 0; x < offCanvas.width; x += 5) {
            const index = (y * offCanvas.width + x) * 4;
            if (data[index + 3] > 120) {
                totalLetterPixels++;
                let covered = false;
                for (let f = 0; f < flowers.length; f++) {
                    const fl = flowers[f];
                    if (!fl.isBurst) {
                        const dx = fl.x - x;
                        const dy = fl.y - y;
                        if (dx * dx + dy * dy < (fl.size * 1.3) * (fl.size * 1.3)) {
                            covered = true;
                            break;
                        }
                    }
                }
                if (covered) coveredPixels++;
            }
        }
    }

    if (totalLetterPixels > 0) {
        const fillPercentage = coveredPixels / totalLetterPixels;
        if (fillPercentage >= 0.38) {
            targetLetter.classList.remove("visible");
            currentIndex++;
            setTimeout(showCurrentLetter, 250);
        }
    }
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

// Pointer Olayları (Hem Tutorial hem Free Draw için ortak)
canvas.addEventListener("pointerdown", (e) => {
    activePointer = e.pointerId;
    drawing = true;
    distanceSinceFlower = 0;
    addFlower(e.clientX, e.clientY);
    if (tutorialMode) checkLetterFilling();
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

    if (tutorialMode) {
        checkLetterFilling();
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
