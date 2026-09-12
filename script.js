"use strict";

/* =========================================================
   ELEMENTLER
========================================================= */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {
    alpha: true
});

const tutorial = document.getElementById("tutorial");
const tutorialHint = document.getElementById("tutorialHint");
const targetLetter = document.getElementById("targetLetter");
const tutorialProgress = document.getElementById("tutorialProgress");

const message = document.getElementById("message");
const clearButton = document.getElementById("clearButton");


/* =========================================================
   AYARLAR
========================================================= */

const TEXT = "VALORANT GIRL PICK ME OLMA";

const MAX_FLOWERS = 1100;
const FLOWER_DISTANCE = 13;
const FLOWER_MIN_SIZE = 9;
const FLOWER_MAX_SIZE = 19;
const FLOWER_LIFE = 6500;
const FLOWER_FADE = 1000;

const LETTER_WIDTH = 210;
const LETTER_HEIGHT = 270;
const MOBILE_LETTER_WIDTH = 170;
const MOBILE_LETTER_HEIGHT = 225;

const HIT_RADIUS = 46;
const REQUIRED_COVERAGE = 0.54;


/* =========================================================
   HARF ÇİZGİLERİ
========================================================= */

const LETTERS = {
    V: [
        [[0.08, 0.02], [0.50, 0.98]],
        [[0.50, 0.98], [0.92, 0.02]]
    ],
    A: [
        [[0.08, 0.98], [0.50, 0.02]],
        [[0.50, 0.02], [0.92, 0.98]],
        [[0.25, 0.60], [0.75, 0.60]]
    ],
    L: [
        [[0.18, 0.02], [0.18, 0.98]],
        [[0.18, 0.98], [0.88, 0.98]]
    ],
    O: [
        [
            [0.50, 0.02], [0.27, 0.06], [0.10, 0.25],
            [0.04, 0.50], [0.10, 0.75], [0.27, 0.94],
            [0.50, 0.98], [0.73, 0.94], [0.90, 0.75],
            [0.96, 0.50], [0.90, 0.25], [0.73, 0.06],
            [0.50, 0.02]
        ]
    ],
    R: [
        [[0.15, 0.98], [0.15, 0.02]],
        [[0.15, 0.02], [0.60, 0.02]],
        [[0.60, 0.02], [0.88, 0.20]],
        [[0.88, 0.20], [0.60, 0.43]],
        [[0.60, 0.43], [0.15, 0.43]],
        [[0.56, 0.43], [0.92, 0.98]]
    ],
    N: [
        [[0.12, 0.98], [0.12, 0.02]],
        [[0.12, 0.02], [0.88, 0.98]],
        [[0.88, 0.98], [0.88, 0.02]]
    ],
    T: [
        [[0.08, 0.03], [0.92, 0.03]],
        [[0.50, 0.03], [0.50, 0.98]]
    ],
    G: [
        [
            [0.90, 0.20], [0.72, 0.06], [0.40, 0.03],
            [0.15, 0.15], [0.06, 0.40], [0.06, 0.65],
            [0.18, 0.88], [0.42, 0.97], [0.72, 0.91],
            [0.90, 0.74], [0.90, 0.53], [0.55, 0.53]
        ]
    ],
    I: [
        [[0.20, 0.03], [0.80, 0.03]],
        [[0.50, 0.03], [0.50, 0.97]],
        [[0.20, 0.97], [0.80, 0.97]]
    ],
    P: [
        [[0.15, 0.98], [0.15, 0.02]],
        [[0.15, 0.02], [0.60, 0.02]],
        [[0.60, 0.02], [0.88, 0.20]],
        [[0.88, 0.20], [0.60, 0.43]],
        [[0.60, 0.43], [0.15, 0.43]]
    ],
    C: [
        [
            [0.90, 0.18], [0.70, 0.06], [0.38, 0.03],
            [0.14, 0.17], [0.05, 0.40], [0.05, 0.62],
            [0.14, 0.84], [0.38, 0.97], [0.70, 0.94],
            [0.90, 0.80]
        ]
    ],
    K: [
        [[0.15, 0.02], [0.15, 0.98]],
        [[0.85, 0.02], [0.15, 0.50]],
        [[0.15, 0.50], [0.90, 0.98]]
    ],
    E: [
        [[0.86, 0.03], [0.14, 0.03]],
        [[0.14, 0.03], [0.14, 0.97]],
        [[0.14, 0.97], [0.86, 0.97]],
        [[0.14, 0.50], [0.70, 0.50]]
    ],
    M: [
        [[0.08, 0.98], [0.08, 0.02]],
        [[0.08, 0.02], [0.50, 0.55]],
        [[0.50, 0.55], [0.92, 0.02]],
        [[0.92, 0.02], [0.92, 0.98]]
    ]
};


