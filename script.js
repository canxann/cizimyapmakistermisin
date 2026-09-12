const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");


const message =
    document.getElementById("message");


const clearButton =
    document.getElementById("clearButton");


const tutorial =
    document.getElementById("tutorial");


const tutorialText =
    document.getElementById("tutorialText");


const tutorialHint =
    document.getElementById("tutorialHint");


/* =========================================
   AYARLAR
========================================= */

const FLOWER_DISTANCE = 13;

const MIN_FLOWER_SIZE = 11;
const MAX_FLOWER_SIZE = 23;

const MAX_FLOWERS = 1100;


/*
 * Çiçeklerin yaşam süresi.
 */
const FLOWER_LIFE = 8500;

const FADE_TIME = 1300;


/*
 * Tutorial yazısı.
 */
const TUTORIAL_TEXT =
    "Valorant girl pick me olma";


/*
 * Harflerin çıkış hızı.
 *
 * Daha küçük = daha hızlı.
 */
const LETTER_DELAY = 105;


/* =========================================
   DURUM
========================================= */

let tutorialFinished = false;

let drawing = false;

let activePointer = null;

let lastX = 0;
let lastY = 0;

let distanceSinceFlower = 0;

const flowers = [];


/* =========================================
   CANVAS
========================================= */

let dpr =
    Math.min(
        window.devicePixelRatio || 1,
        2
    );


