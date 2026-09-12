const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const message = document.getElementById("message");
const clearButton = document.getElementById("clearButton");


/* =========================================
   AYARLAR
========================================= */

const FLOWER_DISTANCE = 16;

const MIN_FLOWER_SIZE = 12;
const MAX_FLOWER_SIZE = 25;

const MAX_FLOWERS = 3000;


/* =========================================
   CANVAS BOYUTU
========================================= */

let dpr = Math.min(
    window.devicePixelRatio || 1,
    2
);


function resizeCanvas() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    dpr = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    canvas.width =
        Math.round(width * dpr);

    canvas.height =
        Math.round(height * dpr);

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
   DURUM
========================================= */

let drawing = false;

let activePointer = null;

let lastX = 0;
let lastY = 0;

let distanceSinceFlower = 0;

const flowers = [];


/* =========================================
   YARDIMCI
========================================= */

function random(min, max) {

    return Math.random() *
        (max - min) + min;
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


/* =========================================
   ÇİÇEK OLUŞTUR
========================================= */

function addFlower(x, y) {

    if (
        flowers.length >= MAX_FLOWERS
    ) {

        /*
         * Çok uzun çizimlerde
         * performansı korumak için
         * en eski çiçeği kaldır.
         */

        flowers.shift();
    }


    const flower = {

        x: x,

        y: y,

        size:
            random(
                MIN_FLOWER_SIZE,
                MAX_FLOWER_SIZE
            ),

        rotation:
            random(0, Math.PI * 2),

        hue:
            random(-8, 8),

        alpha:
            random(.78, 1),

        phase:
            random(0, Math.PI * 2)
    };


    flowers.push(flower);
}


/* =========================================
   ÇİÇEK ÇİZ
========================================= */

function drawFlower(
    flower,
    time
) {

    const {
        x,
        y,
        size,
        rotation,
        hue,
        alpha,
        phase
    } = flower;


    /*
     * Çok hafif canlılık.
     *
     * Ama konumu değiştirmiyoruz.
     * Böylece çizilen şekil bozulmuyor.
     */

    const pulse =
        1 +
        Math.sin(
            time * 0.0015 + phase
        ) * 0.035;


    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(rotation);

    ctx.scale(
        pulse,
        pulse
    );


    ctx.globalAlpha = alpha;


    /* -------------------------
       Gölge
    ------------------------- */

    ctx.shadowColor =
        "rgba(100,40,90,.25)";

    ctx.shadowBlur = 6;

    ctx.shadowOffsetY = 3;


    /* -------------------------
       Yapraklar
    ------------------------- */

    const petalCount = 5;

    for (
        let i = 0;
        i < petalCount;
        i++
    ) {

        ctx.save();

        ctx.rotate(
            (Math.PI * 2 / petalCount)
            * i
        );


        const gradient =
            ctx.createLinearGradient(
                0,
                -size * .1,
                0,
                -size
            );


        gradient.addColorStop(
            0,
            `hsl(${330 + hue}, 65%, 78%)`
        );

        gradient.addColorStop(
            .45,
            `hsl(${328 + hue}, 62%, 72%)`
        );

        gradient.addColorStop(
            1,
            `hsl(${332 + hue}, 60%, 88%)`
        );


        ctx.fillStyle = gradient;


        /*
         * Organik yaprak şekli
         */

        ctx.beginPath();

        ctx.moveTo(
            0,
            -size * .15
        );

        ctx.bezierCurveTo(
            -size * .48,
            -size * .45,
            -size * .48,
            -size * .92,
            0,
            -size
        );

        ctx.bezierCurveTo(
            size * .48,
            -size * .92,
            size * .48,
            -size * .45,
            0,
            -size * .15
        );

        ctx.fill();

        ctx.restore();
    }


    /* -------------------------
       Çiçek merkezi
    ------------------------- */

    ctx.shadowBlur = 3;

    const centerGradient =
        ctx.createRadialGradient(
            0,
            0,
            1,
            0,
            0,
            size * .25
        );


    centerGradient.addColorStop(
        0,
        "#ffe8ad"
    );

    centerGradient.addColorStop(
        .55,
        "#f2a56f"
    );

    centerGradient.addColorStop(
        1,
        "#d95f83"
    );


    ctx.fillStyle =
        centerGradient;


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
   TÜM ÇİÇEKLERİ ÇİZ
========================================= */

function render(time) {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    for (
        const flower of flowers
    ) {

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
   ÇİZGİ BOYUNCA ÇİÇEKLER
========================================= */

function drawLine(
    x1,
    y1,
    x2,
    y2
) {

    const dx = x2 - x1;
    const dy = y2 - y1;

    const length =
        Math.hypot(dx, dy);


    if (length === 0) {
        return;
    }


    const steps =
        Math.ceil(
            length / 5
        );


    /*
     * Çok hızlı mouse hareketinde
     * arada boşluk kalmaması için
     * interpolasyon yapıyoruz.
     */

    for (
        let i = 1;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;

        const x =
            x1 + dx * t;

        const y =
            y1 + dy * t;


        const segmentDistance =
            distance(
                lastX,
                lastY,
                x,
                y
            );


        distanceSinceFlower +=
            segmentDistance;


        if (
            distanceSinceFlower
            >= FLOWER_DISTANCE
        ) {

            addFlower(
                x,
                y
            );

            distanceSinceFlower = 0;
        }


        lastX = x;
        lastY = y;
    }
}


/* =========================================
   ÇİZİME BAŞLA
========================================= */

function startDrawing(event) {

    if (
        activePointer !== null
    ) {
        return;
    }


    activePointer =
        event.pointerId;

    drawing = true;


    lastX =
        event.clientX;

    lastY =
        event.clientY;


    distanceSinceFlower = 0;


    message.classList.add(
        "drawing"
    );


    /*
     * İlk çiçek.
     */

    addFlower(
        lastX,
        lastY
    );


    /*
     * Pointer capture:
     *
     * Parmak/mouse alanın dışına
     * biraz çıksa bile çizim
     * kaybolmaz.
     */

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

    if (!drawing) {
        return;
    }


    if (
        event.pointerId !==
        activePointer
    ) {
        return;
    }


    const x =
        event.clientX;

    const y =
        event.clientY;


    drawLine(
        lastX,
        lastY,
        x,
        y
    );
}


/* =========================================
   ÇİZİMİ BİTİR
========================================= */

function stopDrawing(event) {

    if (!drawing) {
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


    message.classList.remove(
        "drawing"
    );


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
   TEMİZLE
========================================= */

clearButton.addEventListener(
    "click",
    () => {

        flowers.length = 0;

        distanceSinceFlower = 0;

    }
);