/* =========================================================
   DURUM
========================================================= */

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
let completing = false;
let tutorialFinished = false;


/* =========================================================
   YARDIMCI
========================================================= */

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getLetterSize() {
    if (window.innerWidth <= 600) {
        return {
            width: MOBILE_LETTER_WIDTH,
            height: MOBILE_LETTER_HEIGHT
        };
    }
    return {
        width: LETTER_WIDTH,
        height: LETTER_HEIGHT
    };
}

function getLetterOrigin() {
    const size = getLetterSize();
    return {
        x: window.innerWidth / 2 - size.width / 2,
        y: window.innerHeight / 2 - size.height / 2
    };
}


/* =========================================================
   NORMALIZE EDİLMİŞ NOKTAYI EKRANA ÇEVİR
========================================================= */

function toScreenPoint(point) {
    const size = getLetterSize();
    const origin = getLetterOrigin();
    return {
        x: origin.x + point[0] * size.width,
        y: origin.y + point[1] * size.height
    };
}


/* =========================================================
   HEDEFİ OLUŞTUR
========================================================= */

function createTarget(letter) {
    const definition = LETTERS[letter];
    if (!definition) {
        return [];
    }
    return definition.map(segment => {
        return segment.map(toScreenPoint);
    });
}


/* =========================================================
   HEDEF NOKTALARI YOĞUNLAŞTIR
========================================================= */

function createTargetPoints(segments) {
    const points = [];
    for (const segment of segments) {
        if (segment.length < 2) {
            continue;
        }
        for (let i = 0; i < segment.length - 1; i++) {
            const a = segment[i];
            const b = segment[i + 1];
            const length = distance(a.x, a.y, b.x, b.y);
            const steps = Math.max(3, Math.ceil(length / 9));

            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                points.push({
                    x: a.x + (b.x - a.x) * t,
                    y: a.y + (b.y - a.y) * t
                });
            }
        }
    }
    return points;
}


/* =========================================================
   TUTORIAL HARFİNİ GÖSTER
========================================================= */

function showCurrentLetter() {
    if (currentIndex >= TEXT.length) {
        finishTutorial();
        return;
    }

    currentLetter = TEXT[currentIndex];

    if (currentLetter === " ") {
        targetLetter.textContent = "";
        targetLetter.classList.remove("visible");
        currentIndex++;
        setTimeout(showCurrentLetter, 240);
        return;
    }

    targetSegments = createTarget(currentLetter);
    targetPoints = createTargetPoints(targetSegments);

    userPoints = [];
    currentStroke = [];
    completing = false;

    targetLetter.textContent = currentLetter;
    tutorialHint.textContent = `"${currentLetter}" harfini çiz`;
    tutorialProgress.textContent = `${currentIndex + 1} / ${TEXT.length}`;

    targetLetter.classList.remove("visible");
    requestAnimationFrame(() => {
        targetLetter.classList.add("visible");
    });
}


/* =========================================================
   ÇİZİNİN HEDEFE UYUMU
========================================================= */

function calculateCoverage() {
    if (targetPoints.length === 0 || userPoints.length < 5) {
        return 0;
    }

    let covered = 0;
    const stride = Math.max(1, Math.floor(userPoints.length / 500));
    const sampled = userPoints.filter((_, index) => index % stride === 0);

    for (const target of targetPoints) {
        let nearest = Infinity;
        for (const user of sampled) {
            const d = distance(target.x, target.y, user.x, user.y);
            if (d < nearest) {
                nearest = d;
            }
            if (nearest <= HIT_RADIUS) {
                break;
            }
        }
        if (nearest <= HIT_RADIUS) {
            covered++;
        }
    }

    return covered / targetPoints.length;
}


/* =========================================================
   HARF KONTROLÜ
========================================================= */

function checkLetter() {
    if (!tutorialMode || completing || !currentLetter) {
        return;
    }
    if (userPoints.length < 15) {
        return;
    }

    const coverage = calculateCoverage();
    if (coverage >= REQUIRED_COVERAGE) {
        completeLetter();
    }
}


