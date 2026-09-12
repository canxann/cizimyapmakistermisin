const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Görsel harfi gizli bir offscreen canvas'ta analiz için çizmek üzere hazırlıyoruz
const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });

const tutorialHint = document.getElementById("tutorialHint");
const targetLetter = document.getElementById("targetLetter");
const tutorialProgress = document.getElementById("tutorialProgress");
const message = document.getElementById("message");
const clearButton = document.getElementById("clearButton");

// Boşluklar hariç tüm harfleri sırayla işleyeceğiz
const RAW_TEXT = "VALORANT GIRL PICK ME OLMA";
const LETTERS_LIST = RAW_TEXT.split(""); // Her bir karakter (boşluklar dahil)

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

function showCurrentLetter() {
    if (currentIndex >= LETTERS_LIST.length) {
        tutorialMode = false;
        targetLetter.classList.remove("visible");
        tutorialHint.textContent = "";
        tutorialProgress.textContent = "";
        message.classList.add("show");
        clearButton.classList.add("show");
        setTimeout(() => message.classList.remove("show"), 3000);
        return;
    }

    const char = LETTERS_LIST[currentIndex];
    
    // Eğer karakter boşluksa, otomatik geç ve çiçekleri temizle
    if (char === " ") {
        flowers = [];
        targetLetter.textContent = "";
        currentIndex++;
        showCurrentLetter();
        return;
    }

    // Yeni harfe geçerken ekranı ve önceki çiçekleri tamamen tertemiz yapıyoruz
    flowers = [];

    targetLetter.textContent = char;
    tutorialHint.textContent = `"${char}" harfinin içini çiçeklerle doldur`;
    tutorialProgress.textContent = `${currentIndex + 1} / ${LETTERS_LIST.length}`;
    targetLetter.classList.add("visible");
}

function addFlower(x, y) {
    if (flowers.length > 2000) flowers.shift();
    flowers.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        size: 12 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        hue: -12 + Math.random() * 24,
        born: performance.now(),
        life: 15000
    });
}

function drawFlower(flower, now) {
    const age = now - flower.born;
    if (age >= flower.life) return false;

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

// Harfin iç kısmının doldurulup doldurulmadığını kontrol eden akıllı fonksiyon
function checkLetterFilling() {
    if (!tutorialMode) return;

    const char = LETTERS_LIST[currentIndex];
    if (!char || char === " ") return;

    // Offscreen canvas'a güncel harfi tam ekranda ortalayarak çiziyoruz
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
    offCtx.font = "900 " + Math.min(window.innerWidth * 0.35, 280) + "px Arial, sans-serif";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "#000000";
    offCtx.fillText(char, offCanvas.width / 2, offCanvas.height / 2);

    // Harfin piksel haritasını alıp, kullanıcının çiçeklerinin harf sınırları içinde kalma oranını ölçüyoruz
    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    let totalLetterPixels = 0;
    let coveredPixels = 0;

    // Performans için her 4 pikselde bir örneklem alıyoruz
    for (let y = 0; y < offCanvas.height; y += 4) {
        for (let x = 0; x < offCanvas.width; x += 4) {
            const index = (y * offCanvas.width + x) * 4;
            // Siyah renk harf piksellerini temsil eder (alpha > 120)
            if (data[index + 3] > 120) {
                totalLetterPixels++;

                // Bu harf pikselinin üzerinde yeterince yakın bir çiçek var mı?
                let covered = false;
                for (let f = 0; f < flowers.length; f++) {
                    const fl = flowers[f];
                    const dx = fl.x - x;
                    const dy = fl.y - y;
                    if (dx * dx + dy * dy < (fl.size * 1.2) * (fl.size * 1.2)) {
                        covered = true;
                        break;
                    }
                }
                if (covered) {
                    coveredPixels++;
                }
            }
        }
    }

    if (totalLetterPixels > 0) {
        const fillPercentage = coveredPixels / totalLetterPixels;
        // Harfin içi yaklaşık %40-45 oranında dolduğunda başarıyla sonraki harfe geçilir
        if (fillPercentage >= 0.42) {
            targetLetter.classList.remove("visible");
            currentIndex++;
            setTimeout(showCurrentLetter, 300);
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

// Pointer Olayları
canvas.addEventListener("pointerdown", (e) => {
    activePointer = e.pointerId;
    drawing = true;
    distanceSinceFlower = 0;
    addFlower(e.clientX, e.clientY);
    if (tutorialMode) checkLetterFilling();
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing || e.pointerId !== activePointer) return;
    
    // Hareket boyunca aralıklarla çiçek ekle
    const lastFlower = flowers[flowers.length - 1];
    if (lastFlower) {
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