function resizeCanvas() {

    const width =
        window.innerWidth;

    const height =
        window.innerHeight;


    dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        Math.round(
            width * dpr
        );


    canvas.height =
        Math.round(
            height * dpr
        );


    canvas.style.width =
        width + "px";


    canvas.style.height =
        height + "px";


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


resizeCanvas();


window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================================
   YARDIMCI
========================================= */

function random(min, max) {

    return Math.random() *
        (max - min) +
        min;
}


function distance(
    x1,
    y1,
    x2,
    y2
) {

    return Math.hypot(
        x2 - x1,
        y2 - y1
    );
}


function easeOutCubic(t) {

    return 1 -
        Math.pow(
            1 - t,
            3
        );
}


/* =========================================
   SES SİSTEMİ
========================================= */

let audioContext = null;


/*
 * Kullanıcı etkileşimiyle AudioContext
 * başlatılır.
 */
function initAudio() {

    if (!audioContext) {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {
            return;
        }


        audioContext =
            new AudioContext();
    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


/*
 * Küçük ve tatlı bir bildirim sesi.
 */
function playPopSound() {

    if (!audioContext) {
        return;
    }


    const now =
        audioContext.currentTime;


    const oscillator =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    oscillator.type =
        "sine";


    /*
     * Hafif yukarı çıkan
     * tatlı bir ton.
     */
    oscillator.frequency
        .setValueAtTime(
            520,
            now
        );


    oscillator.frequency
        .exponentialRampToValueAtTime(
            780,
            now + .08
        );


    gain.gain
        .setValueAtTime(
            0.0001,
            now
        );


    gain.gain
        .exponentialRampToValueAtTime(
            0.09,
            now + .015
        );


    gain.gain
        .exponentialRampToValueAtTime(
            0.0001,
            now + .13
        );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start(now);

    oscillator.stop(
        now + .14
    );
}


/*
 * Tutorial tamamlanınca
 * biraz daha güzel bir ses.
 */
function playCompleteSound() {

    if (!audioContext) {
        return;
    }


    const now =
        audioContext.currentTime;


    [0, .09, .18].forEach(
        (offset, index) => {

            const oscillator =
                audioContext
                    .createOscillator();


            const gain =
                audioContext
                    .createGain();


            oscillator.type =
                "sine";


            const frequencies =
                [
                    520,
                    660,
                    820
                ];


            oscillator.frequency
                .setValueAtTime(
                    frequencies[index],
                    now + offset
                );


            gain.gain
                .setValueAtTime(
                    0.0001,
                    now + offset
                );


            gain.gain
                .exponentialRampToValueAtTime(
                    0.08,
                    now + offset + .02
                );


            gain.gain
                .exponentialRampToValueAtTime(
                    0.0001,
                    now + offset + .16
                );


            oscillator.connect(gain);

            gain.connect(
                audioContext.destination
            );


            oscillator.start(
                now + offset
            );


            oscillator.stop(
                now + offset + .17
            );
        }
    );
}


/* =========================================
   TUTORIAL ÇİÇEK PATLAMASI
========================================= */

function tutorialFlowerBurst(
    x,
    y
) {

    /*
     * Büyük merkez çiçek.
     */
    addFlower(
        x,
        y,
        32
    );


    /*
     * Etrafına dairesel
     * çiçek patlaması.
     */
    const count = 16;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            (
                Math.PI * 2 /
                count
            ) * i;


        const radius =
            random(
                35,
                90
            );


        const burstX =
            x +
            Math.cos(angle) *
            radius;


        const burstY =
            y +
            Math.sin(angle) *
            radius;


        addFlower(
            burstX,
            burstY,
            random(13, 27)
        );
    }


    /*
     * Birkaç küçük çiçek daha.
     */
    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const angle =
            random(
                0,
                Math.PI * 2
            );


        const radius =
            random(
                90,
                135
            );


        addFlower(
            x +
            Math.cos(angle) *
            radius,

            y +
            Math.sin(angle) *
            radius,

            random(8, 16)
        );
    }
}


/* =========================================
   ÇİÇEK EKLE
========================================= */

function addFlower(
    x,
    y,
    forcedSize = null
) {

    if (
        flowers.length >=
        MAX_FLOWERS
    ) {

        flowers.shift();
    }


    flowers.push({

        x: x,

        y: y,

        size:
            forcedSize !== null
                ? forcedSize
                : random(
                    MIN_FLOWER_SIZE,
                    MAX_FLOWER_SIZE
                ),

        rotation:
            random(
                0,
                Math.PI * 2
            ),

        hue:
            random(
                -8,
                8
            ),

        alpha:
            random(
                .78,
                1
            ),

        phase:
            random(
                0,
                Math.PI * 2
            ),

        createdAt:
            performance.now(),

        /*
         * Tutorial çiçekleri
         * biraz daha hızlı büyür.
         */
        tutorial:
            !tutorialFinished
    });
}


/* =========================================
   ÇİÇEK ÇİZ
========================================= */

function drawFlower(
    flower,
    time
) {

    const age =
        time -
        flower.createdAt;


    if (
        age >=
        FLOWER_LIFE
    ) {

        return;
    }


    /*
     * Tutorial patlamalarında
     * daha hızlı büyüme.
     */
    const birthDuration =
        flower.tutorial
            ? 180
            : 280;


    const birthProgress =
        Math.min(
            age /
            birthDuration,
            1
        );


    const birthScale =
        easeOutCubic(
            birthProgress
        );


    /* -------------------------------------
       FADE OUT
    ------------------------------------- */

    let lifeAlpha = 1;


    if (
        age >
        FLOWER_LIFE -
        FADE_TIME
    ) {

        lifeAlpha =
            1 -
            (
                age -
                (
                    FLOWER_LIFE -
                    FADE_TIME
                )
            ) /
            FADE_TIME;
    }


    /* -------------------------------------
       HAFİF CANLILIK
    ------------------------------------- */

    const pulse =
        1 +
        Math.sin(
            time * .0015 +
            flower.phase
        ) * .025;


    const scale =
        birthScale *
        pulse;


    const size =
        flower.size;


    ctx.save();


    ctx.translate(
        flower.x,
        flower.y
    );


    ctx.rotate(
        flower.rotation
    );


    ctx.scale(
        scale,
        scale
    );


    ctx.globalAlpha =
        flower.alpha *
        lifeAlpha;


    /* -------------------------------------
       GÖLGE
    ------------------------------------- */

    ctx.shadowColor =
        "rgba(100,40,90,.20)";

    ctx.shadowBlur = 5;

    ctx.shadowOffsetY = 2;


    /* -------------------------------------
       PETALLER
    ------------------------------------- */

    const petalCount = 5;


    for (
        let i = 0;
        i < petalCount;
        i++
    ) {

        ctx.save();


        ctx.rotate(
            (
                Math.PI * 2 /
                petalCount
            ) * i
        );


        const hue =
            328 +
            flower.hue;


        const gradient =
            ctx.createLinearGradient(
                0,
                -size * .1,
                0,
                -size
            );


        gradient.addColorStop(
            0,
            `hsl(${hue},66%,78%)`
        );


        gradient.addColorStop(
            .5,
            `hsl(${hue - 2},63%,72%)`
        );


        gradient.addColorStop(
            1,
            `hsl(${hue + 4},60%,88%)`
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();


        ctx.moveTo(
            0,
            -size * .12
        );


        ctx.bezierCurveTo(
            -size * .45,
            -size * .42,

            -size * .48,
            -size * .88,

            0,
            -size
        );


        ctx.bezierCurveTo(
            size * .48,
            -size * .88,

            size * .45,
            -size * .42,

            0,
            -size * .12
        );


        ctx.fill();


        ctx.restore();
    }


    /* -------------------------------------
       MERKEZ
    ------------------------------------- */

    ctx.shadowBlur = 3;


    const center =
        ctx.createRadialGradient(
            0,
            0,
            1,
            0,
            0,
            size * .27
        );


    center.addColorStop(
        0,
        "#fff0bb"
    );


    center.addColorStop(
        .55,
        "#f4a16e"
    );


    center.addColorStop(
        1,
        "#d95f83"
    );


    ctx.fillStyle =
        center;


    ctx.beginPath();


    ctx.arc(
        0,
        0,
        size * .23,
        0,
        Math.PI * 2
    );


    ctx.fill();


    ctx.restore();
}


/* =========================================
   RENDER
========================================= */

function render(time) {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    for (
        let i =
            flowers.length - 1;

        i >= 0;

        i--
    ) {

        const flower =
            flowers[i];


        if (
            time -
            flower.createdAt
            >=
            FLOWER_LIFE
        ) {

            flowers.splice(
                i,
                1
            );

            continue;
        }


        drawFlower(
            flower,
            time
        );
    }


    requestAnimationFrame(
        render
    );
}


requestAnimationFrame(
    render
);


/* =========================================
   TUTORIAL
========================================= */

async function startTutorial() {

    /*
     * Audio sistemini hazırla.
     */
    initAudio();


    tutorialHint.textContent =
        "Küçük bir şey göstereceğim...";


    /*
     * Biraz bekle.
     */
    await wait(700);


    /*
     * Her harfi tek tek yaz.
     */
    for (
        let i = 0;
        i < TUTORIAL_TEXT.length;
        i++
    ) {

        const character =
            TUTORIAL_TEXT[i];


        tutorialText.textContent =
            TUTORIAL_TEXT.substring(
                0,
                i + 1
            );


        /*
         * Boşluklarda patlama
         * yapmıyoruz.
         */
        if (
            character !== " "
        ) {

            /*
             * Harfin yaklaşık olarak
             * ekrandaki konumunu bul.
             */
            const rect =
                tutorialText
                    .getBoundingClientRect();


            const textWidth =
                rect.width;


            const fontSize =
                parseFloat(
                    getComputedStyle(
                        tutorialText
                    ).fontSize
                );


            /*
             * Son karakterin yaklaşık
             * konumunu hesapla.
             */
            const characterWidth =
                fontSize * .55;


            const currentTextWidth =
                characterWidth *
                (i + 1);


            const x =
                window.innerWidth / 2 -
                textWidth / 2 +
                currentTextWidth -
                characterWidth / 2;


            const y =
                window.innerHeight / 2;


            /*
             * Büyük çiçek patlaması.
             */
            tutorialFlowerBurst(
                x,
                y
            );


            /*
             * Tatlı pop sesi.
             */
            playPopSound();
        }


        await wait(
            LETTER_DELAY
        );
    }


    /* -------------------------------------
       CÜMLE TAMAMLANDI
    ------------------------------------- */

    await wait(700);


    tutorialHint.textContent =
        "Tutorial bitti 🌸";


    playCompleteSound();


    /*
     * Büyük son patlama.
     */
    tutorialFlowerBurst(
        window.innerWidth / 2,
        window.innerHeight / 2
    );


    await wait(1000);


    /*
     * Tutorial yazısını değiştir.
     */
    tutorialText.textContent =
        "Tutorial bitti 🌸";


    tutorialHint.textContent =
        "Artık istediğini çizebilirsin.";


    await wait(1300);


    /*
     * Tutorial kapanıyor.
     */
    tutorial.classList.add(
        "finished"
    );


    /*
     * Çizim artık aktif.
     */
    tutorialFinished = true;


    /*
     * Normal çizim mesajını göster.
     */
    message.classList.add(
        "ready"
    );


    clearButton.classList.add(
        "ready"
    );


    await wait(700);


    /*
     * Tutorial çiçeklerinin
     * etkisi de artık normal.
     */
}


/* =========================================
   BEKLEME
========================================= */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* =========================================
   ÇİZGİ
========================================= */

function drawLine(
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        x2 - x1;


    const dy =
        y2 - y1;


    const length =
        Math.hypot(
            dx,
            dy
        );


    if (
        length === 0
    ) {

        return;
    }


    /*
     * Çok sık örnekleme.
     */
    const steps =
        Math.ceil(
            length / 3
        );


    for (
        let i = 1;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;


        const x =
            x1 +
            dx * t;


        const y =
            y1 +
            dy * t;


        const segment =
            distance(
                lastX,
                lastY,
                x,
                y
            );


        distanceSinceFlower +=
            segment;


        while (
            distanceSinceFlower >=
            FLOWER_DISTANCE
        ) {

            const ratio =
                FLOWER_DISTANCE /
                distanceSinceFlower;


            const flowerX =
                lastX +
                (
                    x -
                    lastX
                ) *
                ratio;


            const flowerY =
                lastY +
                (
                    y -
                    lastY
                ) *
                ratio;


            addFlower(
                flowerX,
                flowerY
            );


            distanceSinceFlower -=
                FLOWER_DISTANCE;


            lastX =
                flowerX;


            lastY =
                flowerY;
        }


        lastX = x;

        lastY = y;
    }
}


/* =========================================
   ÇİZİME BAŞLA
========================================= */

function startDrawing(event) {

    /*
     * Tutorial bitmediyse çizme.
     */
    if (
        !tutorialFinished
    ) {

        return;
    }


    if (
        activePointer !== null
    ) {

        return;
    }


    /*
     * İlk kullanıcı hareketinde
     * sesi garantiye al.
     */
    initAudio();


    activePointer =
        event.pointerId;


    drawing = true;


    lastX =
        event.clientX;


    lastY =
        event.clientY;


    distanceSinceFlower = 0;


    message.classList.remove(
        "ready"
    );


    message.classList.add(
        "drawing"
    );


    addFlower(
        lastX,
        lastY
    );


    try {

        canvas.setPointerCapture(
            event.pointerId
        );

    } catch (error) {}
}


/* =========================================
   ÇİZ
========================================= */

function moveDrawing(event) {

    if (
        !drawing
    ) {

        return;
    }


    if (
        event.pointerId !==
        activePointer
    ) {

        return;
    }


    drawLine(
        lastX,
        lastY,
        event.clientX,
        event.clientY
    );
}


/* =========================================
   ÇİZİMİ BİTİR
========================================= */

function stopDrawing(event) {

    if (
        !drawing
    ) {

        return;
    }


    if (
        event &&
        event.pointerId !==
        activePointer
    ) {

        return;
    }


    drawing = false;

    activePointer = null;


    try {

        if (event) {

            canvas.releasePointerCapture(
                event.pointerId
            );
        }

    } catch (error) {}
}


/* =========================================
   POINTER EVENTLERİ
========================================= */

canvas.addEventListener(
    "pointerdown",
    startDrawing
);


canvas.addEventListener(
    "pointermove",
    moveDrawing
);


canvas.addEventListener(
    "pointerup",
    stopDrawing
);


canvas.addEventListener(
    "pointercancel",
    stopDrawing
);


/* =========================================
   FOCUS KAYBI
========================================= */

window.addEventListener(
    "blur",
    () => {

        drawing = false;

        activePointer = null;
    }
);


/* =========================================
   TEMİZLE
========================================= */

clearButton.addEventListener(
    "click",
    () => {

        flowers.length = 0;


        distanceSinceFlower = 0;


        drawing = false;


        activePointer = null;


        /*
         * Çizim mesajını tekrar göster.
         */
        message.classList.remove(
            "drawing"
        );


        message.classList.add(
            "ready"
        );
    }
);


/* =========================================
   BAŞLAT
========================================= */

startTutorial();