/* =========================================================
   HARF TAMAMLANDI
========================================================= */

function completeLetter() {
    if (completing) {
        return;
    }
    completing = true;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    targetLetter.classList.remove("visible");
    userPoints = [];
    currentStroke = [];

    flowerBurst(centerX, centerY, 34, 105);
    playSuccessSound();

    setTimeout(() => {
        currentIndex++;
        showCurrentLetter();
    }, 420);
}


/* =========================================================
   TUTORIAL BİTİR
========================================================= */

function finishTutorial() {
    tutorialMode = false;
    tutorialFinished = true;
    currentLetter = "";
    targetSegments = [];
    targetPoints = [];
    userPoints = [];
    currentStroke = [];

    targetLetter.classList.remove("visible");
    tutorialHint.textContent = "";
    tutorialProgress.textContent = "";

    flowerBurst(
        window.innerWidth / 2,
        window.innerHeight / 2,
        100,
        Math.min(window.innerWidth, window.innerHeight) * .42
    );

    playFinalSound();

    setTimeout(() => {
        tutorial.classList.add("finished");
        if (message) message.classList.add("show");
        if (clearButton) clearButton.classList.add("show");
    }, 450);

    setTimeout(() => {
        if (message) message.classList.remove("show");
    }, 2800);
}


/* =========================================================
   ÇİÇEK EKLE
========================================================= */

function addFlower(x, y, customSize = null, customLife = null) {
    if (flowers.length >= MAX_FLOWERS) {
        flowers.splice(0, 60);
    }

    flowers.push({
        x,
        y,
        size: customSize ?? (FLOWER_MIN_SIZE + Math.random() * (FLOWER_MAX_SIZE - FLOWER_MIN_SIZE)),
        rotation: Math.random() * Math.PI * 2,
        hue: -8 + Math.random() * 16,
        alpha: .78 + Math.random() * .22,
        phase: Math.random() * Math.PI * 2,
        born: performance.now(),
        life: customLife ?? FLOWER_LIFE
    });
}


/* =========================================================
   ÇİÇEK PATLAMASI
========================================================= */

function flowerBurst(x, y, count, radius) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 15 + Math.pow(Math.random(), .7) * radius;

        addFlower(
            x + Math.cos(angle) * r,
            y + Math.sin(angle) * r,
            9 + Math.random() * 17,
            5000 + Math.random() * 3000
        );
    }

    addFlower(x, y, 30, 7000);
}


/* =========================================================
   ÇİÇEK ÇİZ
========================================================= */

function drawFlower(flower, now) {
    const age = now - flower.born;
    if (age >= flower.life) {
        return false;
    }

    let alpha = flower.alpha;
    const appear = Math.min(1, age / 140);

    if (age > flower.life - FLOWER_FADE) {
        alpha *= (flower.life - age) / FLOWER_FADE;
    }

    const pulse = 1 + Math.sin(now * .0014 + flower.phase) * .025;

    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.rotate(flower.rotation);
    ctx.scale(appear * pulse, appear * pulse);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(100,40,90,.20)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI * 2 / petalCount);

        const gradient = ctx.createLinearGradient(0, -flower.size * .1, 0, -flower.size);
        gradient.addColorStop(0, `hsl(${330 + flower.hue}, 68%, 76%)`);
        gradient.addColorStop(.5, `hsl(${328 + flower.hue}, 65%, 73%)`);
        gradient.addColorStop(1, `hsl(${338 + flower.hue}, 62%, 89%)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -flower.size * .10);
        ctx.bezierCurveTo(
            -flower.size * .48, -flower.size * .43,
            -flower.size * .45, -flower.size * .88,
            0, -flower.size
        );
        ctx.bezierCurveTo(
            flower.size * .45, -flower.size * .88,
            flower.size * .48, -flower.size * .43,
            0, -flower.size * .10
        );
        ctx.fill();
        ctx.restore();
    }

    ctx.shadowBlur = 3;
    const centerGradient = ctx.createRadialGradient(0, 0, 1, 0, 0, flower.size * .27);
    centerGradient.addColorStop(0, "#fff1bd");
    centerGradient.addColorStop(.55, "#f3a46e");
    centerGradient.addColorStop(1, "#d95f82");

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, flower.size * .23, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return true;
}


/* =========================================================
   KULLANICI ÇİZGİSİNİ GÖSTER
========================================================= */

function drawCurrentStroke() {
    if (!tutorialMode || currentStroke.length < 2) {
        return;
    }

    ctx.save();
    ctx.strokeStyle = "rgba(215,76,120,.55)";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
    for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
    }
    ctx.stroke();
    ctx.restore();
}


/* =========================================================
   REHBER ÇİZGİLER
========================================================= */

function drawGuide() {
    if (!tutorialMode || targetSegments.length === 0) {
        return;
    }

    ctx.save();
    ctx.globalAlpha = .10;
    ctx.strokeStyle = "#d95f83";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([7, 9]);

    for (const segment of targetSegments) {
        if (segment.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(segment[0].x, segment[0].y);
        for (let i = 1; i < segment.length; i++) {
            ctx.lineTo(segment[i].x, segment[i].y);
        }
        ctx.stroke();
    }
    ctx.restore();
}


/* =========================================================
   RENDER
========================================================= */

function render(time) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawGuide();
    drawCurrentStroke();

    for (let i = flowers.length - 1; i >= 0; i--) {
        const alive = drawFlower(flowers[i], time);
        if (!alive) {
            flowers.splice(i, 1);
        }
    }

    requestAnimationFrame(render);
}

requestAnimationFrame(render);


/* =========================================================
   POINTER EVENTLERİ
========================================================= */

function startDrawing(event) {
    if (activePointer !== null) return;

    initAudio();

    activePointer = event.pointerId;
    drawing = true;
    currentStroke = [];
    distanceSinceFlower = 0;

    const point = {
        x: event.clientX,
        y: event.clientY
    };

    currentStroke.push(point);
    userPoints.push(point);

    addFlower(
        point.x,
        point.y,
        tutorialMode ? 6 : null,
        tutorialMode ? 1700 : null
    );

    try {
        canvas.setPointerCapture(event.pointerId);
    } catch (error) {}
}

function moveDrawing(event) {
    if (!drawing || event.pointerId !== activePointer) return;

    const last = currentStroke[currentStroke.length - 1];
    if (!last) return;

    const targetX = event.clientX;
    const targetY = event.clientY;
    const dx = targetX - last.x;
    const dy = targetY - last.y;
    const length = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(length / 4));

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = last.x + dx * t;
        const y = last.y + dy * t;
        const previous = currentStroke[currentStroke.length - 1];
        const point = { x, y };

        currentStroke.push(point);
        userPoints.push(point);

        const segmentDistance = distance(previous.x, previous.y, x, y);
        distanceSinceFlower += segmentDistance;

        if (distanceSinceFlower >= FLOWER_DISTANCE) {
            addFlower(
                x,
                y,
                tutorialMode ? 6 : null,
                tutorialMode ? 1700 : null
            );
            distanceSinceFlower = 0;
        }
    }

    if (tutorialMode) {
        checkLetter();
    }
}

function stopDrawing(event) {
    if (activePointer === null) return;
    if (event && event.pointerId !== activePointer) return;

    drawing = false;
    activePointer = null;
    currentStroke = [];
    distanceSinceFlower = 0;

    if (tutorialMode) {
        checkLetter();
    }

    try {
        if (event) {
            canvas.releasePointerCapture(event.pointerId);
        }
    } catch (error) {}
}

canvas.addEventListener("pointerdown", startDrawing, { passive: true });
canvas.addEventListener("pointermove", moveDrawing, { passive: true });
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);


/* =========================================================
   TEMİZLE
========================================================= */

clearButton.addEventListener("click", () => {
    flowers.length = 0;
    userPoints = [];
    currentStroke = [];
    distanceSinceFlower = 0;
});


/* =========================================================
   SES SİSTEMİ
========================================================= */

let audioContext = null;

function initAudio() {
    if (audioContext) {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
        return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext = new AudioContextClass();
}

function playTone(frequency, duration, volume, delay = 0) {
    if (!audioContext) return;
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);

    const start = audioContext.currentTime + delay;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(start);
    oscillator.stop(start + duration + .02);
}

function playSuccessSound() {
    playTone(660, .10, .035);
    playTone(880, .15, .028, .065);
}

function playFinalSound() {
    playTone(523, .13, .045);
    playTone(659, .15, .04, .08);
    playTone(784, .18, .04, .17);
    playTone(1046, .25, .035, .27);
}


/* =========================================================
   BAŞLANGIÇ
========================================================= */

if (message) message.classList.remove("show");
if (clearButton) clearButton.classList.remove("show");

showCurrentLetter();
